package middlewares

import (
	"net/http"

	"github.com/Gabriel-Schiestl/api-go/internal/infra/database"
	"github.com/Gabriel-Schiestl/api-go/internal/infra/database/connection"
	"github.com/Gabriel-Schiestl/api-go/internal/infra/mappers"
	"github.com/Gabriel-Schiestl/api-go/internal/infra/ports"
	"github.com/gin-gonic/gin"
)

func AuthMiddleware() gin.HandlerFunc {
	service := ports.NewJWTService()

	return func(c *gin.Context) {
		if c.FullPath() == "/auth/login" || c.FullPath() == "/auth/logout" || (c.FullPath() == "/users/" && c.Request.Method == "POST") {
			c.Next()
			return
		}

		authToken, err := c.Cookie("Authorization")

		if authToken == "" || err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Token not provided"})
			c.Abort()
			return
		}

		claims, err := service.ExtractClaims(authToken)
		if err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid token"})
			c.Abort()
			return
		}

		user, err := database.NewUserRepository(connection.Db, mappers.UserMapper{}).FindById(claims["sub"].(string))
		if err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "User not found"})
			c.Abort()
			return
		}

		c.Set("userID", user.GetID())
		c.Next()
	}
}