'use strict';
require('dotenv').config();

const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const QRCode = require('qrcode');
const express = require('express');
const cors = require('cors');
const { allowedNumbers } = require('./config');
const WebSocket = require('ws');
const fs = require('fs');
const path = require('path');

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
  confirmAppointment,
  listAppointmentsByClientCPF
} = require('./flows/conversation');

const { startText } = require('./utils/messages');
const axios = require('axios');
const { apiBaseUrl, companyId } = require('./config');

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

// Caminhos das pastas de sessão do wwebjs
const AUTH_DIR = path.join(__dirname, '.wwebjs_auth');
const CACHE_DIR = path.join(__dirname, '.wwebjs_cache');

// ======================= Histórico de conversa =======================
/**
 * Estrutura de cada item:
 * {
 *   type: 'user_message' | 'bot_message',
 *   sender?: string,
 *   from?: string,
 *   to?: string,
 *   body: string,
 *   timestamp: string
 * }
 */
const conversationHistory = [];
const MAX_HISTORY = 500; // limita pra não crescer infinito

function addToHistory(entry) {
  conversationHistory.push(entry);
  if (conversationHistory.length > MAX_HISTORY) {
    conversationHistory.shift(); // remove o mais antigo
  }
}

// ======================= WebSocket Server (8080) =======================
const wss = new WebSocket.Server({ port: 8080 });

wss.on('connection', (ws) => {
  console.log('Frontend conectado via WebSocket');
  
  // Se já estiver autenticado, notifica imediatamente
  if (isAuthenticated) {
    ws.send(JSON.stringify({ type: 'qr_cleared' }));
  }

  // Envia histórico da conversa pro cliente recém-conectado
  if (conversationHistory.length > 0) {
    ws.send(JSON.stringify({
      type: 'history',
      messages: conversationHistory
    }));
  }
  
  ws.on('message', (message) => {
    console.log('Mensagem recebida do frontend:', message.toString());
  });
});

// Função para broadcast de mensagens
function broadcastMessage(data) {
  wss.clients.forEach((clientWs) => {
    if (clientWs.readyState === WebSocket.OPEN) {
      clientWs.send(JSON.stringify(data));
    }
  });
}

// Variáveis de estado
let currentQR = null;
let isAuthenticated = false;
let isClientReady = false;

// ======================= Servidor HTTP (3001) =======================
const app = express();

// CORS liberado pra qualquer origem (dev)
app.use(cors());
app.use(express.json());

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

// Endpoint para resetar sessão e deletar .wwebjs_auth / .wwebjs_cache
app.post('/reset-session', async (req, res) => {
  console.log('Requisição para /reset-session recebida');

  try {
    // 1) Tenta deslogar
    try {
      await client.logout();
      console.log('Logout do cliente WhatsApp realizado.');
    } catch (err) {
      console.warn(
        'Falha ao tentar logout (pode não estar autenticado):',
        err?.message || err
      );
    }

    // 2) Destroi o client atual (fecha Puppeteer / sessão antiga)
    try {
      await client.destroy();
      console.log('Client WhatsApp destruído.');
    } catch (err) {
      console.warn(
        'Falha ao destruir client (talvez já destruído):',
        err?.message || err
      );
    }

    // 3) Zera estados internos
    isAuthenticated = false;
    isClientReady = false;
    currentQR = null;

    // 4) Apaga as pastas de sessão
    const dirs = [AUTH_DIR, CACHE_DIR];

    for (const dir of dirs) {
      try {
        await fs.promises.rm(dir, { recursive: true, force: true });
        console.log(`Diretório removido (ou não existia): ${dir}`);
      } catch (err) {
        console.error(`Erro ao remover diretório ${dir}:`, err);
      }
    }

    // 5) Re-inicializa o client – isso vai disparar um novo "qr" depois
    client.initialize();
    console.log('Client WhatsApp re-inicializado após reset-session.');

    // 6) Notifica front (caso queira reagir a isso)
    broadcastMessage({ type: 'qr_generated' });

    return res.json({
      ok: true,
      message:
        'Sessão resetada. Pastas removidas e client reinicializado. Um novo QR será gerado em instantes.'
    });
  } catch (err) {
    console.error('Erro ao resetar sessão:', err);
    return res.status(500).json({
      ok: false,
      error: 'Falha ao resetar sessão do bot.'
    });
  }
});

// ======================= ENDPOINT DE LEMBRETE =======================

app.post('/send-reminder', async (req, res) => {
  try {
    console.log('[send-reminder] Requisição recebida:', req.body);

    if (!isClientReady || !isAuthenticated) {
      return res.status(503).json({
        ok: false,
        error: 'Bot não está conectado ao WhatsApp. Escaneie o QR code primeiro.'
      });
    }

    const { cpf } = req.body;

    if (!cpf) {
      return res.status(400).json({
        ok: false,
        error: 'CPF é obrigatório'
      });
    }

    console.log('[send-reminder] Buscando agendamentos para CPF:', cpf);
    
    let appointments;
    try {
      appointments = await listAppointmentsByClientCPF(cpf);
    } catch (error) {
      console.error('[send-reminder] Erro ao buscar agendamentos:', error);
      return res.status(500).json({
        ok: false,
        error: 'Erro ao buscar agendamentos do cliente',
        details: error.message
      });
    }

    if (!appointments || appointments.length === 0) {
      return res.status(404).json({
        ok: false,
        error: 'Nenhum agendamento encontrado para este CPF.'
      });
    }

    console.log('[send-reminder] Total de agendamentos encontrados:', appointments.length);

    const now = new Date();
    const activeAppointments = appointments.filter(app => {
      const statusRaw = app.statusAgendamento || app.status || app.Status;
      
      let statusNum = statusRaw;
      if (typeof statusRaw === 'string') {
        const statusStr = statusRaw.toLowerCase().trim();
        if (statusStr === 'pendente') statusNum = 1;
        else if (statusStr === 'finalizado') statusNum = 2;
        else if (statusStr === 'cancelado') statusNum = 3;
      }
      
      const isPending = Number(statusNum) === 1;
      const dateStr = app.dataHoraInicio || app.inicio;
      const isFuture = dateStr ? new Date(dateStr) > now : false;
      
      return isPending && isFuture;
    });

    if (activeAppointments.length === 0) {
      return res.status(404).json({
        ok: false,
        error: 'Nenhum agendamento pendente e futuro encontrado para este CPF.'
      });
    }

    console.log('[send-reminder] Agendamentos ativos:', activeAppointments.length);

    activeAppointments.sort((a, b) => {
      const dateA = new Date(a.dataHoraInicio || a.inicio || 0);
      const dateB = new Date(b.dataHoraInicio || b.inicio || 0);
      return dateA - dateB;
    });

    const appointment = activeAppointments[0];
    console.log('[send-reminder] Agendamento selecionado:', appointment.id || appointment.idAgendamento);

    // ==================== Extrai dados do cliente ====================
    const clientData = appointment.cliente || {};
    const clientName = clientData.nome || clientData.nomeInteiro || clientData.nomeCompleto || 'Cliente';
    let clientPhone = clientData.telefone || appointment.telefone;

    if (!clientPhone) {
      return res.status(400).json({
        ok: false,
        error: 'Telefone do cliente não encontrado no cadastro.'
      });
    }

    clientPhone = String(clientPhone).replace(/\D/g, '');

    let targetPhone = clientPhone;
    if (!targetPhone.startsWith('55')) {
      targetPhone = `55${targetPhone}`;
    }
    if (!targetPhone.includes('@')) {
      targetPhone = `${targetPhone}@c.us`;
    }

    // ==================== Extrai nome do serviço de agendamentoServico ====================
    let serviceName = 'Atendimento';
    
    if (appointment.agendamentoServico && Array.isArray(appointment.agendamentoServico) && appointment.agendamentoServico.length > 0) {
      const firstService = appointment.agendamentoServico[0];
      if (firstService.servico && firstService.servico.descricao) {
        serviceName = firstService.servico.descricao;
      }
    }

    console.log('[send-reminder] Serviço identificado:', serviceName);

    // ==================== Busca dados do profissional via API ====================
    const professionalId = appointment.idUsuario;
    let professionalName = 'Nossa equipe';

    if (professionalId) {
      try {
        console.log('[send-reminder] Buscando dados do profissional ID:', professionalId);
        const professionalUrl = `${apiBaseUrl}/${companyId}/usuario/${professionalId}`;
        const professionalResponse = await axios.get(professionalUrl);
        const professionalData = professionalResponse.data;

        if (professionalData && professionalData.nomeInteiro) {
          professionalName = professionalData.nomeInteiro;
          console.log('[send-reminder] Nome do profissional:', professionalName);
        } else if (professionalData && professionalData.nomeUsuario) {
          professionalName = professionalData.nomeUsuario;
          console.log('[send-reminder] Nome do profissional (fallback):', professionalName);
        }
      } catch (professionalError) {
        console.error('[send-reminder] Erro ao buscar profissional:', professionalError.message);
        // Continua com o nome padrão se falhar
      }
    }

    const dateStr = appointment.dataHoraInicio || appointment.inicio;
    let formattedDate = '';
    let formattedTime = '';

    if (dateStr) {
      try {
        const d = new Date(dateStr);
        formattedDate = d.toLocaleDateString('pt-BR', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric'
        });
        formattedTime = d.toLocaleTimeString('pt-BR', { 
          hour: '2-digit', 
          minute: '2-digit' 
        });
      } catch (err) {
        console.error('[send-reminder] Erro ao formatar data:', err);
        formattedDate = 'Data não disponível';
        formattedTime = 'Horário não disponível';
      }
    }

    const message = 
      `🔔 *Lembrete de Agendamento*\n\n` +
      `Olá, *${clientName}*!\n\n` +
      `📋 Não se esqueça do seu agendamento:\n\n` +
      `*Serviço:* ${serviceName}\n` +
      `*Profissional:* ${professionalName}\n` +
      `*Data:* ${formattedDate}\n` +
      `*Horário:* ${formattedTime}\n\n` +
      `✨ Te esperamos!\n\n` +
      `_Para cancelar ou reagendar, entre em contato conosco._`;

    console.log('[send-reminder] Mensagem preparada para:', targetPhone);

    try {
      const numberId = await client.getNumberId(targetPhone);

      if (!numberId) {
        return res.status(404).json({
          ok: false,
          error: `Número ${targetPhone} não encontrado no WhatsApp.`
        });
      }

      console.log('[send-reminder] Número verificado:', numberId._serialized);

      await client.sendMessage(numberId._serialized, message);

      console.log('[send-reminder] ✅ Mensagem enviada com sucesso!');

      const historyPayload = {
        type: 'bot_message',
        sender: targetPhone.split('@')[0],
        to: numberId._serialized,
        body: message,
        timestamp: new Date().toISOString()
      };

      addToHistory(historyPayload);
      broadcastMessage(historyPayload);

      return res.json({
        ok: true,
        message: 'Lembrete enviado com sucesso!',
        sentTo: numberId._serialized,
        appointment: {
          id: appointment.id || appointment.idAgendamento,
          clientName: clientName,
          serviceName: serviceName,
          professionalName: professionalName,
          date: formattedDate,
          time: formattedTime
        }
      });

    } catch (sendError) {
      console.error('[send-reminder] Erro ao enviar mensagem:', sendError);
      return res.status(500).json({
        ok: false,
        error: 'Erro ao enviar mensagem via WhatsApp.',
        details: sendError.message
      });
    }

  } catch (error) {
    console.error('[send-reminder] ERRO GERAL:', error);
    return res.status(500).json({
      ok: false,
      error: 'Erro ao processar lembrete.',
      details: error.message
    });
  }
});

// ======================= ENDPOINT PREVIEW =======================

app.get('/appointment-active/:cpf', async (req, res) => {
  try {
    const { cpf } = req.params;

    if (!cpf) {
      return res.status(400).json({
        ok: false,
        error: 'CPF é obrigatório'
      });
    }

    const appointments = await listAppointmentsByClientCPF(cpf);

    if (!appointments || appointments.length === 0) {
      return res.status(404).json({
        ok: false,
        error: 'Nenhum agendamento encontrado'
      });
    }

    const now = new Date();
    const active = appointments.filter(app => {
      const statusRaw = app.statusAgendamento || app.status || app.Status;
      let statusNum = statusRaw;
      
      if (typeof statusRaw === 'string') {
        const statusStr = statusRaw.toLowerCase().trim();
        if (statusStr === 'pendente') statusNum = 1;
        else if (statusStr === 'finalizado') statusNum = 2;
        else if (statusStr === 'cancelado') statusNum = 3;
      }
      
      const isPending = Number(statusNum) === 1;
      const dateStr = app.dataHoraInicio || app.inicio;
      const isFuture = dateStr ? new Date(dateStr) > now : false;
      
      return isPending && isFuture;
    });

    if (active.length === 0) {
      return res.status(404).json({
        ok: false,
        error: 'Nenhum agendamento ativo encontrado'
      });
    }

    active.sort((a, b) => {
      const dateA = new Date(a.dataHoraInicio || a.inicio || 0);
      const dateB = new Date(b.dataHoraInicio || b.inicio || 0);
      return dateA - dateB;
    });

    const previewAppointment = active[0];

    // ==================== Extrai dados do serviço ====================
    let serviceName = 'Atendimento';
    if (previewAppointment.agendamentoServico && Array.isArray(previewAppointment.agendamentoServico) && previewAppointment.agendamentoServico.length > 0) {
      const firstService = previewAppointment.agendamentoServico[0];
      if (firstService.servico && firstService.servico.descricao) {
        serviceName = firstService.servico.descricao;
      }
    }

    // ==================== Busca dados do profissional ====================
    let professionalName = 'Profissional';
    const professionalId = previewAppointment.idUsuario;

    if (professionalId) {
      try {
        const professionalUrl = `${apiBaseUrl}/${companyId}/usuario/${professionalId}`;
        const professionalResponse = await axios.get(professionalUrl);
        const professionalData = professionalResponse.data;

        if (professionalData && professionalData.nomeInteiro) {
          professionalName = professionalData.nomeInteiro;
        } else if (professionalData && professionalData.nomeUsuario) {
          professionalName = professionalData.nomeUsuario;
        }
      } catch (professionalError) {
        console.error('[appointment-active] Erro ao buscar profissional:', professionalError.message);
      }
    }

    return res.json({
      ok: true,
      appointment: {
        ...previewAppointment,
        servico: { descricao: serviceName },
        usuario: { nomeInteiro: professionalName }
      }
    });

  } catch (error) {
    console.error('[appointment-active] ERRO:', error);
    return res.status(500).json({
      ok: false,
      error: 'Erro ao buscar agendamento',
      details: error.message
    });
  }
});

app.listen(3001, () => {
  console.log('HTTP server rodando na porta 3001. Endpoints: /status, /qr, /reset-session, /send-reminder, /appointment-active disponíveis.');
});

// ======================= Eventos do WhatsApp =======================
client.on('qr', qr => {
  if (isAuthenticated || isClientReady) {
    console.log('QR recebido mas já está autenticado - ignorando');
    return;
  }
  
  currentQR = qr;
  isAuthenticated = false;
  qrcode.generate(qr, { small: true });
  console.log('QR code gerado!');
  
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
  
  if (reason === 'LOGOUT') {
    console.log('Sessão foi deslogada. Reinicie o bot para gerar novo QR code.');
    process.exit(1);
  }
});

client.on('auth_failure', msg => {
  console.error('Falha na autenticação:', msg);
  isAuthenticated = false;
  isClientReady = false;
  currentQR = null;
});

client.on('loading_screen', (percent, message) => {
  console.log('Carregando...', percent, message);
});

client.on('message_create', async (msg) => {
  if (msg.fromMe) {
    const sender = msg.to.split('@')[0];
    console.log('[message_create] Bot sent:', { to: msg.to, body: msg.body });

    if (allowedNumbers.includes(sender)) {
      const payload = {
        type: 'bot_message',
        sender: sender,
        to: msg.to,
        body: msg.body,
        timestamp: new Date().toISOString()
      };

      addToHistory(payload);
      broadcastMessage(payload);
    }
  }
});

client.on('message', async msg => {
  try {
    const sender = (msg.author || msg.from).split('@')[0];
    console.log('[message] received:', { from: msg.from, sender, body: msg.body });

    if (msg.from.endsWith('@g.us')) {
      console.log(`Mensagem de ${sender} enviada de um grupo IGNORADA`);
      return;
    }

    if (!allowedNumbers.includes(sender)) {
      console.log(`Mensagem de numero ${sender} IGNORADA - Não é whitelisted`);
      return;
    }
    console.log(`Mensagem de numero ${sender} permitido`);

    const payload = {
      type: 'user_message',
      sender: sender,
      from: msg.from,
      body: msg.body,
      timestamp: new Date().toISOString()
    };

    addToHistory(payload);
    broadcastMessage(payload);

    const chatId = msg.from;
    const text = (msg.body || '').trim();
    console.log('[message] chatId:', chatId, 'text:', text);

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
  const msg = reason && reason.message ? String(reason.message) : String(reason);

  // Ignora erros de protocolo do Puppeteer após logout/destroy
  if (msg.includes('Protocol error (Runtime.callFunctionOn)') ||
      msg.includes('Session closed. Most likely the page has been closed.')) {
    console.warn('⚠️ Erro de protocolo do Puppeteer após logout (ignorado):', msg);
    return;
  }

  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

console.log('WebSocket server rodando na porta 8080. Conecte seu frontend em ws://localhost:8080');