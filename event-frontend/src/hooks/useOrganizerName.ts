import { useState, useEffect } from 'react';
import { apiService } from '@/services/api';

// interface OrganizerCache {
//   [key: string]: string;
// }

// // Cache para evitar múltiplas requisições para o mesmo organizador
// const organizerCache: OrganizerCache = {};

export function useOrganizerName(organizerId: string, organizerObject?: any): string {
  const [organizerName, setOrganizerName] = useState<string>('');

  useEffect(() => {
    // Se já temos o objeto organizador completo, usar diretamente
    if (organizerObject && organizerObject.name) {
      setOrganizerName(organizerObject.name);
      return;
    }

    // Caso contrário, buscar pelo ID como antes
    if (!organizerId) {
      setOrganizerName('Organizador');
      return;
    }

    const fetchOrganizerName = async () => {
      try {
        const user = await apiService.getUserById(organizerId);
        setOrganizerName(user.name);
      } catch (error) {
        console.error('Error fetching organizer name:', error);
        setOrganizerName('Organizador');
      }
    };

    fetchOrganizerName();
  }, [organizerId, organizerObject]);

  return organizerName;
}
