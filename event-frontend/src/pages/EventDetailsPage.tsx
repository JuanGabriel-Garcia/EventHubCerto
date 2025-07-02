"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Calendar, MapPin, Users, User, Plus, Trash2, AlertTriangle } from "lucide-react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { apiService } from "@/services/api";
import type { EventWithAttendeesResponse } from "@/types/api";
import { useOrganizerName } from "@/hooks/useOrganizerName";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function EventDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState<EventWithAttendeesResponse | null>(null);
  const [isRegistered, setIsRegistered] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [message, setMessage] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  
  // Buscar nome do organizador - usar o objeto completo se disponível
  const organizerName = useOrganizerName(event?.organizer?.id || "", event?.organizer);

  useEffect(() => {
    const loggedIn = localStorage.getItem("isLoggedIn") === "true";
    setIsLoggedIn(loggedIn);

    if (id) {
      loadEventDetails(loggedIn);
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

  // Verificar se o usuário atual é o organizador do evento
  const isEventOrganizer = () => {
    if (!event || !isLoggedIn) return false;
    
    const currentUserId = localStorage.getItem("userId");
    const currentUserEmail = localStorage.getItem("userEmail");
    
    // Verificar por ID (se não for temp-id)
    if (currentUserId && currentUserId !== "temp-id" && event.organizer.id === currentUserId) {
      return true;
    }
    
    // Verificar por email (fallback)
    if (currentUserEmail && event.organizer.email && event.organizer.email === currentUserEmail) {
      return true;
    }
    
    return false;
  };

  // Função helper para processar dados de participantes
  const processAttendeesData = (eventData: any): EventWithAttendeesResponse => {
    // Converter a estrutura da API para o formato esperado pelo frontend
    const processedEvent: EventWithAttendeesResponse = {
      id: eventData.id,
      name: eventData.name,
      description: eventData.description,
      date: eventData.date,
      location: eventData.location,
      category: eventData.category,
      limit: eventData.limit,
      created_at: eventData.created_at,
      organizer: eventData.organizer || {
        id: eventData.organizer_id || "",
        name: "Organizador",
        email: "",
        userType: "organizer",
        createdAt: ""
      },
      attendees: [],
      attendees_count: 0
    };

    // Processar attendees se existirem
    if (eventData.attendees && Array.isArray(eventData.attendees) && eventData.attendees.length > 0) {
      // Se os attendees são objetos completos (com name, email), usar diretamente
      if (typeof eventData.attendees[0] === 'object' && eventData.attendees[0] !== null && eventData.attendees[0].name) {
        processedEvent.attendees = eventData.attendees.map((attendee: any) => ({
          id: attendee.id,
          name: attendee.name,
          email: attendee.email,
          userType: attendee.userType || "participant",
          createdAt: attendee.created_at || attendee.createdAt || new Date().toISOString()
        }));
      } else if (typeof eventData.attendees[0] === 'string') {
        // Se os attendees são apenas IDs, criar placeholders temporários
        processedEvent.attendees = eventData.attendees.map((attendeeId: string, index: number) => ({
          id: attendeeId,
          name: `Participante ${index + 1}`,
          email: `participante${index + 1}@temp.com`,
          userType: "participant",
          createdAt: new Date().toISOString()
        }));
      }
      processedEvent.attendees_count = eventData.attendees.length;
    } else {
      // Se attendees for null ou vazio
      processedEvent.attendees = [];
      processedEvent.attendees_count = 0;
    }

    return processedEvent;
  };

  // Nova função para buscar dados completos dos participantes quando temos apenas IDs
  const fetchAttendeesDetails = async (attendeeIds: string[]) => {
    const attendeesDetails = [];
    
    for (const attendeeId of attendeeIds) {
      try {
        const userData = await apiService.getUserById(attendeeId);
        attendeesDetails.push({
          id: userData.id,
          name: userData.name,
          email: userData.email,
          userType: userData.userType,
          createdAt: userData.createdAt
        });
      } catch (error) {
        // Em caso de erro, adicionar placeholder
        attendeesDetails.push({
          id: attendeeId,
          name: `Participante ${attendeesDetails.length + 1}`,
          email: `participante${attendeesDetails.length + 1}@temp.com`,
          userType: "participant",
          createdAt: new Date().toISOString()
        });
      }
    }
    
    return attendeesDetails;
  };

  const loadEventDetails = async (userLoggedIn?: boolean) => {
    if (!id) return;
    
    const currentlyLoggedIn = userLoggedIn !== undefined ? userLoggedIn : isLoggedIn;
    
    try {
      setIsLoading(true);
      
      // Tentar buscar o evento pela API primeiro (se estiver logado)
      if (currentlyLoggedIn) {
        try {
          const eventData = await apiService.getEventById(id);
          
          // Usar a função helper para processar os dados
          let formattedEvent = processAttendeesData(eventData);
          
          // Sempre tentar buscar participantes através dos eventos do usuário
          try {
            // Buscar todos os eventos para pegar a lista de attendees (que pode ter mais dados)
            const allEvents = await apiService.getEvents();
            const eventWithAttendees = allEvents.find(e => e.id === id);
            
            if (eventWithAttendees && eventWithAttendees.attendees && 
                Array.isArray(eventWithAttendees.attendees) && 
                eventWithAttendees.attendees.length > 0) {
              
              // Se são IDs (strings), buscar dados completos
              if (typeof eventWithAttendees.attendees[0] === 'string') {
                try {
                  const attendeesDetails = await fetchAttendeesDetails(eventWithAttendees.attendees as string[]);
                  formattedEvent.attendees = attendeesDetails;
                  formattedEvent.attendees_count = attendeesDetails.length;
                } catch (error) {
                  // Criar placeholders se falhar
                  formattedEvent.attendees = (eventWithAttendees.attendees as string[]).map((id: string, index: number) => ({
                    id,
                    name: `Participante ${index + 1}`,
                    email: `participante${index + 1}@temp.com`,
                    userType: "participant",
                    createdAt: new Date().toISOString()
                  }));
                  formattedEvent.attendees_count = eventWithAttendees.attendees.length;
                }
              } else {
                // Se já são objetos, usar diretamente
                formattedEvent.attendees = eventWithAttendees.attendees as any[];
                formattedEvent.attendees_count = eventWithAttendees.attendees.length;
              }
            }
          } catch (fallbackError) {
            // Silenciosamente continuar se não conseguir buscar participantes
          }
          
          setEvent(formattedEvent);
          
          // Verificar se o usuário está inscrito
          await checkUserRegistration();
          return;
        } catch (apiError) {
          // Se a API falhar, tentar fallback
        }
      }
      
      // Fallback: buscar de todos os eventos
      await loadEventDetailsWithFallback();
      
      if (currentlyLoggedIn) {
        await checkUserRegistration();
      }
    } catch (error) {
      setMessage("Erro ao carregar detalhes do evento");
    } finally {
      setIsLoading(false);
    }
  };

  // Função alternativa para buscar detalhes do evento com fallback
  const loadEventDetailsWithFallback = async () => {
    if (!id) return;
    
    try {
      const allEvents = await apiService.getEvents();
      const eventFromList = allEvents.find(e => e.id === id);
      
      if (eventFromList) {
        // Buscar dados do organizador se tivermos o ID
        let organizerData = null;
        if (eventFromList.organizer_id) {
          try {
            organizerData = await apiService.getUserById(eventFromList.organizer_id);
          } catch (error) {
            // Silenciosamente continuar se não conseguir buscar dados do organizador
          }
        }

        // Usar a função helper para processar os dados
        let eventData = processAttendeesData({
          id: eventFromList.id,
          name: eventFromList.name,
          description: eventFromList.description,
          date: eventFromList.date,
          location: eventFromList.location,
          category: eventFromList.category,
          limit: eventFromList.limit,
          created_at: eventFromList.created_at,
          attendees: eventFromList.attendees || [],
          organizer: organizerData
        });
        
        // Se temos IDs de participantes, buscar seus dados completos
        if (eventFromList.attendees && 
            Array.isArray(eventFromList.attendees) && 
            eventFromList.attendees.length > 0) {
          
          if (typeof eventFromList.attendees[0] === 'string') {
            try {
              const attendeesDetails = await fetchAttendeesDetails(eventFromList.attendees as string[]);
              eventData.attendees = attendeesDetails;
              eventData.attendees_count = attendeesDetails.length;
            } catch (error) {
              // Usar placeholders se falhar
              eventData.attendees = (eventFromList.attendees as string[]).map((id: string, index: number) => ({
                id,
                name: `Participante ${index + 1}`,
                email: `participante${index + 1}@temp.com`,
                userType: "participant",
                createdAt: new Date().toISOString()
              }));
              eventData.attendees_count = eventFromList.attendees.length;
            }
          } else {
            // Se já são objetos, usar diretamente
            eventData.attendees = eventFromList.attendees as any[];
            eventData.attendees_count = eventFromList.attendees.length;
          }
        }
        
        setEvent(eventData);
      } else {
        throw new Error("Event not found in list");
      }
    } catch (error) {
      throw error;
    }
  };

  const checkUserRegistration = async () => {
    if (!id) return;
    
    try {
      const registeredEvents = await apiService.getEventsByUser();
      const isUserRegistered = registeredEvents.some(event => event.id === id);
      setIsRegistered(isUserRegistered);
    } catch (error) {
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
    
    if (currentUserId && currentUserId !== "temp-id" && event.organizer.id === currentUserId) {
      setMessage("❌ Não é possível se inscrever no seu próprio evento.");
      return;
    }

    setIsLoading(true);
    setMessage("");

    try {
      await apiService.registerToEvent(id);
      setMessage("✅ Inscrição realizada com sucesso!");
      setIsRegistered(true);
      
      // Recarregar os dados do evento para atualizar a lista de participantes
      await loadEventDetails();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      
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
      
      // Recarregar os dados do evento para atualizar a lista de participantes
      await loadEventDetails();
    } catch (error) {
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

  const handleDeleteEvent = async () => {
    if (!event || !id) return;

    setIsDeleting(true);
    setMessage("");
    setShowDeleteDialog(false); // Fechar o dialog

    try {
      await apiService.deleteEvent(id);
      setMessage("✅ Evento deletado com sucesso! Todos os participantes foram removidos automaticamente.");
      
      // Aguardar um pouco para o usuário ver a mensagem
      setTimeout(() => {
        navigate("/dashboard");
      }, 3000);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      if (errorMessage.includes("401") || errorMessage.includes("Unauthorized")) {
        setMessage("❌ Você não tem permissão para deletar este evento.");
      } else if (errorMessage.includes("404") || errorMessage.includes("not found")) {
        setMessage("❌ Evento não encontrado.");
      } else {
        setMessage("❌ Erro ao deletar evento. Tente novamente.");
      }
    } finally {
      setIsDeleting(false);
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

  // Verificação de loading inicial
  if (isLoading && !event) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner text="Carregando detalhes do evento..." />
      </div>
    );
  }

  // Verificação se evento não foi encontrado
  if (!event) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Evento não encontrado</h2>
          <Button onClick={handleGoBack}>
            ← Voltar
          </Button>
        </div>
      </div>
    );
  }

  // Usar a nova estrutura de dados (calculado apenas uma vez)
  const attendeesCount = event.attendees_count || event.attendees?.length || 0;
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
              <Link to="/">
                <Button variant="ghost">Explorar Eventos</Button>
              </Link>
              {isLoggedIn && (
                <>
                  <Link to="/dashboard">
                    <Button variant="ghost">Dashboard</Button>
                  </Link>
                  <Link to="/create-event">
                    <Button variant="ghost">
                      <Plus className="w-4 h-4 mr-2" />
                      Criar Evento
                    </Button>
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
            
            {/* Botões de ação */}
            <div className="flex flex-col sm:flex-row gap-2">
              {isLoggedIn && !isEventOrganizer() && (
                <Button
                  onClick={isRegistered ? handleCancelRegistration : handleRegistration}
                  disabled={isLoading || (!isRegistered && isEventFull)}
                  className={isRegistered 
                    ? "bg-red-600 hover:bg-red-700" 
                    : (isEventFull ? "bg-gray-400 cursor-not-allowed" : "bg-green-600 hover:bg-green-700")
                  }
                >
                  {isLoading ? (
                    <LoadingSpinner />
                  ) : isRegistered ? (
                    "Cancelar Inscrição"
                  ) : isEventFull ? (
                    "Evento Lotado"
                  ) : (
                    "Se Inscrever"
                  )}
                </Button>
              )}
              
              {/* Botão de deletar para organizadores */}
              {isLoggedIn && isEventOrganizer() && (
                <div>
                  <Button
                    onClick={() => setShowDeleteDialog(true)}
                    variant="destructive"
                    disabled={isDeleting}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    {isDeleting ? (
                      <LoadingSpinner />
                    ) : (
                      <>
                        <Trash2 className="w-4 h-4 mr-2" />
                        Deletar Evento
                      </>
                    )}
                  </Button>

                  <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                          <AlertTriangle className="w-5 h-5 text-red-600" />
                          Confirmar Exclusão
                        </DialogTitle>
                        <DialogDescription>
                          Tem certeza que deseja deletar o evento "<strong>{event.name}</strong>"?
                          <br /><br />
                          <span className="text-red-600 font-medium">
                            Esta ação não pode ser desfeita e todos os participantes inscritos ({attendeesCount}) serão removidos automaticamente.
                          </span>
                        </DialogDescription>
                      </DialogHeader>
                      <DialogFooter>
                        <Button
                          variant="outline"
                          onClick={() => setShowDeleteDialog(false)}
                        >
                          Cancelar
                        </Button>
                        <Button
                          variant="destructive"
                          onClick={handleDeleteEvent}
                          disabled={isDeleting}
                          className="bg-red-600 hover:bg-red-700"
                        >
                          {isDeleting ? (
                            <>
                              <LoadingSpinner />
                              <span className="ml-2">Deletando...</span>
                            </>
                          ) : (
                            "Sim, Deletar Evento"
                          )}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              )}
            </div>
          </div>
        </div>

        {message && (
          <Alert className={`mb-6 ${
            message.includes('❌') ? 'border-red-200 bg-red-50' :
            message.includes('✅') ? 'border-green-200 bg-green-50' :
            'border-blue-200 bg-blue-50'
          }`}>
            <AlertDescription>
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
                      {event.organizer.name || organizerName}
                    </p>
                    <p className="text-sm text-gray-600">
                      Organizador
                    </p>
                    {event.organizer.email && (
                      <p className="text-xs text-gray-500">
                        {event.organizer.email}
                      </p>
                    )}
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

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Participantes Inscritos
                  {attendeesCount > 0 && (
                    <Badge variant="secondary">
                      {attendeesCount}
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {event.attendees && event.attendees.length > 0 ? (
                  <div className="space-y-3">
                    {event.attendees.map((attendee, index) => (
                      <div 
                        key={attendee.id} 
                        className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                      >
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                          <User className="w-5 h-5 text-blue-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 truncate">
                            {attendee.name || `Participante ${index + 1}`}
                          </p>
                          <p className="text-sm text-gray-600 truncate">
                            {attendee.email || `participante${index + 1}@temp.com`}
                          </p>
                        </div>
                        <div className="flex-shrink-0">
                          <Badge variant="secondary" className="text-xs">
                            #{index + 1}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Users className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                    <p className="text-gray-600 font-medium">Nenhum participante inscrito</p>
                    <p className="text-sm text-gray-500 mt-1">
                      {isLoggedIn ? "Seja o primeiro a se inscrever neste evento!" : "Faça login para ver os participantes"}
                    </p>
                    {capacity > 0 && (
                      <p className="text-xs text-gray-400 mt-2">
                        {capacity} vagas disponíveis
                      </p>
                    )}
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

localStorage.setItem("userId", "10026c69-8e92-42cd-a332-64501a8f371c");
