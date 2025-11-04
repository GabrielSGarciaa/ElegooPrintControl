import { useState, useEffect, useCallback, useRef } from 'react';
import { PrinterData } from '../services/printerService';

const API_BASE_URL = 'http://localhost:3000';
const WS_URL = 'ws://localhost:3000';

interface PrinterStatus {
  connected: boolean;
  printerIP: string;
  printerData: PrinterData;
}

export const usePrinterBackend = (printerIP: string) => {
  const [printerStatus, setPrinterStatus] = useState<PrinterStatus>({
    connected: false,
    printerIP: '',
    printerData: {
      status: 'idle',
      progress: 0,
      timeRemaining: 0,
      currentLayer: 0,
      totalLayers: 0,
      uvLedTemp: 0,
      tempOfBox: 0,
      uvLightOn: false,
      releaseFilmCount: 0,
      exposureScreenUsageTime: 0,
      fileName: '',
      estimatedTime: 0,
      model: 'Elegoo Printer',
      firmwareVersion: '1.0.0',
    },
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [wsConnected, setWsConnected] = useState(false);
  const ws = useRef<WebSocket | null>(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;

  // Inicializar WebSocket
  useEffect(() => {
    const connectWebSocket = () => {
      if (ws.current) {
        ws.current.close();
      }

      const socket = new WebSocket(WS_URL);
      ws.current = socket;

      socket.onopen = () => {
        console.log('WebSocket conectado');
        setWsConnected(true);
        reconnectAttempts.current = 0;
      };

      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'status') {
            setPrinterStatus(prev => ({
              ...prev,
              connected: data.data.connected,
              printerIP: data.data.printerIP,
              printerData: {
                ...prev.printerData,
                ...data.data.printerData,
                status: data.data.printerData.status || 'idle',
                uvLightOn: data.data.printerData.uvLightOn || false,
                uvLedTemp: data.data.printerData.tempOfUVLED || 0,
                tempOfBox: data.data.printerData.tempOfBox || 0,
              }
            }));
          }
        } catch (error) {
          console.error('Erro ao processar mensagem WebSocket:', error);
        }
      };

      socket.onclose = () => {
        console.log('WebSocket desconectado');
        setWsConnected(false);
        
        // Tentar reconectar
        if (reconnectAttempts.current < maxReconnectAttempts) {
          const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 30000);
          console.log(`Tentando reconectar em ${delay}ms...`);
          
          setTimeout(() => {
            reconnectAttempts.current++;
            connectWebSocket();
          }, delay);
        } else {
          console.error('Número máximo de tentativas de reconexão atingido');
          setError('Não foi possível reconectar ao servidor');
        }
      };

      socket.onerror = (error) => {
        console.error('Erro no WebSocket:', error);
        setError('Erro na conexão com o servidor');
      };
    };

    connectWebSocket();

    return () => {
      if (ws.current) {
        ws.current.close();
        ws.current = null;
      }
    };
  }, []);

  // Função para conectar à impressora via backend
  const connect = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      if (!printerIP) {
        throw new Error('Endereço IP da impressora não fornecido');
      }
      
      // Enviar comando de conexão via WebSocket se disponível
      if (ws.current && wsConnected) {
        ws.current.send(JSON.stringify({
          type: 'connect',
          printerIP
        }));
      }
      
      // Também fazer a requisição HTTP para garantir
      const response = await fetch(`${API_BASE_URL}/api/connect`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ printerIP }),
      });

      if (!response.ok) {
        throw new Error('Falha ao conectar à impressora');
      }

      // Iniciar polling para atualizar os dados
      startPolling();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Função para desconectar
  const disconnect = useCallback(async () => {
    try {
      await fetch(`${API_BASE_URL}/api/disconnect`, {
        method: 'POST',
      });
    } catch (err) {
      console.error('Erro ao desconectar:', err);
    }
  }, []);

  // Função para buscar o status atual
  const fetchStatus = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/status`);
      if (!response.ok) return;
      
      const data = await response.json();
      setPrinterStatus({
        connected: data.connected,
        printerIP: data.printerIP,
        printerData: {
          ...data.printerData,
          // Garantir que todos os campos obrigatórios estejam presentes
          releaseFilmCount: data.printerData.releaseFilmCount || 0,
          exposureScreenUsageTime: data.printerData.exposureScreenUsageTime || 0,
          model: data.printerData.model || 'Elegoo Printer',
          firmwareVersion: data.printerData.firmwareVersion || '1.0.0',
        },
      });
    } catch (err) {
      console.error('Erro ao buscar status:', err);
    }
  }, []);

  // Efeito para polling de status
  const [pollingInterval, setPollingInterval] = useState<NodeJS.Timeout | null>(null);

  const startPolling = useCallback(() => {
    // Limpar intervalo existente
    if (pollingInterval) clearInterval(pollingInterval);
    
    // Iniciar novo intervalo
    fetchStatus(); // Buscar imediatamente
    const interval = setInterval(fetchStatus, 2000); // A cada 2 segundos
    setPollingInterval(interval);
    
    return () => clearInterval(interval);
  }, [fetchStatus]);

  // Limpar intervalo ao desmontar
  useEffect(() => {
    return () => {
      if (pollingInterval) clearInterval(pollingInterval);
    };
  }, [pollingInterval]);

  // Conectar automaticamente ao montar o componente
  useEffect(() => {
    connect();
    
    return () => {
      if (pollingInterval) clearInterval(pollingInterval);
      disconnect();
    };
  }, []);

  return {
    ...printerStatus,
    isLoading,
    error,
    connect,
    disconnect,
    refresh: fetchStatus,
  };
};

export default usePrinterBackend;
