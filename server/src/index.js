import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { exec } from 'child_process';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import { PrinterManager } from './printerManager.js';

dotenv.config();

const app = express();
const server = createServer(app);
const wss = new WebSocketServer({ server });

const PORT = process.env.PORT || 3000;
const PRINTER_IP = process.env.PRINTER_IP || '10.205.117.244';

// Inicializa o gerenciador da impressora
const printerManager = new PrinterManager();

// Configuração do CORS
const corsOptions = {
  origin: ['http://localhost:8080', 'http://10.205.117.136:8080'],
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json());

// Função para enviar atualizações de status
const createStatusUpdater = (ws) => {
  const sendStatusUpdate = () => {
    try {
      if (printerManager) {
        ws.send(JSON.stringify({
          type: 'status',
          data: {
            connected: printerManager.isConnected(),
            printerIP: printerManager.printerIP,
            printerData: printerManager.getPrinterData()
          }
        }));
      }
    } catch (error) {
      console.error('Erro ao enviar atualização de status:', error);
    }
  };
  return sendStatusUpdate;
};

// WebSocket connection handling
wss.on('connection', (ws) => {
  console.log('Novo cliente WebSocket conectado');
  
  // Criar e configurar o atualizador de status
  const sendStatusUpdate = createStatusUpdater(ws);
  
  // Enviar atualização imediata
  sendStatusUpdate();
  
  // Configurar atualizações periódicas
  const interval = setInterval(sendStatusUpdate, 1000);

  ws.on('close', () => {
    console.log('Cliente WebSocket desconectado');
    clearInterval(interval);
  });
  
  // Tratar mensagens do cliente
  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      console.log('Mensagem recebida do cliente:', data);
      
      if (data.type === 'connect' && data.printerIP) {
        printerManager.connect(data.printerIP)
          .then(() => sendStatusUpdate())
          .catch(error => console.error('Erro ao conectar:', error));
      }
    } catch (error) {
      console.error('Erro ao processar mensagem do cliente:', error);
    }
  });
});

// Rota raiz
app.get('/', (req, res) => {
  res.json({
    name: 'Elegoo Print Control API',
    status: 'running',
    endpoints: [
      'GET    /health',
      'POST   /api/connect',
      'POST   /api/disconnect',
      'GET    /api/status',
      'POST   /api/print/start',
      'POST   /api/print/pause',
      'POST   /api/print/resume',
      'POST   /api/print/stop'
    ]
  });
});

// Gerenciador de impressora (já declarado no topo)

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Conectar à impressora
app.post('/api/connect', async (req, res) => {
  try {
    const { printerIP } = req.body;
    const ipToUse = printerIP || PRINTER_IP;
    
    // Se o IP mudou ou é a primeira conexão, criar um novo gerenciador
    if (!printerManager || printerManager.printerIP !== ipToUse) {
      // Desconectar o gerenciador antigo se existir
      if (printerManager) {
        printerManager.disconnect();
      }
      // Criar novo gerenciador com o IP fornecido
      printerManager = new PrinterManager(ipToUse);
    }
    
    await printerManager.connect();
    res.json({ 
      success: true, 
      message: `Conectado à impressora em ${ipToUse}`,
      printerIP: ipToUse
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: `Falha ao conectar à impressora: ${error.message}` 
    });
  }
});

// Desconectar da impressora
app.post('/api/disconnect', (req, res) => {
  printerManager.disconnect();
  res.json({ success: true, message: 'Desconectado da impressora' });
});

// Status da conexão
app.get('/api/status', (req, res) => {
  res.json({
    connected: printerManager ? printerManager.isConnected() : false,
    printerIP: printerManager ? printerManager.printerIP : PRINTER_IP,
    printerData: printerManager ? printerManager.getPrinterData() : {},
  });
});

// Rotas de controle da impressora
app.post('/api/print/start', async (req, res) => {
  try {
    const { filePath } = req.body;
    if (!filePath) {
      return res.status(400).json({ success: false, error: 'Caminho do arquivo não fornecido' });
    }
    // TODO: Implementar lógica para iniciar impressão
    console.log(`Iniciando impressão do arquivo: ${filePath}`);
    res.json({ success: true, message: 'Impressão iniciada' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/print/pause', async (req, res) => {
  console.log('Recebida requisição para pausar impressão');
  try {
    if (!printerManager.isConnected()) {
      console.error('Erro: Não conectado à impressora');
      return res.status(400).json({ success: false, error: 'Não conectado à impressora' });
    }
    
    const success = await printerManager.pausePrint();
    if (success) {
      console.log('✅ Comando de pausa processado com sucesso');
      res.json({ 
        success: true, 
        message: 'Comando de pausa enviado',
        status: 'paused'
      });
    } else {
      throw new Error('Falha ao processar comando de pausa');
    }
  } catch (error) {
    console.error('❌ Erro ao pausar impressão:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Erro desconhecido ao pausar impressão' 
    });
  }
});

app.post('/api/print/resume', async (req, res) => {
  console.log('Recebida requisição para retomar impressão');
  try {
    if (!printerManager.isConnected()) {
      console.error('Erro: Não conectado à impressora');
      return res.status(400).json({ success: false, error: 'Não conectado à impressora' });
    }
    
    const success = await printerManager.resumePrint();
    if (success) {
      console.log('✅ Comando de retomada processado com sucesso');
      res.json({ 
        success: true, 
        message: 'Comando de retomada enviado',
        status: 'printing'
      });
    } else {
      throw new Error('Falha ao processar comando de retomada');
    }
  } catch (error) {
    console.error('❌ Erro ao retomar impressão:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Erro desconhecido ao retomar impressão' 
    });
  }
});

app.post('/api/print/stop', async (req, res) => {
  console.log('Recebida requisição para parar impressão');
  try {
    if (!printerManager.isConnected()) {
      console.error('Erro: Não conectado à impressora');
      return res.status(400).json({ success: false, error: 'Não conectado à impressora' });
    }
    
    const success = await printerManager.stopPrint();
    if (success) {
      console.log('✅ Comando de parada processado com sucesso');
      res.json({ 
        success: true, 
        message: 'Comando de parada enviado',
        status: 'idle'
      });
    } else {
      throw new Error('Falha ao processar comando de parada');
    }
  } catch (error) {
    console.error('❌ Erro ao parar impressão:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Erro desconhecido ao parar impressão' 
    });
  }
});

// Iniciar o servidor
server.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
  console.log(`WebSocket rodando na porta ${PORT}`);
  console.log(`Aguardando conexão com a impressora...`);
  
  // Verificar se o IP da impressora está acessível
  if (PRINTER_IP) {
    console.log(`Verificando conexão com a impressora em ${PRINTER_IP}...`);
    
    exec(`ping -n 1 ${PRINTER_IP}`, (error, stdout) => {
      if (error) {
        console.error(`❌ Não foi possível alcançar a impressora em ${PRINTER_IP}`);
        console.error(`Erro: ${error.message}`);
      } else {
        console.log(`✅ Impressora encontrada em ${PRINTER_IP}`);
        console.log(`Resposta do ping: ${stdout}`);
        
        // Tentar conectar automaticamente se o IP estiver configurado
        if (PRINTER_IP !== '10.205.117.244') { // Só conectar automaticamente se não for o IP padrão
          console.log(`Tentando conectar à impressora em ${PRINTER_IP}...`);
          printerManager.connect(PRINTER_IP).catch(err => {
            console.error('Falha na conexão automática:', err.message);
          });
        }
      }
    });
  } else {
    console.log('Nenhum IP de impressora configurado. Use a interface para configurar.');
  }
});
