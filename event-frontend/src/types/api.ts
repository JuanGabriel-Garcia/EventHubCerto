export interface CreateUserRequest {
  name: string;
  email: string;
  password: string;
  // userType removido - será definido automaticamente como 'participant'
}

export interface CreateUserResponse {
  id: string;
  name: string;
  email: string;
  userType: string;
  createdAt: string;
}

export interface CreateEventRequest {
  name: string;        // Backend espera "name" não "title"
  description: string;
  date: string;        // Formato: "2025-07-26T14:30"
  location: string;
  category: string;
  limit: number;       // Backend espera "limit" não "capacity"
  // price não existe no backend
  // time não é separado, está incluído na date
}

export interface CreateEventResponse {
  id: string;
  name: string;        // Backend retorna "name"
  description: string;
  date: string;        // Formato ISO com data e hora
  location: string;
  category: string;
  limit: number;       // Backend retorna "limit"
  organizer_id: string;
  attendees?: string[]; // Array de IDs dos participantes
  created_at: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  // Outros campos opcionais caso o backend mude no futuro
  user?: {
    id: string;
    name: string;
    email: string;
    userType: string;
  };
}

export interface ApiError {
  message: string;
  statusCode?: number;
}

export interface Event {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  location: string;
  category: string;
  capacity: number;
  registered: number;
  price: number;
  organizerId: string;
  status: 'upcoming' | 'ongoing' | 'completed';
  createdAt: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  userType: 'participant' | 'organizer';
  createdAt: string;
}

export interface EventWithAttendeesResponse {
  id: string;
  name: string;
  location: string;
  date: string;        // Formato ISO com data e hora
  description: string;
  organizer: CreateUserResponse;
  attendees: CreateUserResponse[]; // Array de usuários participantes (só para organizador)
  attendees_count: number;         // Número total de participantes (sempre visível)
  created_at: string;
  category: string;
  limit: number;
  // Para compatibilidade, adicionamos aliases
  title?: string;      // Alias para name
  capacity?: number;   // Alias para limit
  registered?: number; // Calculado baseado em attendees.length
}
