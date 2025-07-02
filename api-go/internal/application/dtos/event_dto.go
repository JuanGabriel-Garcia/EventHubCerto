package dtos

import "time"

type EventDto struct {
	ID          string    `json:"id"`
	Name        string    `json:"name"`
	Location    string    `json:"location"`
	Date        time.Time `json:"date"`
	Description string    `json:"description"`
	OrganizerID string    `json:"organizer_id"`
	Attendees   []string  `json:"attendees"`
	CreatedAt   time.Time    `json:"created_at"`
	Category	string    `json:"category"`
	Limit 	 int       `json:"limit"`
}

type CreateEventProps struct {
	Name        string    `json:"name"`
    Location    string    `json:"location"`
    Date        string    `json:"date"`
    Description string    `json:"description"`
    OrganizerID string    
    Category    string    `json:"category"`
    Limit       int       `json:"limit"`
}

type EventWithAttendeesDto struct {
	ID          string    `json:"id"`
	Name        string    `json:"name"`
	Location    string    `json:"location"`
	Date        time.Time `json:"date"`
	Description string    `json:"description"`
	Organizer UserResponseDTO    `json:"organizer"`
	Attendees   []UserResponseDTO `json:"attendees"`
	CreatedAt   time.Time `json:"created_at"`
	Category	string    `json:"category"`
	Limit 	 int       `json:"limit"`
}

type UpdateEventProps struct {
	EventID     string    `json:"event_id"`
	Name        string    `json:"name"`
	Location    string    `json:"location"`
	Date        string    `json:"date"`
	Description string    `json:"description"`
	OrganizerID string    
	Category    string    `json:"category"`
	Limit       int       `json:"limit"`
}