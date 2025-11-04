import { useCallback } from 'react';
import usePrinterBackend from '../hooks/usePrinterBackend';

export interface PrinterData {
  status: string;
  progress: number;
  timeRemaining: number;
  currentLayer: number;
  totalLayers: number;
  uvLedTemp: number;
  tempOfBox: number;
  uvLightOn: boolean;
  releaseFilmCount: number;
  exposureScreenUsageTime: number;
  fileName: string;
  estimatedTime: number;
  firmwareVersion?: string;
  model?: string;
  uptime?: number;
  printSettings?: {
    layerHeight?: number;
    exposureTime?: number;
    bottomExposureTime?: number;
    bottomLayers?: number;
    liftSpeed?: number;
    retractSpeed?: number;
    lightIntensity?: number;
  };
}

export const usePrinter = (printerIP: string) => {
  const {
    connected: isConnected,
    printerData,
    connect: connectToBackend,
    disconnect,
    isLoading,
    error,
    refresh: fetchStatus,
  } = usePrinterBackend(printerIP);

  // Wrapper for connect that ensures we have a printerIP
  const connect = useCallback(async () => {
    if (!printerIP) {
      console.error('Nenhum endereço IP de impressora fornecido');
      return false;
    }
    return connectToBackend();
  }, [connectToBackend, printerIP]);

  const API_BASE_URL = 'http://localhost:3000';

  // Funções de controle da impressora
  const startPrint = useCallback(async (filePath: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/print/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ filePath }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Falha ao iniciar impressão');
      }
      return true;
    } catch (err) {
      console.error('Erro ao iniciar impressão:', err);
      throw err;
    }
  }, []);

  const pausePrint = useCallback(async () => {
    console.log('Enviando comando para pausar impressão...');
    try {
      const response = await fetch(`${API_BASE_URL}/api/print/pause`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      const responseData = await response.json().catch(() => ({}));
      
      if (!response.ok) {
        console.error('Erro ao pausar impressão:', responseData.error || 'Erro desconhecido');
        throw new Error(responseData.error || 'Falha ao pausar impressão');
      }
      
      console.log('Resposta do comando de pausa:', responseData);
      
      // Forçar atualização de status após um pequeno atraso
      setTimeout(() => {
        if (isConnected) {
          console.log('Forçando atualização de status após pausa...');
          fetchStatus();
        }
      }, 500);
      
      return true;
    } catch (err) {
      console.error('Erro ao pausar impressão:', err);
      throw err;
    }
  }, [isConnected, fetchStatus]);

  const resumePrint = useCallback(async () => {
    console.log('Enviando comando para retomar impressão...');
    try {
      const response = await fetch(`${API_BASE_URL}/api/print/resume`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      const responseData = await response.json().catch(() => ({}));
      
      if (!response.ok) {
        console.error('Erro ao retomar impressão:', responseData.error || 'Erro desconhecido');
        throw new Error(responseData.error || 'Falha ao retomar impressão');
      }
      
      console.log('Resposta do comando de retomada:', responseData);
      
      // Forçar atualização de status após um pequeno atraso
      setTimeout(() => {
        if (isConnected) {
          console.log('Forçando atualização de status após retomada...');
          fetchStatus();
        }
      }, 500);
      
      return true;
    } catch (err) {
      console.error('Erro ao retomar impressão:', err);
      throw err;
    }
  }, [isConnected, fetchStatus]);

  const stopPrint = useCallback(async () => {
    console.log('Enviando comando para parar impressão...');
    try {
      const response = await fetch(`${API_BASE_URL}/api/print/stop`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      const responseData = await response.json().catch(() => ({}));
      
      if (!response.ok) {
        console.error('Erro ao parar impressão:', responseData.error || 'Erro desconhecido');
        throw new Error(responseData.error || 'Falha ao parar impressão');
      }
      
      console.log('Resposta do comando de parada:', responseData);
      
      // Forçar atualização de status após um pequeno atraso
      setTimeout(() => {
        if (isConnected) {
          console.log('Forçando atualização de status após parada...');
          fetchStatus();
        }
      }, 500);
      
      return true;
    } catch (err) {
      console.error('Erro ao parar impressão:', err);
      throw err;
    }
  }, [isConnected, fetchStatus]);

  // Atualiza configurações locais
  const updatePrinterSettings = useCallback((settings: any) => {
    try {
      localStorage.setItem('printerSettings', JSON.stringify(settings));
      return true;
    } catch (err) {
      console.error('Erro ao salvar configurações:', err);
      return false;
    }
  }, []);

  // Carrega configurações salvas
  const loadSettings = useCallback((): any => {
    try {
      const savedSettings = localStorage.getItem('printerSettings');
      return savedSettings ? JSON.parse(savedSettings) : {};
    } catch (err) {
      console.error('Erro ao carregar configurações:', err);
      return {};
    }
  }, []);

  return {
    isConnected,
    printerData: {
      ...printerData,
      printSettings: loadSettings(),
    },
    connect,
    disconnect,
    startPrint,
    pausePrint,
    resumePrint,
    stopPrint,
    updatePrinterSettings,
    isLoading,
    error,
  };
};

export default usePrinter;