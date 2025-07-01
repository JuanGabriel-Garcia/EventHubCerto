"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Calendar, MapPin, Users, User } from "lucide-react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { apiService } from "@/services/api";
import type { EventWithAttendeesResponse } from "@/types/api";
import { useOrganizerName } from "@/hooks/useOrganizerName";

export default function EventDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState<EventWithAttendeesResponse | null>(null);
  const [isRegistered, setIsRegistered] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  
  // Buscar nome do organizador
  const organizerName = useOrganizerName(event?.organizer_id || "");

  useEffect(() => {
    const loggedIn = localStorage.getItem("isLoggedIn") === "true";
    setIsLoggedIn(loggedIn);

    if (id) {
      loadEventDetails(loggedIn); // Passar o status de login
    }
  }, [id]);

  // Verificar mudanças no status de login
  useEffect(() => {
    if (isLoggedIn && id) {
      checkUserRegistration();
    } else {
      setIsRegistered(false);
    }
  }, [isLoggedIn, id]);

  const loadEventDetails = async (userLoggedIn?: boolean) => {
    if (!id) return;
    
    // Usar o parâmetro ou o estado atual
    const currentlyLoggedIn = userLoggedIn !== undefined ? userLoggedIn : isLoggedIn;
    
    try {
      setIsLoading(true);
      
      // SEMPRE usar o método de fallback que funciona (buscar de todos os eventos)
      await loadEventDetailsWithFallback();
      
      // Check if user is registered for the event using the registered events endpoint
      if (currentlyLoggedIn) {
        await checkUserRegistration();
      }
    } catch (error) {
      console.error("Error loading event details:", error);
      setMessage("Erro ao carregar detalhes do evento");
    } finally {
      setIsLoading(false);
    }
  };

  // Função alternativa para buscar detalhes do evento com fallback
  const loadEventDetailsWithFallback = async () => {
    if (!id) return;
    
    // Buscar todos os eventos (mesmo endpoint que o EventCard usa)
    const allEvents = await apiService.getEvents();
    
    // Encontrar o evento específico
    const eventFromList = allEvents.find(e => e.id === id);
    
    if (eventFromList) {
      // Criar um objeto EventWithAttendeesResponse baseado no CreateEventResponse
      const eventData: EventWithAttendeesResponse = {
        id: eventFromList.id,
        name: eventFromList.name,
        description: eventFromList.description,
        date: eventFromList.date,
        location: eventFromList.location,
        category: eventFromList.category,
        limit: eventFromList.limit,
        organizer_id: eventFromList.organizer_id,
        created_at: eventFromList.created_at,
        attendees: [], // Inicializar vazio
        attendees_count: eventFromList.attendees ? eventFromList.attendees.length : 0
      };
      
      // Se temos IDs dos attendees, criar objetos placeholder (IGUAL ao EventCard)
      if (eventFromList.attendees && eventFromList.attendees.length > 0) {
        eventData.attendees = eventFromList.attendees.map((attendeeId, index) => ({
          id: attendeeId,
          name: `Participante ${index + 1}`,
          email: `participante${index + 1}@temp.com`,
          userType: "participant",
          createdAt: new Date().toISOString()
        }));
      }
      
      setEvent(eventData);
    } else {
      throw new Error("Event not found in list");
    }
  };

  const checkUserRegistration = async () => {
    if (!id) return;
    
    try {
      const registeredEvents = await apiService.getEventsByUser();
      const isUserRegistered = registeredEvents.some(event => event.id === id);
      setIsRegistered(isUserRegistered);
    } catch (error) {
      console.error("Error checking user registration:", error);
      // Se não conseguir verificar, assume que não está inscrito
      setIsRegistered(false);
    }
  };

  const handleRegistration = async () => {
    if (!isLoggedIn) {
      setMessage("Você precisa fazer login para se inscrever no evento.");
      return;
    }

    if (!event || !id) return;

    // Verificar se o usuário atual é o organizador do evento
    const currentUserId = localStorage.getItem("userId");
    
    if (currentUserId && currentUserId !== "temp-id" && event.organizer_id === currentUserId) {
      setMessage("❌ Não é possível se inscrever no seu próprio evento.");
      return;
    }

    setIsLoading(true);
    setMessage("");

    try {
      await apiService.registerToEvent(id);
      setMessage("✅ Inscrição realizada com sucesso!");
      setIsRegistered(true);
      
      // Atualizar o contador localmente sem recarregar a página
      if (event) {
        // Usar a mesma lógica do EventCard - atualizar o array attendees
        const currentAttendees = event.attendees || [];
        
        // Criar um placeholder de usuário
        const tempUser = {
          id: "temp-user",
          name: "Novo Participante",
          email: "temp@temp.com",
          userType: "participant",
          createdAt: new Date().toISOString()
        };
        
        setEvent({
          ...event,
          attendees: [...currentAttendees, tempUser]
        });
      }
    } catch (error) {
      // Tratar erros específicos
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      // Verificar mensagens específicas do backend
      if (errorMessage.includes("already exists") || errorMessage.includes("Attendee already exists")) {
        setMessage("❌ Você já está inscrito neste evento.");
        setIsRegistered(true);
      } else if (errorMessage.includes("limit reached") || errorMessage.includes("attendee limit reached")) {
        setMessage("❌ Este evento já está lotado.");
      } else if (errorMessage.includes("Organizer cannot be an attendee") || 
                 errorMessage.includes("Organizer cannot") || 
                 errorMessage.includes("organizador") || 
                 errorMessage.includes("próprio evento")) {
        setMessage("❌ Não é possível se inscrever no seu próprio evento.");
      } else {
        setMessage("❌ Erro ao realizar inscrição. Tente novamente.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelRegistration = async () => {
    if (!event || !id) return;

    setIsLoading(true);
    setMessage("");

    try {
      await apiService.cancelRegistration(id);
      setMessage("✅ Inscrição cancelada com sucesso.");
      setIsRegistered(false);
      
      // Atualizar o contador localmente sem recarregar a página
      if (event) {
        // Usar a mesma lógica do EventCard - atualizar o array attendees
        const currentAttendees = event.attendees || [];
        const newAttendees = currentAttendees.slice(0, -1); // Remove o último participante
        
        setEvent({
          ...event,
          attendees: newAttendees
        });
      }
    } catch (error) {
      console.error("Error canceling registration:", error);
      
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      if (errorMessage.includes("not subscribed") || errorMessage.includes("not registered")) {
        setMessage("❌ Você não está inscrito neste evento.");
        setIsRegistered(false); // Atualizar o estado
      } else {
        setMessage("❌ Erro ao cancelar inscrição. Tente novamente.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoBack = () => {
    // Voltar para a página anterior no histórico do navegador
    navigate(-1);
  };

  const getCategoryColor = (category: string) => {
    const colors = {
      tecnologia: "bg-blue-100 text-blue-800",
      negocios: "bg-green-100 text-green-800",
      design: "bg-purple-100 text-purple-800",
      educacao: "bg-orange-100 text-orange-800",
      saude: "bg-red-100 text-red-800",
      arte: "bg-pink-100 text-pink-800",
      esporte: "bg-indigo-100 text-indigo-800",
      outros: "bg-gray-100 text-gray-800",
    };
    return (
      colors[category as keyof typeof colors] || "bg-gray-100 text-gray-800"
    );
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  const formatTime = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return '';
    }
  };

  if (isLoading && !event) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-semibold mb-2">Carregando...</h2>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-semibold mb-2">Evento não encontrado</h2>
          <Button onClick={handleGoBack}>Voltar</Button>
        </div>
      </div>
    );
  }

  // Usar a mesma lógica que funciona no EventCard
  const attendeesCount = event.attendees ? event.attendees.length : 0;
  
  const capacity = event.limit || 0;
  const isEventFull = capacity > 0 && attendeesCount >= capacity;
  
  const getCapacityColor = () => {
    if (capacity === 0) return "text-gray-600"; // Sem limite
    const percentage = (attendeesCount / capacity) * 100;
    if (percentage >= 100) return "text-red-600"; // Lotado
    if (percentage >= 80) return "text-orange-600"; // Poucas vagas
    return "text-green-600"; // Vagas disponíveis
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/" className="text-2xl font-bold text-gray-900">
              EventHub
            </Link>
            <nav className="flex items-center space-x-4">
              {isLoggedIn ? (
                <Link to="/dashboard">
                  <Button variant="ghost">Dashboard</Button>
                </Link>
              ) : (
                <>
                  <Link to="/login">
                    <Button variant="ghost">Entrar</Button>
                  </Link>
                  <Link to="/register">
                    <Button>Cadastrar</Button>
                  </Link>
                </>
              )}
            </nav>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <button
            onClick={handleGoBack}
            className="text-blue-600 hover:text-blue-800 flex items-center mb-4 cursor-pointer bg-transparent border-none"
          >
            ← Voltar
          </button>

          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {event.name}
              </h1>
              <Badge className={getCategoryColor(event.category)}>
                {event.category}
              </Badge>
            </div>
          </div>
        </div>

        {message && (
          <Alert className={`mb-6 ${
            message.includes('❌') ? 'border-red-200 bg-red-50' :
            message.includes('✅') ? 'border-green-200 bg-green-50' :
            'border-blue-200 bg-blue-50'
          }`}>
            <AlertDescription className={
              message.includes('❌') ? 'text-red-800' :
              message.includes('✅') ? 'text-green-800' :
              'text-blue-800'
            }>
              {message}
            </AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Descrição do Evento</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 leading-relaxed">
                  {event.description}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Informações do Evento</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center">
                  <Calendar className="w-5 h-5 mr-3 text-gray-400" />
                  <div>
                    <p className="font-medium">Data</p>
                    <p className="text-gray-600">{formatDate(event.date)}</p>
                  </div>
                </div>
                <div className="flex items-center">
                  <Calendar className="w-5 h-5 mr-3 text-gray-400" />
                  <div>
                    <p className="font-medium">Horário</p>
                    <p className="text-gray-600">{formatTime(event.date)}</p>
                  </div>
                </div>
                <div className="flex items-center">
                  <MapPin className="w-5 h-5 mr-3 text-gray-400" />
                  <div>
                    <p className="font-medium">Local</p>
                    <p className="text-gray-600">{event.location}</p>
                  </div>
                </div>
                <div className="flex items-center">
                  <Users className="w-5 h-5 mr-3 text-gray-400" />
                  <div>
                    <p className="font-medium">Participantes</p>
                    <p className={`${getCapacityColor()}`}>
                      {capacity > 0 ? `${attendeesCount}/${capacity} participantes` : `${attendeesCount} participantes`}
                      {isEventFull && <span className="ml-2 text-red-600 font-semibold">LOTADO</span>}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Organizador</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                    <User className="w-6 h-6 text-gray-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">
                      {organizerName}
                    </p>
                    <p className="text-sm text-gray-600">
                      Organizador
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Inscrição</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <Users className="w-8 h-8 mx-auto mb-2 text-gray-600" />
                  <p className={`text-2xl font-bold ${getCapacityColor()}`}>
                    {capacity > 0 ? `${attendeesCount}/${capacity}` : attendeesCount}
                  </p>
                  <p className="text-sm text-gray-600">
                    {capacity > 0 ? "participantes inscritos" : "participantes"}
                  </p>
                  {isEventFull && (
                    <div className="mt-2">
                      <span className="inline-block px-2 py-1 bg-red-100 text-red-800 text-xs font-semibold rounded">
                        EVENTO LOTADO
                      </span>
                    </div>
                  )}
                </div>

                {isLoggedIn ? (
                  <div className="space-y-3">
                    {!isRegistered ? (
                      <Button
                        onClick={handleRegistration}
                        disabled={isLoading || isEventFull}
                        className="w-full transition-all duration-200 ease-in-out transform hover:scale-105"
                      >
                        {isLoading ? "Inscrevendo..." : 
                         isEventFull ? "Evento Lotado" : "Inscrever-se"}
                      </Button>
                    ) : (
                      <div className="space-y-2">
                        <div className="flex items-center justify-center p-3 bg-green-50 border border-green-200 rounded-lg transition-all duration-300 ease-in-out">
                          <span className="text-green-800 font-medium">
                            ✓ Você está inscrito
                          </span>
                        </div>
                        <Button
                          onClick={handleCancelRegistration}
                          disabled={isLoading}
                          variant="outline"
                          className="w-full transition-all duration-200 ease-in-out hover:bg-red-50 hover:border-red-200 hover:text-red-700"
                        >
                          {isLoading ? "Cancelando..." : "Cancelar Inscrição"}
                        </Button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center space-y-3">
                    <p className="text-gray-600">
                      Faça login para se inscrever no evento
                    </p>
                    <Link to="/login">
                      <Button className="w-full">Fazer Login</Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
