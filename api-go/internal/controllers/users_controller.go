package controllers

import (
	"net/http"

	"github.com/Gabriel-Schiestl/api-go/internal/application/dtos"
	r "github.com/Gabriel-Schiestl/api-go/internal/server"
	"github.com/Gabriel-Schiestl/go-clarch/application/usecase"
	"github.com/gin-gonic/gin"
)

type UsersController struct {
	createUserUseCase usecase.UseCaseWithPropsDecorator[dtos.CreateUserDTO, *dtos.UserResponseDTO]
	getUsersUseCase   usecase.UseCaseDecorator[[]dtos.UserResponseDTO]
	getUserUseCase   usecase.UseCaseWithPropsDecorator[string, dtos.UserResponseDTO]
}

func NewUsersController(createUC usecase.UseCaseWithPropsDecorator[dtos.CreateUserDTO, *dtos.UserResponseDTO], getUC usecase.UseCaseDecorator[[]dtos.UserResponseDTO], getUserUC usecase.UseCaseWithPropsDecorator[string, dtos.UserResponseDTO]) *UsersController {
	return &UsersController{
		createUserUseCase: createUC,
		getUsersUseCase:   getUC,
		getUserUseCase:   getUserUC,
	}
}

func (c *UsersController) RegisterRoutes(r *gin.Engine) {
	users := r.Group("/users")
	{
		users.POST("", c.CreateUser)
		users.GET("", c.GetUsers)
	}
}

func (c *UsersController) CreateUser(ctx *gin.Context) {
	var input dtos.CreateUserDTO
	if err := ctx.ShouldBindJSON(&input); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	_, err := c.createUserUseCase.Execute(input)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	ctx.Status(http.StatusCreated)
}

func (c *UsersController) GetUser(ctx *gin.Context) {
	id := ctx.Param("ID")
	if id == "" {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "User ID is required"})
		return
	}

	user, err := c.getUserUseCase.Execute(id)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	ctx.JSON(http.StatusOK, user)
}

func (c *UsersController) GetUsers(ctx *gin.Context) {
	users, err := c.getUsersUseCase.Execute()
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	ctx.JSON(http.StatusOK, users)
}

func (c *UsersController) SetupRoutes() {
	group := r.Router.Group("/users")

	group.GET("/", c.GetUsers)
	group.GET("/:ID", c.GetUser)
	group.POST("/", c.CreateUser)
}
