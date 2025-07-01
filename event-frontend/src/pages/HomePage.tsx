"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Filter } from "lucide-react";
import { Link } from "react-router-dom";
import { apiService } from "@/services/api";
import type { CreateEventResponse } from "@/types/api";
import { EventCard } from "@/components/EventCard";
import { LogoutModal } from "@/components/LogoutModal";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

export default function HomePage() {
  const [events, setEvents] = useState<CreateEventResponse[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<CreateEventResponse[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadEvents();
    checkLoginStatus();

    // Listener para mudanças no localStorage (quando usuário faz login/logout em outra aba)
    const handleStorageChange = () => {
      checkLoginStatus();
    };

    // Listener para quando a janela ganha foco (usuário volta para a aba)
    const handleFocus = () => {
      checkLoginStatus();
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('focus', handleFocus);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  const checkLoginStatus = () => {
    const loggedIn = localStorage.getItem("isLoggedIn") === "true";
    setIsLoggedIn(loggedIn);
  };

  const loadEvents = async () => {
    try {
      setIsLoading(true);
      const allEvents = await apiService.getEvents();
      console.log("Loaded events:", allEvents);
      setEvents(allEvents);
      setFilteredEvents(allEvents);
    } catch (error) {
      console.error("Error loading events:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let filtered = events;

    if (searchTerm) {
      filtered = filtered.filter(
        (event) =>
          event.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          event.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          event.location?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (categoryFilter !== "all") {
      filtered = filtered.filter((event) => event.category === categoryFilter);
    }

    setFilteredEvents(filtered);
  }, [events, searchTerm, categoryFilter]);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">EventHub</h1>
            </div>
            <nav className="flex items-center space-x-4">
              {isLoggedIn ? (
                <>
                  <Link to="/dashboard">
                    <Button variant="ghost">Dashboard</Button>
                  </Link>
                  <Link to="/create-event">
                    <Button variant="ghost">Criar Evento</Button>
                  </Link>
                  <LogoutModal
                    onLogout={() => {
                      localStorage.removeItem("isLoggedIn");
                      setIsLoggedIn(false);
                    }}
                  >
                    <Button variant="outline">
                      Sair
                    </Button>
                  </LogoutModal>
                </>
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

      <section className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold mb-4">
            Descubra e Participe dos Melhores Eventos
          </h2>
          <p className="text-xl mb-8 opacity-90">
            Conecte-se com pessoas, aprenda coisas novas e expanda seus
            horizontes
          </p>
          {!isLoggedIn && (
            <Link to="/register">
              <Button
                size="lg"
                className="bg-white text-blue-600 hover:bg-gray-100"
              >
                Comece Agora
              </Button>
            </Link>
          )}
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Buscar eventos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2">
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-48">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as categorias</SelectItem>
                <SelectItem value="tecnologia">Tecnologia</SelectItem>
                <SelectItem value="negocios">Negócios</SelectItem>
                <SelectItem value="design">Design</SelectItem>
                <SelectItem value="educacao">Educação</SelectItem>
                <SelectItem value="saude">Saúde</SelectItem>
                <SelectItem value="arte">Arte e Cultura</SelectItem>
                <SelectItem value="esporte">Esporte</SelectItem>
                <SelectItem value="outros">Outros</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {isLoading ? (
            <div className="col-span-full">
              <LoadingSpinner text="Carregando eventos..." />
            </div>
          ) : filteredEvents.length === 0 ? (
            <div className="col-span-full text-center py-8">
              <p className="text-gray-500">Nenhum evento encontrado.</p>
            </div>
          ) : (
            filteredEvents.map((event) => (
              <EventCard key={event.id} event={event} />
            ))
          )}
        </div>

        {filteredEvents.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">
              Nenhum evento encontrado com os filtros aplicados.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
