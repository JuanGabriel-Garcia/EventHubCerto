package usecases

import (
	"sync"

	"github.com/Gabriel-Schiestl/api-go/internal/application/dtos"
	"github.com/Gabriel-Schiestl/api-go/internal/domain/models"
	"github.com/Gabriel-Schiestl/api-go/internal/domain/repositories"
)

type getEventByIdUseCase struct {
	eventRepo repositories.IEventRepository
	userRepo  repositories.UserRepository
}

func NewGetEventByIdUseCase(eventRepo repositories.IEventRepository, userRepo repositories.UserRepository) *getEventByIdUseCase {
	return &getEventByIdUseCase{
		eventRepo: eventRepo,
		userRepo:  userRepo,
	}
}

type GetEventByIdUseCaseProps struct {
	EventID string
	UserID  string
}

func (uc *getEventByIdUseCase) Execute(props GetEventByIdUseCaseProps) (dtos.EventWithAttendeesDto, error) {
	event, err := uc.eventRepo.FindByID(props.EventID)
	if err != nil {
		return dtos.EventWithAttendeesDto{}, err
	}

	eventDto := dtos.EventWithAttendeesDto{
		ID:          event.ID(),
		Name:        event.Name(),
		Description: event.Description(),
		Location:    event.Location(),
		Date:        event.Date(),
		OrganizerID: event.OrganizerID(),
		CreatedAt:   event.CreatedAt(),
		Category: 	 event.Category(),
		Limit:       event.Limit(),
	}

	if event.OrganizerID() != props.UserID {
		return eventDto, nil
	}

	usersChan := make(chan models.User)
	wg := sync.WaitGroup{}

	for _, attendeeId := range event.Attendees() {
		wg.Add(1)
		go func(attendeeId string) {
			defer wg.Done()

			user, err := uc.userRepo.FindById(attendeeId)
			if err != nil {
				usersChan <- nil
				return
			}

			usersChan <- user
		}(attendeeId)
	}

	go func() {
		wg.Wait()
		close(usersChan)
	}()

	var users []dtos.UserResponseDTO
	for user := range usersChan {
		if user != nil {
			users = append(users, dtos.UserResponseDTO{
				ID:        user.GetID(),
				Email:     user.GetEmail(),
				Name: user.GetName(),
				CreatedAt: user.GetCreatedAt().String(),
			})
		}
	}

	eventDto.Attendees = users
	
	return eventDto, nil
}
