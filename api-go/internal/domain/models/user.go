package models

import (
	"time"

	"github.com/google/uuid"
)

type UserProps struct {
	ID        *string
	Name      *string
	Email     *string
	CreatedAt *time.Time
}

type user struct {
	id        string
	name      string
	email     string
	createdAt time.Time
}

type User interface {
	GetID() string
	GetName() string
	GetEmail() string
	GetCreatedAt() time.Time
}

func NewUser(props UserProps) User {
	id := uuid.New().String()
	if props.ID != nil {
		id = *props.ID
	}
	createdAt := time.Now()
	if props.CreatedAt != nil {
		createdAt = *props.CreatedAt
	}
	return user{
		id:        id,
		name:      derefString(props.Name),
		email:     derefString(props.Email),
		createdAt: createdAt,
	}
}

func (u user) GetID() string        { return u.id }
func (u user) GetName() string      { return u.name }
func (u user) GetEmail() string     { return u.email }
func (u user) GetCreatedAt() time.Time { return u.createdAt }
