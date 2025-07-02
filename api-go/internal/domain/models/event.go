package models

import (
	"time"

	"github.com/Gabriel-Schiestl/go-clarch/domain/exceptions"
	"github.com/google/uuid"
)

type EventProps struct {
    ID          *string
    Name        *string
    Location    *string
    Date        *time.Time
    Description *string
    OrganizerID *string
    Attendees   []string
    CreatedAt   *time.Time
    Category    *string
    Limit       *int
}

type event struct {
    id          string
    name        string
    location    string
    date        time.Time
    description string
    organizerID string
    attendees   []string
    createdAt   time.Time
    category    string
    limit       int
}

type Event interface {
    ID() string
    Name() string
    Location() string
    Date() time.Time
    Description() string
    OrganizerID() string
    Attendees() []string
    CreatedAt() time.Time
    Category() string
    Limit() int
    AddAttendee(attendee string) error
    CancelSubscription(attendee string) error
}

func NewEvent(props EventProps) (Event, error) {
	if props.Name == nil || *props.Name == "" {
		return nil, exceptions.NewBusinessException("Event name is required")
	}
	if props.Location == nil || *props.Location == "" {
		return nil, exceptions.NewBusinessException("Event location is required")
	}
	if props.Date == nil {
		return nil, exceptions.NewBusinessException("Event date is required")
	}
	if props.OrganizerID == nil || *props.OrganizerID == "" {
		return nil, exceptions.NewBusinessException("Organizer ID is required")
	}

    if props.Category == nil || *props.Category == "" {
        return nil, exceptions.NewBusinessException("Event category is required")
    }

    if props.Limit == nil || *props.Limit < 0 {
        return nil, exceptions.NewBusinessException("Event limit cannot be negative")
    }

	event := &event{
		name:        *props.Name,
		location:    *props.Location,
		date:        *props.Date,
		description: *props.Description,
		organizerID: *props.OrganizerID,
		attendees:   props.Attendees,
		createdAt:   time.Now().UTC(),
        category:    *props.Category,
        limit:       *props.Limit,
    }

    if props.ID == nil || *props.ID == "" {
        event.id = uuid.NewString()
    } else {
        event.id = *props.ID
    }

	if props.CreatedAt != nil {
        event.createdAt = *props.CreatedAt
    }

	return event, nil
}

func LoadEvent(props EventProps) (Event, error) {
	return NewEvent(props)
}

func (e *event) AddAttendee(attendee string) error {
    if attendee == "" {
        return exceptions.NewBusinessException("Attendee cannot be empty")
    }

    if len(e.attendees) >= e.limit && e.limit > 0 {
        return exceptions.NewBusinessException("Event attendee limit reached")
    }

    if attendee == e.organizerID {
        return exceptions.NewBusinessException("Organizer cannot be an attendee")
    }

    for _, a := range e.attendees {
        if a == attendee {
            return exceptions.NewBusinessException("Attendee already exists")
        }
    }

    e.attendees = append(e.attendees, attendee)
    
    return nil
}

func (e *event) CancelSubscription(attendee string) error {
    if attendee == "" {
        return exceptions.NewBusinessException("Attendee cannot be empty")
    }

    for i, a := range e.attendees {
        if a == attendee {
            e.attendees = append(e.attendees[:i], e.attendees[i+1:]...)
            return nil
        }
    }

    return exceptions.NewBusinessException("Attendee not subscribed to the event")
}

func (e *event) ID() string { return e.id }
func (e *event) Name() string { return e.name }
func (e *event) Location() string { return e.location }
func (e *event) Date() time.Time { return e.date }
func (e *event) Description() string { return e.description }
func (e *event) OrganizerID() string { return e.organizerID }
func (e *event) Attendees() []string { return e.attendees }
func (e *event) CreatedAt() time.Time { return e.createdAt }
func (e *event) Category() string {return e.category}
func (e *event) Limit() int { return e.limit }