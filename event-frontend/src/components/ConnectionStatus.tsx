import { useState, useEffect } from 'react';
import { apiService } from '@/services/api';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface ConnectionStatusProps {
  showStatus?: boolean;
}

export function ConnectionStatus({ showStatus = true }: ConnectionStatusProps) {
  const [isConnected, setIsConnected] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkConnection = async () => {
      setIsLoading(true);
      try {
        const connected = await apiService.testConnection();
        setIsConnected(connected);
      } catch (error) {
        console.error('Connection check failed:', error);
        setIsConnected(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkConnection();
    
    // Verificar conexão a cada 30 segundos
    const interval = setInterval(checkConnection, 30000);
    
    return () => clearInterval(interval);
  }, []);

  if (!showStatus) return null;

  if (isLoading) {
    return (
      <Alert className="mb-4">
        <AlertDescription>
          🔄 Verificando conexão com o servidor...
        </AlertDescription>
      </Alert>
    );
  }

  if (isConnected === false) {
    return (
      <Alert variant="destructive" className="mb-4">
        <AlertDescription>
          ❌ Não foi possível conectar ao servidor. Verifique se o backend está rodando na porta 8080.
        </AlertDescription>
      </Alert>
    );
  }

  if (isConnected === true) {
    return (
      <Alert className="mb-4 border-green-200 bg-green-50">
        <AlertDescription className="text-green-800">
          ✅ Conectado ao servidor
        </AlertDescription>
      </Alert>
    );
  }

  return null;
}
