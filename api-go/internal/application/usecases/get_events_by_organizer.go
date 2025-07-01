package usecases

import (
	"github.com/Gabriel-Schiestl/api-go/internal/application/dtos"
	"github.com/Gabriel-Schiestl/api-go/internal/domain/repositories"
)

type GetEventsByOrganizerUseCase struct {
	eventRepo repositories.IEventRepository
}

func NewGetEventsByOrganizerUseCase(eventRepo repositories.IEventRepository) *GetEventsByOrganizerUseCase {
	return &GetEventsByOrganizerUseCase{
		eventRepo: eventRepo,
	}
}

func (uc *GetEventsByOrganizerUseCase) Execute(organizerId string) ([]dtos.EventDto, error) {
	events, err := uc.eventRepo.FindByOrganizerID(organizerId)
	if err != nil {
		return nil, err
	}

	var eventDtos []dtos.EventDto
	for _, event := range events {
		eventDtos = append(eventDtos, dtos.EventDto{
			ID:          event.ID(),
			Name:        event.Name(),
			Description: event.Description(),
			Location:    event.Location(),
			Date:        event.Date(),
			OrganizerID: event.OrganizerID(),
			Attendees:   event.Attendees(),
			CreatedAt:   event.CreatedAt(),
			Category: 	 event.Category(),
		})
	}
	
	return eventDtos, nil
}