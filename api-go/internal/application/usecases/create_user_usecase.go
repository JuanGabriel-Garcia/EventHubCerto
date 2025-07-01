package usecases

import (
	"github.com/Gabriel-Schiestl/api-go/internal/application/dtos"
	"github.com/Gabriel-Schiestl/api-go/internal/domain/models"
	"github.com/Gabriel-Schiestl/api-go/internal/domain/repositories"
	"github.com/Gabriel-Schiestl/api-go/internal/utils"
)

type createUserUseCase struct {
	repo repositories.UserRepository
	authRepo repositories.AuthRepository
}

func NewCreateUserUseCase(repo repositories.UserRepository, authRepo repositories.AuthRepository) *createUserUseCase {
	return &createUserUseCase{repo: repo, authRepo: authRepo}
}

func (uc *createUserUseCase) Execute(props dtos.CreateUserDTO) (*dtos.UserResponseDTO, error) {
	user := models.NewUser(models.UserProps{
		Name:  &props.Name,
		Email: &props.Email,
	})

	err := uc.repo.Create(user)
	if err != nil {
		return nil, err
	}

	hashedPassword, err := utils.HashPassword(props.Password)
	if err != nil {
		return nil, err
	}

	auth := models.NewAuth(models.AuthProps{
		Email:    &props.Email,
		Password: &hashedPassword,
	})

	err = uc.authRepo.Create(auth)
	if err != nil {
		return nil, err
	}

	return &dtos.UserResponseDTO{
		ID:        user.GetID(),
		Name:      user.GetName(),
		Email:     user.GetEmail(),
		CreatedAt: user.GetCreatedAt().Format("2006-01-02T15:04:05Z07:00"),
	}, nil
}
