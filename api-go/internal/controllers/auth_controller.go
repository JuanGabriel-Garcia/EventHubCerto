package controllers

import (
	"net/http"

	"github.com/Gabriel-Schiestl/api-go/internal/application/dtos"
	r "github.com/Gabriel-Schiestl/api-go/internal/server"
	"github.com/Gabriel-Schiestl/go-clarch/application/usecase"
	"github.com/gin-gonic/gin"
)

type AuthController struct {
	getAuthsUseCase   usecase.UseCaseDecorator[[]dtos.AuthResponseDTO]
	loginUseCase  usecase.UseCaseWithPropsDecorator[dtos.LoginDto, *string]
}

func NewAuthController(getUC usecase.UseCaseDecorator[[]dtos.AuthResponseDTO], loginUC usecase.UseCaseWithPropsDecorator[dtos.LoginDto, *string]) *AuthController {
	return &AuthController{
		getAuthsUseCase:   getUC,
		loginUseCase:  loginUC,
	}
}

func (c *AuthController) GetAuths(ctx *gin.Context) {
	dtos, err := c.getAuthsUseCase.Execute()
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	ctx.JSON(http.StatusOK, dtos)
}

func (c *AuthController) Login(ctx *gin.Context) {
	var input dtos.LoginDto
	if err := ctx.ShouldBindJSON(&input); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	token, err := c.loginUseCase.Execute(input)
	if err != nil {
		ctx.JSON(http.StatusUnauthorized, gin.H{"error": err.Error()})
		return
	}

	ctx.SetCookie("Authorization", *token, 3600, "/", "", false, true)

	ctx.JSON(http.StatusOK, gin.H{
		"token":   *token,
	})
}

func (c *AuthController) SetupRoutes() {
	group := r.Router.Group("/auth")

	group.GET("/", c.GetAuths)
	group.POST("/login", c.Login)
	group.GET("/logout", func(ctx *gin.Context) {
		ctx.SetCookie("Authorization", "", -1, "/", "", false, true)
		ctx.JSON(http.StatusOK, gin.H{"message": "Logged out successfully"})
	})
	group.GET("/check", func(ctx *gin.Context) {
		userID, exists := ctx.Get("userID")
		if !exists {
			ctx.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
			return
		}

		ctx.JSON(http.StatusOK, gin.H{"userID": userID})
	})
}
