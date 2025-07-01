package dtos

type LoginDto struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

type AuthResponseDTO struct {
	ID        string `json:"id"`
	Email     string `json:"email"`
	CreatedAt string `json:"created_at"`
}
