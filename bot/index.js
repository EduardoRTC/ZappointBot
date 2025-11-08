'use strict';
require('dotenv').config();

const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const QRCode = require('qrcode'); // Para gerar buffer de imagem
const express = require('express'); // Adicione: npm install express
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

const WebSocket = require('ws'); // Adicione esta dependência: npm install ws

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

// Configuração do WebSocket Server (porta 8080, por exemplo)
const wss = new WebSocket.Server({ port: 8080 });

wss.on('connection', (ws) => {
  console.log('Frontend conectado via WebSocket');
  ws.on('message', (message) => {
    console.log('Mensagem recebida do frontend:', message.toString());
  });
});

// Função para broadcast de mensagens para todos os clients conectados
function broadcastMessage(data) {
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(data));
    }
  });
}

// Variável para armazenar o QR code atual
let currentQR = null;

// Configuração do servidor HTTP com Express (porta 3000)
const app = express();

app.get('/qr', (req, res) => {
  if (!currentQR) {
    return res.status(404).send('No QR code available');
  }

  QRCode.toBuffer(currentQR, { type: 'png' }, (err, buffer) => {
    if (err) {
      console.error('Error generating QR buffer:', err);
      return res.status(500).send('Error generating QR code');
    }
    res.type('image/png').send(buffer);
  });
});

app.listen(3000, () => {
  console.log('HTTP server rodando na porta 3000. Endpoint /qr disponível.');
});

client.on('qr', qr => {
  currentQR = qr;
  qrcode.generate(qr, { small: true });
  console.log('QR code gerado!');
  // Notifica o frontend via WebSocket que o QR está disponível
  broadcastMessage({
    type: 'qr_generated',
    qr: qr // Opcional, mas pode ser usado se precisar
  });
});

client.on('authenticated', () => {
  currentQR = null;
  console.log('Autenticado! QR não mais necessário.');
  // Notifica o frontend para remover o QR
  broadcastMessage({ type: 'qr_cleared' });
});

client.on('ready', () => {
  console.log('Bot is ready!');
});

// Evento para mensagens enviadas pelo bot
client.on('message_create', async (msg) => {
  if (msg.fromMe) { // Verifica se a mensagem foi enviada pelo bot
    const sender = msg.to.split('@')[0]; // Destinatário como "sender" para consistência
    console.log('[message_create] Bot sent:', { to: msg.to, body: msg.body });

    // Whitelist check (assumindo que só envia para whitelisted)
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

    // Whitelist simples
    if (!allowedNumbers.includes(sender)) {
      console.log(`Mensagem de numero ${sender} IGNORADA Não é whitelisted`);
      return;
    }
    console.log(`Mensagem de numero ${sender} permitido`);

    // Envia informação do número whitelisted e mensagem para o frontend via WebSocket
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

console.log('WebSocket server rodando na porta 8080. Conecte seu frontend em ws://localhost:8080');