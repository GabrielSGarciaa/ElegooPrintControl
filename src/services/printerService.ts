import { useState, useCallback, useEffect } from 'react';

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
  const [isConnected, setIsConnected] = useState(false);
  const [socket, setSocket] = useState<WebSocket | null>(null);  
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const maxReconnectAttempts = 5;
  
  // Load saved settings from localStorage on initial render
  const loadSettings = useCallback((): PrinterData => {
    const savedSettings = localStorage.getItem('printerSettings');
    const defaultData: PrinterData = {
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
      firmwareVersion: undefined,
      model: undefined,
      uptime: undefined,
      printSettings: {
        layerHeight: 0.05,  // Default values
        exposureTime: 2,
        bottomExposureTime: 30,
        bottomLayers: 6,
        liftSpeed: 60,
        retractSpeed: 180,
        lightIntensity: 100
      }
    };

    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        return {
          ...defaultData,
          ...parsed,
          printSettings: {
            ...defaultData.printSettings,
            ...(parsed.printSettings || {})
          }
        };
      } catch (e) {
        console.error('Failed to parse saved settings', e);
        return defaultData;
      }
    }
    return defaultData;
  }, []);

  const [printerData, setPrinterData] = useState<PrinterData>(loadSettings);

  // Save settings to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('printerSettings', JSON.stringify(printerData));
  }, [printerData]);

  // Helper function to convert status code to text
  const getStatusText = useCallback((statusCode: number): string => {
    const statusMap: {[key: number]: string} = {
      0: 'idle',
      1: 'homing',
      2: 'dropping',
      3: 'exposing',
      4: 'lifting',
      5: 'pausing',
      6: 'paused',
      7: 'stopping',
      8: 'stopped',
      9: 'complete',
      10: 'file_checking'
    };
    return statusMap[statusCode] || 'unknown';
  }, []);

  // Helper function to detect if UV light is on based on printer states
  const isUVLightOn = useCallback((data: any) => {
    // Get the status objects from the data
    const status = data.Status || {};
    const printInfo = status.PrintInfo || {};
    const printStatus = getStatusText(printInfo.Status || 0);
    const machineStatus = status.CurrentStatus || [];
    
    // Check multiple conditions where the UV light might be on
    return (
      // During normal printing exposure
      printStatus === 'exposing' || 
      // During exposure testing 
      machineStatus.includes(3) || 
      // If protocol directly provides UV LED status (some firmware versions might)
      status.UVLEDStatus === 1 ||
      // Look for any other relevant indicators in the response
      status.UVOn === true
    );
  }, [getStatusText]);

  // Connect to printer WebSocket
  const connect = useCallback(() => {
    if (socket) {
      console.log('Closing existing WebSocket connection');
      socket.close();
    }

    const wsUrl = `ws://${printerIP}:3030/websocket`;
    console.log('Creating WebSocket connection to:', wsUrl);
    
    let ws: WebSocket;
    try {
      ws = new WebSocket(wsUrl);
      setSocket(ws);
    } catch (error) {
      console.error('Failed to create WebSocket:', error);
      setIsConnected(false);
      return;
    }

    ws.onopen = () => {
      console.log('Connected to printer WebSocket', {
        readyState: ws.readyState,
        url: ws.url
      });
      setIsConnected(true);
      setReconnectAttempts(0);
      
      // Request initial status
      const message = {
        Id: "web-client",
        Data: {
          Cmd: 0, // Request status refresh
          Data: {},
          RequestID: Date.now().toString().padStart(16, '0'),
          MainboardID: "39e0281e8afa0100",
          TimeStamp: Math.floor(Date.now() / 1000),
          From: 0
        },
        Topic: "sdcp/request/39e0281e8afa0100"
      };
      
      console.log('Sending initial status request:', JSON.stringify(message, null, 2));
      try {
        ws.send(JSON.stringify(message));
      } catch (error) {
        console.error('Error sending status request:', error);
      }
      
      // Set up periodic status updates (every 5 seconds)
      const intervalId = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
          console.log('Sending periodic status update request');
          const updateMessage = {
            Id: "web-client",
            Data: {
              Cmd: 0,
              Data: {},
              RequestID: Date.now().toString().padStart(16, '0'),
              MainboardID: "39e0281e8afa0100",
              TimeStamp: Math.floor(Date.now() / 1000),
              From: 0
            },
            Topic: "sdcp/request/39e0281e8afa0100"
          };
          ws.send(JSON.stringify(updateMessage));
        } else {
          clearInterval(intervalId);
        }
      }, 5000);
      
      // Clean up interval on close
      ws.addEventListener('close', () => {
        clearInterval(intervalId);
      });
    };

    ws.onmessage = (event) => {
      try {
        console.log('📨 WebSocket message received:', {
          data: event.data,
          type: typeof event.data,
          length: event.data.length
        });
        const data = JSON.parse(event.data);
        console.log('Parsed WebSocket data:', JSON.stringify(data, null, 2)); // Pretty print the full data
        
        // Log the firmware version if it exists in the data
        if (data.Data?.Data?.FirmwareVersion) {
          console.log('Found firmware version in Data.Data:', data.Data.Data.FirmwareVersion);
        }
        if (data.Status?.FirmwareVersion) {
          console.log('Found firmware version in Status:', data.Status.FirmwareVersion);
        }
        
        // Handle status updates
        if (data.Topic && data.Topic.includes('status')) {
          const status = data.Status || {};
          const printInfo = status.PrintInfo || {};
          
          console.log('Status update received:', status);
          
          // Extract print settings from the status
          const printSettings = status.PrintSettings || {};
          
          const newPrinterData: PrinterData = {
            status: getStatusText(printInfo.Status || 0),
            progress: printInfo.TotalLayer ? (printInfo.CurrentLayer / printInfo.TotalLayer) * 100 : 0,
            timeRemaining: (printInfo.TotalTicks || 0) - (printInfo.CurrentTicks || 0),
            currentLayer: printInfo.CurrentLayer || 0,
            totalLayers: printInfo.TotalLayer || 0,
            uvLedTemp: status.TempOfUVLED || 0,
            tempOfBox: status.TempOfBox || 0,
            uvLightOn: isUVLightOn(data),
            releaseFilmCount: status.ReleaseFilm || 0,
            exposureScreenUsageTime: status.PrintScreen || 0,
            fileName: printInfo.Filename || '',
            estimatedTime: printInfo.TotalTicks || 0,
            firmwareVersion: data.Data?.Data?.FirmwareVersion || status.FirmwareVersion,
            model: data.Data?.Data?.MachineName || status.Model || 'Elegoo Saturn 4 Ultra',
            uptime: status.Uptime,
            printSettings: {
              layerHeight: printSettings.LayerHeight,
              exposureTime: printSettings.ExposureTime,
              bottomExposureTime: printSettings.BottomExposureTime,
              bottomLayers: printSettings.BottomLayers,
              liftSpeed: printSettings.LiftSpeed,
              retractSpeed: printSettings.RetractSpeed,
              lightIntensity: printSettings.LightIntensity
            }
          };
          
          console.log('Updating printer data with:', JSON.stringify(newPrinterData, null, 2));
          setPrinterData(prev => ({
            ...prev,
            ...newPrinterData
          }));
        } 
        // Handle command responses
        else if (data.Topic && data.Topic.includes('response')) {
          console.log('Command response received:', data);
          // Handle any specific responses if needed
        }
        else {
          console.log('Received other message, topic:', data.Topic);
        }
      } catch (error) {
        console.error('Error parsing printer message:', error);
      }
    };

    ws.onclose = () => {
      console.log('Disconnected from printer');
      setIsConnected(false);
      setSocket(null);
      
      // Try to reconnect
      if (reconnectAttempts < maxReconnectAttempts) {
        const nextAttempt = reconnectAttempts + 1;
        setReconnectAttempts(nextAttempt);
        const delay = Math.min(1000 * nextAttempt, 10000); // Max 10s delay
        
        console.log(`Attempting to reconnect (${nextAttempt}/${maxReconnectAttempts}) in ${delay/1000}s...`);
        setTimeout(() => {
          connect();
        }, delay);
      }
    };

    ws.onerror = (event) => {
      console.error('WebSocket error event:', event);
      console.error('WebSocket URL:', ws.url);
      console.error('WebSocket readyState:', ws.readyState);
      setIsConnected(false);
      
      // Try to get more detailed error information if possible
      if ('error' in event) {
        console.error('Error details:', (event as any).error);
      }
    };

    return () => {
      ws.close();
    };
  }, [printerIP, getStatusText, reconnectAttempts, socket]);

  // Send command to printer
  const sendCommand = useCallback((command: number, data: any = {}) => {
    if (!socket || socket.readyState !== WebSocket.OPEN) {
      console.error('Not connected to printer');
      return;
    }

    const message = {
      Id: "web-client",
      Data: {
        Cmd: command,
        Data: data,
        RequestID: Date.now().toString().padStart(16, '0'),
        MainboardID: "39e0281e8afa0100",
        TimeStamp: Math.floor(Date.now() / 1000),
        From: 0
      },
      Topic: "sdcp/request/39e0281e8afa0100"
    };

    console.log(`Sending command ${command}:`, JSON.stringify(message, null, 2));
    socket.send(JSON.stringify(message));
  }, [socket]);

  // Control functions
  const startPrint = useCallback((filename: string) => {
    sendCommand(128, { Filename: filename, StartLayer: 0 });
  }, [sendCommand]);

  const pausePrint = useCallback(() => {
    sendCommand(129);
  }, [sendCommand]);

  const stopPrint = useCallback(() => {
    sendCommand(130);
  }, [sendCommand]);

  const resumePrint = useCallback(() => {
    // First try to resume using the resume command (command 131)
    // If that doesn't work, it will fall back to starting from the current layer
    sendCommand(131); // Resume command
    
    // If still not resumed after a short delay, try the start from layer method
    const resumeTimeout = setTimeout(() => {
      if (printerData.status === 'paused' && printerData.fileName) {
        console.log('Falling back to start from layer method for resume');
        sendCommand(128, { 
          Filename: printerData.fileName, 
          StartLayer: printerData.currentLayer 
        });
      }
    }, 2000);
    
    return () => clearTimeout(resumeTimeout);
  }, [printerData.fileName, printerData.status, printerData.currentLayer, sendCommand]);

  // Fetch print settings
  const fetchPrintSettings = useCallback(async () => {
    if (!printerIP) {
      console.warn('No printer IP set, using default settings');
      return;
    }

    try {
      console.log(`Attempting to fetch settings from printer at ${printerIP}...`);
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
      
      const response = await fetch(`http://${printerIP}/api/v1/print/settings`, {
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Fetched print settings from printer:', data);
        
        setPrinterData(prev => ({
          ...prev,
          printSettings: {
            ...prev.printSettings, // Keep existing settings as fallback
            layerHeight: data.LayerHeight ?? prev.printSettings?.layerHeight,
            exposureTime: data.ExposureTime ?? prev.printSettings?.exposureTime,
            bottomExposureTime: data.BottomExposureTime ?? prev.printSettings?.bottomExposureTime,
            bottomLayers: data.BottomLayers ?? prev.printSettings?.bottomLayers,
            liftSpeed: data.LiftSpeed ?? prev.printSettings?.liftSpeed,
            retractSpeed: data.RetractSpeed ?? prev.printSettings?.retractSpeed,
            lightIntensity: data.LightIntensity ?? prev.printSettings?.lightIntensity
          }
        }));
      } else {
        console.warn(`Failed to fetch settings: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      if (error.name === 'AbortError') {
        console.warn('Request to fetch settings timed out');
      } else {
        console.warn('Error fetching print settings, using local settings:', error.message);
      }
    }
  }, [printerIP]);

  // Call fetchPrintSettings when connected
  useEffect(() => {
    if (isConnected && printerIP) {
      console.log('Connected to printer, attempting to fetch settings...');
      fetchPrintSettings().catch(error => {
        console.warn('Error in fetchPrintSettings:', error);
      });
    }
  }, [isConnected, printerIP, fetchPrintSettings]);

  // Update printer settings
  const updatePrinterSettings = useCallback((settings: PrinterData['printSettings']) => {
    setPrinterData(prev => ({
      ...prev,
      printSettings: {
        ...prev.printSettings,
        ...settings
      }
    }));
  }, []);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (socket) {
        socket.close();
      }
    };
  }, [socket]);

  return {
    isConnected,
    printerData,
    connect,
    startPrint,
    pausePrint,
    stopPrint,
    resumePrint,
    updatePrinterSettings
  };
};
