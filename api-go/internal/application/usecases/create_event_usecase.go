package usecases

import (
	"time"

	"github.com/Gabriel-Schiestl/api-go/internal/application/dtos"
	"github.com/Gabriel-Schiestl/api-go/internal/domain/models"
	"github.com/Gabriel-Schiestl/api-go/internal/domain/repositories"
)

type createEventUseCase struct{
	eventRepository repositories.IEventRepository
}

func NewCreateEventUseCase(eventRepository repositories.IEventRepository) *createEventUseCase {
	return &createEventUseCase{
		eventRepository: eventRepository,
	}
}



func (uc *createEventUseCase) Execute(props dtos.CreateEventProps) (*dtos.EventDto, error) {
	var event models.Event

	parsedDate, err := time.Parse("2006-01-02T15:04", props.Date)
	if err != nil {
		return nil, err
	}
	parsedDate = parsedDate.UTC()

	event, businessErr := models.NewEvent(models.EventProps{
		Name:        &props.Name,
		Location:    &props.Location,
		Date:        &parsedDate,
		Description: &props.Description,
		OrganizerID: &props.OrganizerID,
		Category: 	 &props.Category,
		Limit:       &props.Limit,
	}); 
	if businessErr != nil {
		return nil, businessErr
	}

	saveErr := uc.eventRepository.Save(event)
	if saveErr != nil {
		return nil, saveErr
	}

	return &dtos.EventDto{
		ID:          event.ID(),
		Name:        event.Name(),
		Location:    event.Location(),
		Date:        event.Date(),
		Description: event.Description(),
		OrganizerID: event.OrganizerID(),
		Attendees:   event.Attendees(),
		CreatedAt:   event.CreatedAt(),
		Category: 	 event.Category(),
	}, nil
}