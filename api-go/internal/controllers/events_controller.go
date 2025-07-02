package controllers

import (
	"log"

	"github.com/Gabriel-Schiestl/api-go/internal/application/dtos"
	"github.com/Gabriel-Schiestl/api-go/internal/application/usecases"
	r "github.com/Gabriel-Schiestl/api-go/internal/server"
	"github.com/Gabriel-Schiestl/go-clarch/application/usecase"
	_ "github.com/Gabriel-Schiestl/go-clarch/presentation/controller"
	"github.com/gin-gonic/gin"
)

var userIDRequired = gin.H{"error": "User ID is required"}
var eventIDRequired = gin.H{"error": "Event ID is required"}
const useCaseErrorLog = "UseCase error: %v"
const eventIDRoute = "/:eventID"

type EventsController struct{
	getEventsUseCase usecase.UseCaseDecorator[[]dtos.EventDto]
	createEventUseCase usecase.UseCaseWithPropsDecorator[dtos.CreateEventProps, *dtos.EventDto]
	updateEventUseCase usecase.UseCaseWithPropsDecorator[dtos.UpdateEventProps, *dtos.EventDto]
	deleteEventUseCase usecase.UseCaseWithPropsDecorator[usecases.DeleteEventProps, struct{}]
	getEventsByUserUseCase usecase.UseCaseWithPropsDecorator[string, []dtos.EventDto]
	getEventByIdUseCase usecase.UseCaseWithPropsDecorator[usecases.GetEventByIdUseCaseProps, dtos.EventWithAttendeesDto]
	registerToEventUseCase usecase.UseCaseWithPropsDecorator[usecases.RegisterToEventUseCaseProps, []string]
	cancelEventSubscriptionUseCase usecase.UseCaseWithPropsDecorator[usecases.CancelEventSubscriptionUseCaseProps, []string]
	getEventsByOrganizerUseCase usecase.UseCaseWithPropsDecorator[string, []dtos.EventDto]
	getEventsByCategoryUseCase usecase.UseCaseWithPropsDecorator[string, []dtos.EventDto]
	getEventsByTermUseCase usecase.UseCaseWithPropsDecorator[string, []dtos.EventDto]
}

func NewEventsController(
	getEventsUseCase usecase.UseCaseDecorator[[]dtos.EventDto],
	createEventUseCase usecase.UseCaseWithPropsDecorator[dtos.CreateEventProps, *dtos.EventDto],
	updateEventUseCase usecase.UseCaseWithPropsDecorator[dtos.UpdateEventProps, *dtos.EventDto],
	deleteEventUseCase usecase.UseCaseWithPropsDecorator[usecases.DeleteEventProps, struct{}],
	getEventsByUserUseCase usecase.UseCaseWithPropsDecorator[string, []dtos.EventDto],
	getEventByIdUsecase usecase.UseCaseWithPropsDecorator[usecases.GetEventByIdUseCaseProps, dtos.EventWithAttendeesDto],
	registerToEventUseCase usecase.UseCaseWithPropsDecorator[usecases.RegisterToEventUseCaseProps, []string],
	cancelEventSubscriptionUseCase usecase.UseCaseWithPropsDecorator[usecases.CancelEventSubscriptionUseCaseProps, []string],
	getEventsByOrganizerUseCase usecase.UseCaseWithPropsDecorator[string, []dtos.EventDto],
	getEventsByCategoryUseCase usecase.UseCaseWithPropsDecorator[string, []dtos.EventDto],
	getEventsByTermUseCase usecase.UseCaseWithPropsDecorator[string, []dtos.EventDto],
) *EventsController {
	return &EventsController{
		getEventsUseCase: getEventsUseCase,
		createEventUseCase: createEventUseCase,
		updateEventUseCase: updateEventUseCase,
		deleteEventUseCase: deleteEventUseCase,
		getEventsByUserUseCase: getEventsByUserUseCase,
		getEventByIdUseCase: getEventByIdUsecase,
		registerToEventUseCase: registerToEventUseCase,
		cancelEventSubscriptionUseCase: cancelEventSubscriptionUseCase,
		getEventsByOrganizerUseCase: getEventsByOrganizerUseCase,
		getEventsByCategoryUseCase: getEventsByCategoryUseCase,
		getEventsByTermUseCase: getEventsByTermUseCase,
	}
}

func (ec EventsController) GetAllEvents(c *gin.Context) {
	events, err := ec.getEventsUseCase.Execute()
	if err != nil {
		c.JSON(500, gin.H{"error": err.Error()})
		return
	}

	c.JSON(200, events)
}

func (ec EventsController) CreateEvent(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists || userID == "" {
		c.JSON(400, userIDRequired)
		return
	}
	
	body := dtos.CreateEventProps{}
	if err := c.ShouldBindJSON(&body); err != nil {
		log.Printf("Binding error: %v", err)
		c.JSON(400, gin.H{"error": "Invalid request body", "details": err.Error()})
		return
	}

	log.Printf("Parsed event data: %+v", body)
	body.OrganizerID = userID.(string)

	createdEvent, err := ec.createEventUseCase.Execute(body)
	if err != nil {
		log.Printf(useCaseErrorLog, err)
		c.JSON(500, gin.H{"error": err.Error()})
		return
	}

	log.Printf("Event created successfully: %+v", createdEvent)
	c.JSON(201, createdEvent)
}

func (ec EventsController) GetEventsByUser(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists || userID == "" {
		c.JSON(400, userIDRequired)
		return
	}

	events, err := ec.getEventsByUserUseCase.Execute(userID.(string))
	if err != nil {
		c.JSON(500, gin.H{"error": err.Error()})
		return
	}

	c.JSON(200, events)
}

func (ec EventsController) GetEventById(c *gin.Context) {
	eventID := c.Param("eventID")
	if eventID == "" {
		c.JSON(400, eventIDRequired)
		return
	}

	userID, exists := c.Get("userID")
	if !exists || userID == "" {
		c.JSON(400, userIDRequired)
		return	
	}

	event, err := ec.getEventByIdUseCase.Execute(usecases.GetEventByIdUseCaseProps{
		EventID: eventID,
		UserID:  userID.(string),
	})
	if err != nil {
		c.JSON(500, gin.H{"error": err.Error()})
		return
	}

	c.JSON(200, event)
}

func (ec EventsController) RegisterToEvent(c *gin.Context) {
	eventID := c.Param("eventID")
	userID, exists := c.Get("userID")
	if !exists || userID == "" {
		c.JSON(400, userIDRequired)
		return
	}

	if eventID == "" {
		c.JSON(400, eventIDRequired)
		return
	}

	props := usecases.RegisterToEventUseCaseProps{
		UserId: userID.(string),
		EventId: eventID,
	}

	attendees, err := ec.registerToEventUseCase.Execute(props)
	if err != nil {
		c.JSON(500, gin.H{"error": err.Error()})
		return
	}

	c.JSON(200, attendees)
}

func (ec EventsController) CancelEventSubscription(c *gin.Context) {
	eventID := c.Param("eventID")
	userID, exists := c.Get("userID")
	if !exists || userID == "" {
		c.JSON(400, userIDRequired)
		return
	}

	if eventID == "" {
		c.JSON(400, eventIDRequired)
		return
	}

	props := usecases.CancelEventSubscriptionUseCaseProps{
		UserId:  userID.(string),
		EventId: eventID,
	}

	attendees, err := ec.cancelEventSubscriptionUseCase.Execute(props)
	if err != nil {
		c.JSON(500, gin.H{"error": err.Error()})
		return
	}

	c.JSON(200, gin.H{
		"message":   "Subscription cancelled successfully",
		"attendees": attendees,
	})
}

func (ec EventsController) GetEventsByOrganizer(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists || userID == "" {
		c.JSON(400, userIDRequired)
		return
	}

	events, err := ec.getEventsByOrganizerUseCase.Execute(userID.(string))
	if err != nil {
		c.JSON(500, gin.H{"error": err.Error()})
		return
	}

	c.JSON(200, events)
}

func (ec EventsController) GetEventsByCategory(c *gin.Context) {
	category := c.Query("category")
	if category == "" {
		c.JSON(400, gin.H{"error": "Category is required"})
		return
	}

	events, err := ec.getEventsByCategoryUseCase.Execute(category)
	if err != nil {
		c.JSON(500, gin.H{"error": err.Error()})
		return
	}

	c.JSON(200, events)
}

func (ec EventsController) GetEventsByTerm(c *gin.Context) {
	term := c.Query("term")
	if term == "" {
		c.JSON(400, gin.H{"error": "Search term is required"})
		return
	}

	events, err := ec.getEventsByTermUseCase.Execute(term)
	if err != nil {
		c.JSON(500, gin.H{"error": err.Error()})
		return
	}

	c.JSON(200, events)
}

func (ec EventsController) UpdateEvent(c *gin.Context) {
	eventID := c.Param("eventID")
	userID, exists := c.Get("userID")
	if !exists || userID == "" {
		c.JSON(400, userIDRequired)
		return
	}

	if eventID == "" {
		c.JSON(400, eventIDRequired)
		return
	}

	body := dtos.UpdateEventProps{}
	if err := c.ShouldBindJSON(&body); err != nil {
		log.Printf("Binding error: %v", err)
		c.JSON(400, gin.H{"error": "Invalid request body", "details": err.Error()})
		return
	}

	// Set the event ID and organizer ID from path and auth
	body.EventID = eventID
	body.OrganizerID = userID.(string)

	updatedEvent, err := ec.updateEventUseCase.Execute(body)
	if err != nil {
		log.Printf(useCaseErrorLog, err)
		c.JSON(500, gin.H{"error": err.Error()})
		return
	}

	log.Printf("Event updated successfully: %+v", updatedEvent)
	c.JSON(200, updatedEvent)
}

func (ec EventsController) DeleteEvent(c *gin.Context) {
	eventID := c.Param("eventID")
	userID, exists := c.Get("userID")
	if !exists || userID == "" {
		c.JSON(400, userIDRequired)
		return
	}

	if eventID == "" {
		c.JSON(400, eventIDRequired)
		return
	}

	props := usecases.DeleteEventProps{
		EventID:     eventID,
		OrganizerID: userID.(string),
	}

	_, err := ec.deleteEventUseCase.Execute(props)
	if err != nil {
		log.Printf(useCaseErrorLog, err)
		c.JSON(500, gin.H{"error": err.Error()})
		return
	}

	log.Printf("Event deleted successfully: %s", eventID)
	c.JSON(200, gin.H{"message": "Event deleted successfully"})
}

func (ec EventsController) SetupRoutes() {
	group := r.Router.Group("/events")

	group.GET("/", ec.GetAllEvents)
	group.POST("/", ec.CreateEvent)
	group.GET("/registered", ec.GetEventsByUser)
	group.GET(eventIDRoute, ec.GetEventById)
	group.PUT(eventIDRoute, ec.UpdateEvent)
	group.DELETE(eventIDRoute, ec.DeleteEvent)
	group.POST("/:eventID/register", ec.RegisterToEvent)
	group.DELETE("/:eventID/register", ec.CancelEventSubscription)
	group.GET("/organizer", ec.GetEventsByOrganizer)
	group.GET("/category", ec.GetEventsByCategory)
	group.GET("/search", ec.GetEventsByTerm)
}