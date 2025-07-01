package entities

import "time"

type User struct {
	ID        string    `gorm:"primaryKey"`
	Name      string `gorm:"not null;type:varchar(255)"`
	Email     string `gorm:"not null;type:varchar(255)"`
	CreatedAt time.Time `gorm:"autoCreateTime;not null"`
}
