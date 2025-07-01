import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin } from "lucide-react";
import { Link } from "react-router-dom";
import type { CreateEventResponse } from "@/types/api";
import { useOrganizerName } from "@/hooks/useOrganizerName";

interface EventCardProps {
  event: CreateEventResponse;
  showRegistrationBadge?: boolean; // Para mostrar badge "Inscrito" quando necessário
  badgeText?: string; // Texto personalizado para o badge
}

// Componente EventCard reutilizável - versão 2.0
export const EventCard = ({ event, showRegistrationBadge = false, badgeText = "Inscrito" }: EventCardProps) => {
  const organizerName = useOrganizerName(event.organizer_id);
  
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
      return date.toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
    } catch {
      return dateString;
    }
  };

  const formatTime = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleTimeString("pt-BR", {
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "";
    }
  };

  return (
    <Card className="event-card hover:shadow-lg transition-shadow">
      <CardHeader className="event-card-content">
        <div className="flex justify-between items-start mb-2">
          <Badge className={getCategoryColor(event.category || "outros")}>
            {event.category || "outros"}
          </Badge>
          {showRegistrationBadge && (
            <Badge className="bg-green-100 text-green-800">
              {badgeText}
            </Badge>
          )}
        </div>
        <CardTitle className="text-lg line-clamp-2">
          {event.name || "Evento sem título"}
        </CardTitle>
        <CardDescription className="line-clamp-3 flex-grow">
          {event.description || "Sem descrição"}
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-2 mb-4">
          <div className="flex items-center text-sm text-gray-600">
            <Calendar className="w-4 h-4 mr-2" />
            {formatDate(event.date || "")} às {formatTime(event.date || "")}
          </div>
          <div className="flex items-center text-sm text-gray-600">
            <MapPin className="w-4 h-4 mr-2" />
            {event.location || "Local não informado"}
          </div>
          <div className={`flex items-center text-sm ${getCapacityColor()}`}>
            <span className="w-4 h-4 mr-2 text-center">👥</span>
            {capacity > 0 ? `${attendeesCount}/${capacity} participantes` : `${attendeesCount} participantes`}
            {isEventFull && <span className="ml-2 text-red-600 font-semibold">LOTADO</span>}
          </div>
        </div>
        
        {/* Footer fixo na parte inferior */}
        <div className="event-card-footer">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-500 truncate max-w-[60%]">
              por {organizerName}
            </span>
            <Link to={`/event/${event.id}`}>
              <Button size="sm" className="cursor-pointer hover:bg-gradient-to-r hover:from-blue-600 hover:to-purple-600">
                Ver Detalhes
              </Button>
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
