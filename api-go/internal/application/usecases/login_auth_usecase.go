package usecases

import (
	"github.com/Gabriel-Schiestl/api-go/internal/application/dtos"
	"github.com/Gabriel-Schiestl/api-go/internal/domain/repositories"
	"github.com/Gabriel-Schiestl/api-go/internal/domain/services"
	"github.com/Gabriel-Schiestl/api-go/internal/utils"
)

type loginUseCase struct {
	authRepo repositories.AuthRepository
	userRepo repositories.UserRepository
	jwtService services.IJWTService
}

func NewLoginUseCase(authRepo repositories.AuthRepository, userRepo repositories.UserRepository, jwtService services.IJWTService) *loginUseCase {
	return &loginUseCase{authRepo: authRepo, userRepo: userRepo, jwtService: jwtService}
}

func (uc *loginUseCase) Execute(props dtos.LoginDto) (*string, error) {
	user, err := uc.userRepo.FindByEmail(props.Email)
	if err != nil {
		return nil, err
	}

	auth, err := uc.authRepo.FindByEmail(props.Email)
	if err != nil {
		return nil, err
	}

	var token *string
	if auth != nil && utils.CheckPasswordHash(props.Password, auth.GetPassword()) {
		token, err = uc.jwtService.GenerateToken(user.GetID())
		if err != nil {
			return nil, err
		}
	}
	
	return token, nil
}
