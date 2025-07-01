package database

import (
	"fmt"

	"github.com/Gabriel-Schiestl/api-go/internal/domain/models"
	"github.com/Gabriel-Schiestl/api-go/internal/domain/repositories"
	"github.com/Gabriel-Schiestl/api-go/internal/infra/entities"
	"github.com/Gabriel-Schiestl/api-go/internal/infra/mappers"
	"github.com/Gabriel-Schiestl/go-clarch/domain/exceptions"
	"gorm.io/gorm"
)

var errorLoadingEvent = "Error loading event: %v"

type eventRepositoryImpl struct {
	db *gorm.DB
	mapper mappers.EventMapper
}

func NewEventRepository(db *gorm.DB, mapper mappers.EventMapper) repositories.IEventRepository {
	return eventRepositoryImpl{
		db: db,
		mapper: mapper,
	}
}

func (r eventRepositoryImpl) FindByID(id string) (models.Event, error) {
	var event entities.Event
	if err := r.db.First(&event, "id = ?", id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, exceptions.NewRepositoryNoDataFoundException(fmt.Sprintf("Event with ID %s not found", id))
		}

		return nil, exceptions.NewTechnicalException(fmt.Sprintf("Error retrieving event with ID %s: %v", id, err))
	}

	domain, err := r.mapper.ModelToDomain(event)
	if err != nil {
		return nil, err
	}

	return domain, nil
}

func (r eventRepositoryImpl) FindAll() ([]models.Event, error) {
	var events []entities.Event

	if err := r.db.Find(&events).Error; err != nil {
		return nil, exceptions.NewTechnicalException(fmt.Sprintf("Error retrieving events: %v", err))
	}

	if len(events) == 0 {
		return nil, exceptions.NewRepositoryNoDataFoundException("No events found")
	}

	var domainEvents []models.Event
	for _, event := range events {
		domain, err := r.mapper.ModelToDomain(event)
		if err != nil {
			fmt.Printf(errorLoadingEvent, err)
			return nil, err
		}

		domainEvents = append(domainEvents, domain)
	}

	return domainEvents, nil
}

func (r eventRepositoryImpl) FindByAttendee(userID string) ([]models.Event, error) {
	var events []entities.Event

	query := `
        SELECT * FROM events 
        WHERE EXISTS (
            SELECT 1 FROM json_array_elements_text(attendees) AS attendee 
            WHERE attendee = ?
        )
    `

	if err := r.db.Raw(query, userID).Scan(&events).Error; err != nil {
		return nil, exceptions.NewTechnicalException(fmt.Sprintf("Error retrieving events for user ID %s: %v", userID, err))
	}

	if len(events) == 0 {
		return nil, exceptions.NewRepositoryNoDataFoundException(fmt.Sprintf("No events found for user ID %s", userID))
	}

	var domainEvents []models.Event
	for _, event := range events {
		domain, err := r.mapper.ModelToDomain(event)
		if err != nil {
			fmt.Printf(errorLoadingEvent, err)
			return nil, err
		}

		domainEvents = append(domainEvents, domain)
	}

	return domainEvents, nil
}

func (r eventRepositoryImpl) FindByOrganizerID(organizerID string) ([]models.Event, error) {
	var events []entities.Event

	if err := r.db.Where("organizer_id = ?", organizerID).Find(&events).Error; err != nil {
		return nil, exceptions.NewTechnicalException(fmt.Sprintf("Error retrieving events for organizer ID %s: %v", organizerID, err))
	}

	if len(events) == 0 {
		return nil, exceptions.NewRepositoryNoDataFoundException(fmt.Sprintf("No events found for organizer ID %s", organizerID))
	}

	var domainEvents []models.Event
	for _, event := range events {
		domain, err := r.mapper.ModelToDomain(event)
		if err != nil {
			fmt.Printf(errorLoadingEvent, err)
			return nil, err
		}

		domainEvents = append(domainEvents, domain)
	}

	return domainEvents, nil
}

func (r eventRepositoryImpl) FindEventByOrganizerID(eventID, organizerID string) (models.Event, error) {
	var event entities.Event

	if err := r.db.Where("id = ? AND organizer_id = ?", eventID, organizerID).First(&event).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, exceptions.NewRepositoryNoDataFoundException(fmt.Sprintf("Event with ID %s not found for organizer ID %s", eventID, organizerID))
		}
		return nil, exceptions.NewTechnicalException(fmt.Sprintf("Error retrieving event with ID %s for organizer ID %s: %v", eventID, organizerID, err))
	}

	domain, err := r.mapper.ModelToDomain(event)
	if err != nil {
		return nil, err
	}

	return domain, nil
}

func (r eventRepositoryImpl) FindByCategory(category string) ([]models.Event, error) {
	var events []entities.Event

	if err := r.db.Where("category = ?", category).Find(&events).Error; err != nil {
		return nil, exceptions.NewTechnicalException(fmt.Sprintf("Error retrieving events for category %s: %v", category, err))
	}

	if len(events) == 0 {
		return nil, exceptions.NewRepositoryNoDataFoundException(fmt.Sprintf("No events found for category %s", category))
	}

	var domainEvents []models.Event
	for _, event := range events {
		domain, err := r.mapper.ModelToDomain(event)
		if err != nil {
			fmt.Printf(errorLoadingEvent, err)
			return nil, err
		}

		domainEvents = append(domainEvents, domain)
	}

	return domainEvents, nil
}

func (r eventRepositoryImpl) FindByTerm(term string) ([]models.Event, error) {
	var events []entities.Event

	if err := r.db.Where("name LIKE ? OR description LIKE ?", "%"+term+"%", "%"+term+"%").Find(&events).Error; err != nil {
		return nil, exceptions.NewTechnicalException(fmt.Sprintf("Error retrieving events by term %s: %v", term, err))
	}

	if len(events) == 0 {
		return nil, exceptions.NewRepositoryNoDataFoundException(fmt.Sprintf("No events found for term %s", term))
	}

	var domainEvents []models.Event
	for _, event := range events {
		domain, err := r.mapper.ModelToDomain(event)
		if err != nil {
			fmt.Printf(errorLoadingEvent, err)
			return nil, err
		}

		domainEvents = append(domainEvents, domain)
	}

	return domainEvents, nil
}

func (r eventRepositoryImpl) Save(event models.Event) error {
	entity := r.mapper.DomainToModel(event)
	if err := r.db.Save(&entity).Error; err != nil {
		return exceptions.NewTechnicalException(fmt.Sprintf("Error saving event: %v", err))
	}

	return nil
}

func (r eventRepositoryImpl) Delete(id string) error {
	var event entities.Event
	if err := r.db.First(&event, "id = ?", id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return exceptions.NewRepositoryNoDataFoundException(fmt.Sprintf("Event with ID %s not found", id))
		}
		return exceptions.NewTechnicalException(fmt.Sprintf("Error retrieving event with ID %s: %v", id, err))
	}

	if err := r.db.Delete(&event).Error; err != nil {
		return exceptions.NewTechnicalException(fmt.Sprintf("Error deleting event with ID %s: %v", id, err))
	}

	return nil
}
