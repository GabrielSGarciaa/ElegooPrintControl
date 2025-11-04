import WebSocket from 'ws';

export class PrinterManager {
  constructor() {
    this.printerIP = process.env.PRINTER_IP || '';
    this.client = null;
    this.connected = false;
    
    // Estado inicial baseado no protocolo SDCP 3.0
    this.printerData = {
      // Status da máquina (0: ociosa, 1: imprimindo, 2: transferindo arquivo, 3: teste de exposição, 4: auto-teste)
      currentStatus: 0,
      previousStatus: 0,
      
      // Informações de impressão
      printInfo: {
        status: 0, // Sub-status da impressão (0-10 conforme documentação)
        currentLayer: 0,
        totalLayers: 0,
        currentTicks: 0,
        totalTicks: 0,
        fileName: '',
        errorNumber: 0,
        taskId: ''
      },
      
      // Dados do sistema
      printScreen: 0,         // Tempo total de uso da tela de exposição (s)
      releaseFilm: 0,         // Contador de ciclos de filme
      tempOfUVLED: 0,         // Temperatura atual do LED UV (°C)
      timeLapseStatus: 0,      // Status de time-lapse (0: desligado, 1: ligado)
      tempOfBox: 0,           // Temperatura atual da caixa (°C)
      tempTargetBox: 0,        // Temperatura alvo da caixa (°C)
      
      // Dados calculados para o frontend
      uvLightOn: false,       // Calculado com base no status e temperatura
      progress: 0,            // Progresso da impressão (%)
      timeRemaining: 0,       // Tempo restante estimado (s)
      estimatedTime: 0,       // Tempo total estimado (s)
      
      // Informações adicionais
      model: 'Elegoo Printer',
      firmwareVersion: '1.0.0',
      lastUpdate: null        // Timestamp da última atualização
    };
    
    this.pendingCommands = new Map();
    this.commandTimeout = 5000; // 5 segundos de timeout para comandos
    this.lastStatusUpdate = 0;  // Timestamp da última atualização de status
  }

  async connect() {
    return new Promise((resolve, reject) => {
      const wsUrl = `ws://${this.printerIP}:3030/websocket`;
      console.log(`Conectando à impressora em ${wsUrl}...`);

      try {
        this.client = new WebSocket(wsUrl);

        this.client.onopen = () => {
          console.log('✅ Conectado à impressora');
          this.connected = true;
          this.requestStatus();
          resolve();
        };

        this.client.onmessage = (event) => {
          this.handleMessage(event.data);
        };

        this.client.onclose = () => {
          console.log('🔌 Desconectado da impressora');
          this.connected = false;
        };

        this.client.onerror = (error) => {
          console.error('❌ Erro na conexão:', error);
          this.connected = false;
          reject(error);
        };
      } catch (error) {
        console.error('Erro ao criar WebSocket:', error);
        reject(error);
      }
    });
  }

  handleMessage(data) {
    try {
      const message = JSON.parse(data);
      console.log('📥 Mensagem recebida:', JSON.stringify(message, null, 2));
      
      // Processar mensagem de status SDCP 3.0
      if (message.Topic === 'sdcp/status/update') {
        console.log('📡 Atualizando dados da impressora...');
        this.updatePrinterData(message);
      } 
      // Processar respostas a comandos
      else if (message.Topic && message.Topic.startsWith('sdcp/response/')) {
        const cmd = message.Data?.Cmd;
        const result = message.Data?.Result;
        const errorCode = message.Data?.ErrorCode;
        
        console.log(`📥 Resposta recebida - Comando: ${cmd}, Resultado: ${result}, Código de erro: ${errorCode}`);
        
        // Handle specific command responses
        if (result === 0) { // Success
          switch (cmd) {
            case 4: // Stop
              console.log('🛑 Comando de parada confirmado pela impressora');
              this.printerData.status = 'idle';
              // Reset print progress when print is stopped
              this.printerData.progress = 0;
              this.printerData.currentLayer = 0;
              this.printerData.timeRemaining = 0;
              break;
              
            case 5: // Pause
              console.log('⏸️ Comando de pausa confirmado pela impressora');
              this.printerData.status = 'paused';
              break;
              
            case 6: // Resume
              console.log('▶️ Comando de retomada confirmado pela impressora');
              this.printerData.status = 'printing';
              break;
              
            default:
              console.log(`✅ Comando ${cmd} executado com sucesso`);
          }
        } else {
          // Handle error response
          const errorMsg = `❌ Erro ao executar comando ${cmd}`;
          if (errorCode) {
            console.error(`${errorMsg}, Código: ${errorCode}`);
          } else {
            console.error(errorMsg);
          }
          
          // If the command failed, we should update the status based on the printer's actual state
          // Request current status to ensure UI is in sync
          this.requestStatus();
        }
      }
    } catch (error) {
      console.error('Erro ao processar mensagem:', error);
    }
  }

  isUVLightOn(status) {
    // De acordo com o SDCP 3.0, o status da luz UV pode ser inferido de várias maneiras
    // 1. Se houver um campo UVOn explícito, usamos ele
    // 2. Caso contrário, inferimos com base no status da impressão e temperatura
    
    // Verifica se há um campo UVOn explícito
    if (status.UVOn !== undefined) {
      console.log('🔍 Status UV explícito encontrado:', status.UVOn);
      return status.UVOn === 1 || status.UVOn === true;
    }
    
    // Se não houver, infere com base em outros campos
    const currentStatus = status.CurrentStatus?.[0] ?? -1;
    const printStatus = status.PrintInfo?.Status ?? -1;
    const tempOfUVLED = status.TempOfUVLED ?? 0;
    const uvLedStatus = status.UVLEDStatus ?? 0;
    
    // Lógica de inferência baseada no protocolo SDCP 3.0
    const isOn = (
      // Se o status do LED UV estiver ativo
      uvLedStatus === 1 ||
      // Ou se estiver em um estado de impressão e a temperatura estiver acima do limiar
      (currentStatus === 1 && tempOfUVLED > 30) ||
      // Ou se estiver em um dos estágios que normalmente usam a luz UV
      [3, 4, 5].includes(printStatus) // 3: exposição, 4: levantando, 5: pausando
    );
    
    // Log detalhado para depuração
    console.log('🔍 Verificação de status da luz UV:', {
      currentStatus,
      printStatus,
      tempOfUVLED,
      uvLedStatus,
      UVOn: status.UVOn,
      isUVLightOn: isOn
    });
    
    return isOn;
  }

  updatePrinterData(message) {
    try {
      const { Status } = message;
      if (!Status) {
        console.log('❌ Nenhum status encontrado na mensagem');
        return;
      }

      // Log detalhado apenas em desenvolvimento
      if (process.env.NODE_ENV === 'development') {
        console.log('📡 Dados brutos recebidos da impressora:', JSON.stringify(Status, null, 2));
      }
      
      // Extrair campos relevantes do status
      const { 
        PrintInfo = {},
        TempOfUVLED = this.printerData.tempOfUVLED,
        ReleaseFilm = this.printerData.releaseFilm,
        PrintScreen = this.printerData.printScreen,
        CurrentStatus = [this.printerData.currentStatus],
        UVLEDStatus,
        UVOn,
        TempOfBox = this.printerData.tempOfBox,
        TempTargetBox = this.printerData.tempTargetBox,
        TimeLapseStatus = this.printerData.timeLapseStatus
      } = Status;
      
      // Determinar o status atual da impressora
      const currentStatus = Array.isArray(CurrentStatus) ? CurrentStatus[0] : CurrentStatus;
      const printStatus = PrintInfo?.Status ?? this.printerData.printInfo.status;
      
      // Atualizar dados do sistema
      this.printerData.tempOfUVLED = TempOfUVLED;
      this.printerData.releaseFilm = ReleaseFilm;
      this.printerData.printScreen = PrintScreen;
      this.printerData.tempOfBox = TempOfBox;
      this.printerData.tempTargetBox = TempTargetBox;
      this.printerData.timeLapseStatus = TimeLapseStatus;
      
      // Atualizar status da máquina
      if (currentStatus !== undefined) {
        this.printerData.previousStatus = this.printerData.currentStatus;
        this.printerData.currentStatus = currentStatus;
      }
      
      // Atualizar informações de impressão
      if (PrintInfo) {
        this.printerData.printInfo = {
          status: printStatus,
          currentLayer: PrintInfo.CurrentLayer ?? PrintInfo.CurLayer ?? this.printerData.printInfo.currentLayer,
          totalLayers: PrintInfo.TotalLayer ?? this.printerData.printInfo.totalLayers,
          currentTicks: PrintInfo.CurrentTicks ?? this.printerData.printInfo.currentTicks,
          totalTicks: PrintInfo.TotalTicks ?? this.printerData.printInfo.totalTicks,
          fileName: PrintInfo.Filename ?? PrintInfo.FileName ?? this.printerData.printInfo.fileName,
          errorNumber: PrintInfo.ErrorNumber ?? this.printerData.printInfo.errorNumber,
          taskId: PrintInfo.TaskId ?? this.printerData.printInfo.taskId
        };
      }
      
      // Calcular dados derivados
      this.calculateDerivedData();
      
      // Atualizar timestamp
      this.printerData.lastUpdate = new Date();
      this.lastStatusUpdate = Date.now();
      
      // Log de depuração
      console.log('🔄 Dados da impressora atualizados:', {
        currentStatus: this.printerData.currentStatus,
        printStatus: this.printerData.printInfo.status,
        uvTemp: this.printerData.tempOfUVLED,
        uvLightOn: this.printerData.uvLightOn,
        currentLayer: `${this.printerData.printInfo.currentLayer}/${this.printerData.printInfo.totalLayers}`,
        fileName: this.printerData.printInfo.fileName
      });
    } catch (error) {
      console.error('❌ Erro ao processar atualização de status:', error);
    }
    
    // Log changes for debugging
    const changes = {};
    Object.keys(newData).forEach(key => {
      if (JSON.stringify(this.printerData[key]) !== JSON.stringify(newData[key])) {
        changes[key] = {
          old: this.printerData[key],
          new: newData[key]
        };
      }
    });
    
    if (Object.keys(changes).length > 0) {
      console.log('🔄 Mudanças detectadas:', changes);
    }
    
    this.printerData = { ...this.printerData, ...newData };
    console.log('📊 Dados de status atualizados:', newData);
  }

  getStatusText(statusCode) {
    if (statusCode === null || statusCode === undefined) return 'unknown';
    
    const statusMap = {
      0: 'idle',
      1: 'printing', // Changed from 'preheating' to 'printing'
      2: 'printing', // Changed from 'heating' to 'printing'
      3: 'printing',
      4: 'paused',
      5: 'stopping',
      6: 'stopped',
      7: 'complete',
      8: 'file_checking',
      9: 'error',
      10: 'unknown'
    };
    
    return statusMap[statusCode] || 'unknown';
  }

  isUVLightOn(data) {
    const status = data.Status || {};
    const printInfo = status.PrintInfo || {};
    const printStatus = this.getStatusText(printInfo.Status || 0);

    return printStatus === 'exposing' || status.UVLEDStatus === 1 || status.UVOn === true;
  }

  requestStatus() {
    if (!this.printerSocket || this.printerSocket.readyState !== WebSocket.OPEN) {
      return;
    }

    const message = {
      Id: 'server-client',
      Data: {
        Cmd: 0,
        Data: {},
        RequestID: Date.now().toString().padStart(16, '0'),
        MainboardID: '39e0281e8afa0100',
        TimeStamp: Math.floor(Date.now() / 1000),
        From: 0,
      },
      Topic: 'sdcp/request/39e0281e8afa0100',
    };

    console.log('📤 Solicitando status...');
    this.printerSocket.send(JSON.stringify(message));
  }

  disconnect() {
    if (this.printerSocket) {
      this.printerSocket.close();
      this.printerSocket = null;
    }
    this.isConnectedFlag = false;
  }

  isConnected() {
    return this.isConnectedFlag;
  }

  getPrinterData() {
    return this.printerData;
  }

  sendCommand(command) {
    if (!this.printerSocket) {
      console.error('❌ Não é possível enviar comando: WebSocket não está inicializado');
      return false;
    }

    if (this.printerSocket.readyState !== WebSocket.OPEN) {
      console.error(`❌ Não é possível enviar comando ${command}: WebSocket não está conectado (estado: ${this.printerSocket.readyState})`);
      return false;
    }

    const requestId = Date.now().toString().padStart(16, '0');
    const timestamp = Math.floor(Date.now() / 1000);

    const message = {
      Id: 'server-client',
      Data: {
        Cmd: command,
        Data: {},
        RequestID: requestId,
        MainboardID: '39e0281e8afa0100',
        TimeStamp: timestamp,
        From: 0,
      },
      Topic: 'sdcp/request/39e0281e8afa0100',
    };

    console.log(`📤 Enviando comando ${command} (RequestID: ${requestId})`);
    
    try {
      const messageString = JSON.stringify(message);
      console.log(`📤 Mensagem enviada:`, messageString);
      
      this.printerSocket.send(messageString);
      console.log(`✅ Comando ${command} enviado com sucesso`);
      
      // Schedule a status update after a short delay to ensure we get the latest state
      setTimeout(() => {
        if (this.printerSocket && this.printerSocket.readyState === WebSocket.OPEN) {
          this.requestStatus();
        }
      }, 300);
      
      return true;
    } catch (error) {
      console.error(`❌ Erro ao enviar comando ${command}:`, error);
      
      // If we get an error, try to reconnect and request status
      if (this.printerSocket && this.printerSocket.readyState !== WebSocket.OPEN) {
        console.log('🔌 Tentando reconectar ao WebSocket...');
        this.connect().then(() => {
          console.log('✅ Reconexão bem-sucedida');
          this.requestStatus();
        }).catch(err => {
          console.error('❌ Falha na reconexão:', err);
        });
      }
      
      return false;
    }
  }

  async pausePrint() {
    console.log('⏸️  Enviando comando para pausar impressão...');
    const success = await this.sendCommand(5); // Comando 5 é para pausar a impressão
    if (success) {
      console.log('✅ Comando de pausa enviado com sucesso');
      // Atualiza o status imediatamente para melhor experiência do usuário
      this.printerData.status = 'paused';
    } else {
      console.error('❌ Falha ao enviar comando de pausa');
    }
    return success;
  }

  async resumePrint() {
    console.log('▶️  Enviando comando para retomar impressão...');
    const success = await this.sendCommand(6); // Comando 6 é para retomar a impressão
    if (success) {
      console.log('✅ Comando de retomada enviado com sucesso');
      // Atualiza o status imediatamente para melhor experiência do usuário
      this.printerData.status = 'printing';
    } else {
      console.error('❌ Falha ao enviar comando de retomada');
    }
    return success;
  }

  async stopPrint() {
    console.log('🛑 Enviando comando para parar impressão...');
    const success = await this.sendCommand(4); // Comando 4 é para parar a impressão
    if (success) {
      console.log('✅ Comando de parada enviado com sucesso');
      // Reseta os dados da impressão
      this.printerData.status = 'idle';
      this.printerData.progress = 0;
      this.printerData.currentLayer = 0;
      this.printerData.timeRemaining = 0;
    } else {
      console.error('❌ Falha ao enviar comando de parada');
    }
    return success;
  }
}
