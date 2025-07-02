package controllers

import (
	"github.com/Gabriel-Schiestl/api-go/internal/application/usecases"
	"github.com/Gabriel-Schiestl/api-go/internal/infra/database"
	"github.com/Gabriel-Schiestl/api-go/internal/infra/database/connection"
	"github.com/Gabriel-Schiestl/api-go/internal/infra/mappers"
	"github.com/Gabriel-Schiestl/api-go/internal/infra/ports"
	"github.com/Gabriel-Schiestl/go-clarch/application/usecase"
	"github.com/Gabriel-Schiestl/go-clarch/presentation/controller"
)

var Controllers = []controller.Controller{}

func SetupControllers() {
	jwtService := ports.NewJWTService()

	mapper := mappers.EventMapper{}
	authMapper := mappers.AuthMapper{}
	userMapper := mappers.UserMapper{}

	eventRepository := database.NewEventRepository(connection.Db, mapper)
	userRepository := database.NewUserRepository(connection.Db, userMapper)
	authRepository := database.NewAuthRepository(connection.Db, authMapper)

	getEventsUseCase := usecases.NewGetEventsUseCase(eventRepository)
	getEventsDecorator := usecase.NewUseCaseDecorator(getEventsUseCase)

	createEventUseCase := usecases.NewCreateEventUseCase(eventRepository)
	createEventDecorator := usecase.NewUseCaseWithPropsDecorator(createEventUseCase)

	updateEventUseCase := usecases.NewUpdateEventUseCase(eventRepository)
	updateEventDecorator := usecase.NewUseCaseWithPropsDecorator(updateEventUseCase)

	deleteEventUseCase := usecases.NewDeleteEventUseCase(eventRepository)
	deleteEventDecorator := usecase.NewUseCaseWithPropsDecorator(deleteEventUseCase)

	getEventsByUserUseCase := usecases.NewGetEventsByUserUseCase(userRepository, eventRepository)
	getEventsByUserDecorator := usecase.NewUseCaseWithPropsDecorator(getEventsByUserUseCase)

	getEventByIdUseCase := usecases.NewGetEventByIdUseCase(eventRepository, userRepository)
	getEventByIdDecorator := usecase.NewUseCaseWithPropsDecorator(getEventByIdUseCase)

	registerToEventUseCase := usecases.NewRegisterToEventUseCase(userRepository, eventRepository)
	registerToEventDecorator := usecase.NewUseCaseWithPropsDecorator(registerToEventUseCase)

	cancelEventSubscriptionUseCase := usecases.NewCancelEventSubscriptionUseCase(userRepository, eventRepository)
	cancelEventSubscriptionDecorator := usecase.NewUseCaseWithPropsDecorator(cancelEventSubscriptionUseCase)

	getEventsByOrganizerUseCase := usecases.NewGetEventsByOrganizerUseCase(eventRepository)
	getEventsByOrganizerDecorator := usecase.NewUseCaseWithPropsDecorator(getEventsByOrganizerUseCase)

	getEventsByCategoryUseCase := usecases.NewGetEventsByCategoryUseCase(eventRepository)
	getEventsByCategoryDecorator := usecase.NewUseCaseWithPropsDecorator(getEventsByCategoryUseCase)

	getEventsByTermUseCase := usecases.NewGetEventsByTermUseCase(eventRepository)
	getEventsByTermDecorator := usecase.NewUseCaseWithPropsDecorator(getEventsByTermUseCase)

	eventsController := NewEventsController(
		getEventsDecorator,
		createEventDecorator,
		updateEventDecorator,
		deleteEventDecorator,
		getEventsByUserDecorator,
		getEventByIdDecorator,
		registerToEventDecorator,
		cancelEventSubscriptionDecorator,
		getEventsByOrganizerDecorator,
		getEventsByCategoryDecorator,
		getEventsByTermDecorator,
	)
	controller.Add(eventsController)

	getAuthsUseCase := usecases.NewGetAuthsUseCase(authRepository)
	getAuthsDecorator := usecase.NewUseCaseDecorator(getAuthsUseCase)
	loginUseCase := usecases.NewLoginUseCase(authRepository, userRepository, jwtService)
	loginDecorator := usecase.NewUseCaseWithPropsDecorator(loginUseCase)

	authController := NewAuthController(getAuthsDecorator, loginDecorator)
	controller.Add(authController)

	getUsersUseCase := usecases.NewGetUsersUseCase(userRepository)
	getUsersDecorator := usecase.NewUseCaseDecorator(getUsersUseCase)
	createUserUseCase := usecases.NewCreateUserUseCase(userRepository, authRepository)
	createUserDecorator := usecase.NewUseCaseWithPropsDecorator(createUserUseCase)
	getUserUseCase := usecases.NewGetUserUseCase(userRepository)
	getUserDecorator := usecase.NewUseCaseWithPropsDecorator(getUserUseCase)

	usersController := NewUsersController(createUserDecorator, getUsersDecorator, getUserDecorator)
	controller.Add(usersController)
}