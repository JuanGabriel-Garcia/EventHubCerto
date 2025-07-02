package usecases

import (
	"time"

	"github.com/Gabriel-Schiestl/api-go/internal/application/dtos"
	"github.com/Gabriel-Schiestl/api-go/internal/domain/models"
	"github.com/Gabriel-Schiestl/api-go/internal/domain/repositories"
	"github.com/Gabriel-Schiestl/go-clarch/domain/exceptions"
)

type updateEventUseCase struct {
	eventRepository repositories.IEventRepository
}

func NewUpdateEventUseCase(eventRepository repositories.IEventRepository) *updateEventUseCase {
	return &updateEventUseCase{
		eventRepository: eventRepository,
	}
}

func (uc *updateEventUseCase) Execute(props dtos.UpdateEventProps) (*dtos.EventDto, error) {
	// Verifica se o evento existe
	existingEvent, err := uc.eventRepository.FindByID(props.EventID)
	if err != nil {
		return nil, err
	}

	
	// Verifica se o usuário é o organizador do evento
	if existingEvent.OrganizerID() != props.OrganizerID {
		return nil, exceptions.NewBusinessException("User is not authorized to update this event")
	}

	// Parse da data
	parsedDate, err := time.Parse("2006-01-02T15:04", props.Date)
	if err != nil {
		return nil, err
	}

	parsedDate = parsedDate.UTC()

	// Cria o evento atualizado mantendo ID, attendees e createdAt originais
	originalCreatedAt := existingEvent.CreatedAt()
	updatedEvent, businessErr := models.NewEvent(models.EventProps{
		ID:          &props.EventID,
		Name:        &props.Name,
		Location:    &props.Location,
		Date:        &parsedDate,
		Description: &props.Description,
		OrganizerID: &props.OrganizerID,
		Category:    &props.Category,
		Limit:       &props.Limit,
		Attendees:   existingEvent.Attendees(),
		CreatedAt:   &originalCreatedAt,
	})
	if businessErr != nil {
		return nil, businessErr
	}

	saveErr := uc.eventRepository.Save(updatedEvent)
	if saveErr != nil {
		return nil, saveErr
	}

	return &dtos.EventDto{
		ID:          updatedEvent.ID(),
		Name:        updatedEvent.Name(),
		Location:    updatedEvent.Location(),
		Date:        updatedEvent.Date(),
		Description: updatedEvent.Description(),
		OrganizerID: updatedEvent.OrganizerID(),
		Attendees:   updatedEvent.Attendees(),
		CreatedAt:   updatedEvent.CreatedAt(),
		Category:    updatedEvent.Category(),
		Limit:       updatedEvent.Limit(),
	}, nil
}
