package mappers

import (
	"github.com/Gabriel-Schiestl/api-go/internal/domain/models"
	"github.com/Gabriel-Schiestl/api-go/internal/infra/entities"
)

type UserMapper struct{}
func (m UserMapper) DomainToModel(user models.User) *entities.User {
	return &entities.User{
		ID:        user.GetID(),
		Name:      user.GetName(),
		Email:     user.GetEmail(),
		CreatedAt: user.GetCreatedAt(),
	}
}

func (m UserMapper) ModelToDomain(entity *entities.User) models.User {
	return models.NewUser(models.UserProps{
		ID:        &entity.ID,
		Name:      &entity.Name,
		Email:     &entity.Email,
		CreatedAt: &entity.CreatedAt,
	})
}
