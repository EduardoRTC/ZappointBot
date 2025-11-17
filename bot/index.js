'use strict';
require('dotenv').config();

const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const QRCode = require('qrcode');
const express = require('express');
const cors = require('cors');
const { allowedNumbers } = require('./config');

const {
  start,
  awaitExistingCPF,
  awaitCPF,
  awaitName,
  confirmClient,
  mainMenu,
  confirmExisting,
  cancelExisting,
  service,
  professional,
  date,
  time,
  confirmAppointment
} = require('./flows/conversation');

const { startText } = require('./utils/messages');

const WebSocket = require('ws');

const client = new Client({ authStrategy: new LocalAuth() });

const sessions = {};
const handlers = {
  start,
  awaitExistingCPF,
  awaitCPF,
  awaitName,
  confirmClient,
  mainMenu,
  confirmExisting,
  cancelExisting,
  service,
  professional,
  date,
  time,
  confirmAppointment
};

// Configuração do WebSocket Server (porta 8080)
const wss = new WebSocket.Server({ port: 8080 });

wss.on('connection', (ws) => {
  console.log('Frontend conectado via WebSocket');
  
  // Se já estiver autenticado, notifica imediatamente
  if (isAuthenticated) {
    ws.send(JSON.stringify({ type: 'qr_cleared' }));
  }
  
  ws.on('message', (message) => {
    console.log('Mensagem recebida do frontend:', message.toString());
  });
});

// Função para broadcast de mensagens
function broadcastMessage(data) {
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(data));
    }
  });
}

// Variáveis de estado
let currentQR = null;
let isAuthenticated = false;
let isClientReady = false;

// Configuração do servidor HTTP (porta 3001)
const app = express();

app.use(cors({
  origin: 'http://localhost:3000'
}));

// Endpoint para verificar status de autenticação
app.get('/status', (req, res) => {
  res.json({ 
    authenticated: isAuthenticated,
    qrAvailable: currentQR !== null 
  });
});

// Endpoint para obter QR code
app.get('/qr', (req, res) => {
  if (isAuthenticated) {
    return res.status(404).json({ message: 'Already authenticated' });
  }
  
  if (!currentQR) {
    return res.status(404).json({ message: 'No QR code available' });
  }

  QRCode.toBuffer(currentQR, { type: 'png' }, (err, buffer) => {
    if (err) {
      console.error('Error generating QR buffer:', err);
      return res.status(500).send('Error generating QR code');
    }
    res.type('image/png').send(buffer);
  });
});

app.listen(3001, () => {
  console.log('HTTP server rodando na porta 3001. Endpoint /qr disponível.');
});

// Eventos do WhatsApp
client.on('qr', qr => {
  if (isAuthenticated || isClientReady) {
    console.log('QR recebido mas já está autenticado - ignorando');
    return;
  }
  
  currentQR = qr;
  isAuthenticated = false;
  qrcode.generate(qr, { small: true });
  console.log('QR code gerado!');
  
  // Só notifica se houver clientes conectados
  if (wss.clients.size > 0) {
    broadcastMessage({
      type: 'qr_generated',
      qr: qr
    });
  }
});

client.on('authenticated', () => {
  currentQR = null;
  isAuthenticated = true;
  console.log('Autenticado! QR não mais necessário.');
  
  // Só notifica se já houver clientes conectados
  if (wss.clients.size > 0) {
    broadcastMessage({ type: 'qr_cleared' });
  }
});

client.on('ready', () => {
  if (isClientReady) {
    console.log('Bot ready event duplicado - ignorando');
    return;
  }
  isClientReady = true;
  isAuthenticated = true;
  currentQR = null;
  console.log('Bot is ready!');
});

client.on('disconnected', (reason) => {
  console.log('Client was disconnected:', reason);
  isAuthenticated = false;
  isClientReady = false;
  currentQR = null;
  
  // Não tente reconectar automaticamente em caso de LOGOUT
  if (reason === 'LOGOUT') {
    console.log('Sessão foi deslogada. Reinicie o bot para gerar novo QR code.');
    process.exit(1); // Encerra o processo para evitar loops
  }
});

// Evento de erro de autenticação
client.on('auth_failure', msg => {
  console.error('Falha na autenticação:', msg);
  isAuthenticated = false;
  isClientReady = false;
  currentQR = null;
});

// Evento de carregamento
client.on('loading_screen', (percent, message) => {
  console.log('Carregando...', percent, message);
});

// Evento para mensagens enviadas pelo bot
client.on('message_create', async (msg) => {
  if (msg.fromMe) {
    const sender = msg.to.split('@')[0];
    console.log('[message_create] Bot sent:', { to: msg.to, body: msg.body });

    if (allowedNumbers.includes(sender)) {
      broadcastMessage({
        type: 'bot_message',
        sender: sender,
        to: msg.to,
        body: msg.body,
        timestamp: new Date().toISOString()
      });
    }
  }
});

client.on('message', async msg => {
  try {
    const sender = (msg.author || msg.from).split('@')[0];
    console.log('[message] received:', { from: msg.from, sender, body: msg.body });

    // Ignora grupos
    if (msg.from.endsWith('@g.us')) {
      console.log(`Mensagem de ${sender} enviada de um grupo IGNORADA`);
      return;
    }

    // Whitelist
    if (!allowedNumbers.includes(sender)) {
      console.log(`Mensagem de numero ${sender} IGNORADA - Não é whitelisted`);
      return;
    }
    console.log(`Mensagem de numero ${sender} permitido`);

    // Envia para o frontend
    broadcastMessage({
      type: 'user_message',
      sender: sender,
      from: msg.from,
      body: msg.body,
      timestamp: new Date().toISOString()
    });

    const chatId = msg.from;
    const text = (msg.body || '').trim();
    console.log('[message] chatId:', chatId, 'text:', text);

    // Cria sessão e manda menu inicial
    if (!sessions[chatId]) {
      sessions[chatId] = { step: 'start' };
      console.log('[message] starting new session for', chatId);
      await msg.reply(startText());
      return;
    }

    const session = sessions[chatId];
    console.log('[message] current step:', session.step);
    const handler = handlers[session.step];

    if (handler) {
      await handler(session, msg, text, sessions);
      console.log('[message] next step:', session.step);
    } else {
      console.log('[message] handler not found for step:', session.step);
      await msg.reply('Não entendi. Vamos começar novamente.');
      delete sessions[chatId];
    }
  } catch (err) {
    console.error('[message] error:', err);
    try {
      await msg.reply('Ocorreu um erro ao processar sua solicitação.');
    } catch {}
    delete sessions[msg.from];
  }
});

client.initialize();

// Tratamento de erros não capturados
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

console.log('WebSocket server rodando na porta 8080. Conecte seu frontend em ws://localhost:8080');