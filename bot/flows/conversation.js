'use strict';

const axios = require('axios');
const { apiBaseUrl, companyId } = require('../config');
const { menuText, startText, askCPFExistingText, askCPFNewText, askNameText } = require('../utils/messages');

const JSON_HEADERS = { 'Content-Type': 'application/json' };

/* ========================================================= 
 * STATUS AGENDAMENTO (ENUM)
 * =======================================================
 * 1 = PENDENTE
 * 2 = FINALIZADO
 * 3 = CANCELADO
 * 
 * Apenas agendamentos com status PENDENTE (1) podem ser cancelados
 * =======================================================*/

/* ========================================================= 
 * UTILS COMPARTILHADAS
 * =======================================================*/

function joinUrl(...parts) {
  return parts
    .map((p, i) => (i === 0 ? String(p).replace(/\/+$/g, '') : String(p).replace(/^\/+|\/+$/g, '')))
    .filter(Boolean)
    .join('/');
}

const companyBaseUrl = joinUrl(apiBaseUrl, companyId);

function sanitizeCPF(text) {
  if (!text) return '';
  return String(text).replace(/\D/g, '');
}

function validateCPF(cpf) {
  const cleanCPF = sanitizeCPF(cpf);
  
  // CPF deve ter 11 dígitos
  if (cleanCPF.length !== 11) {
    return { valid: false, message: '❌ CPF inválido. O CPF deve ter 11 dígitos.' };
  }
  
  // Verifica se todos os dígitos são iguais (ex: 111.111.111-11)
  if (/^(\d)\1{10}$/.test(cleanCPF)) {
    return { valid: false, message: '❌ CPF inválido. Todos os dígitos não podem ser iguais.' };
  }
  
  // Validação do primeiro dígito verificador
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cleanCPF.charAt(i)) * (10 - i);
  }
  let firstDigit = 11 - (sum % 11);
  if (firstDigit >= 10) firstDigit = 0;
  
  if (firstDigit !== parseInt(cleanCPF.charAt(9))) {
    return { valid: false, message: '❌ CPF inválido. Verifique os números digitados.' };
  }
  
  // Validação do segundo dígito verificador
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cleanCPF.charAt(i)) * (11 - i);
  }
  let secondDigit = 11 - (sum % 11);
  if (secondDigit >= 10) secondDigit = 0;
  
  if (secondDigit !== parseInt(cleanCPF.charAt(10))) {
    return { valid: false, message: '❌ CPF inválido. Verifique os números digitados.' };
  }
  
  return { valid: true, cpf: cleanCPF };
}

function isValidInput(text) {
  // Verifica se é texto válido (não emoji, figurinha, etc)
  if (!text || typeof text !== 'string') return false;
  
  const trimmed = text.trim();
  if (trimmed.length === 0) return false;
  
  // Aceita números, letras, espaços e alguns caracteres especiais comuns
  return true; // Por enquanto aceita tudo, mas pode ser mais restritivo
}

function hasValue(value) {
  if (value === undefined || value === null) return false;
  if (typeof value === 'string') return value.trim().length > 0;
  return true;
}

function getProp(obj, ...keys) {
  if (!obj || typeof obj !== 'object') return undefined;
  for (const key of keys) {
    if (!key) continue;
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const direct = obj[key];
      if (hasValue(direct)) return direct;
    }
    const lower = key.toString().toLowerCase();
    for (const existing of Object.keys(obj)) {
      if (existing.toLowerCase() === lower) {
        const value = obj[existing];
        if (hasValue(value)) return value;
      }
    }
  }
  return undefined;
}

function normalizeList(maybeList) {
  if (!maybeList) return [];
  if (Array.isArray(maybeList)) return maybeList;
  
  if (typeof maybeList === 'object') {
    const nested = getProp(maybeList, 'value', 'values', 'data', 'items', 'result');
    if (Array.isArray(nested)) return nested;
  }
  
  return [];
}

function toNumber(value, fallback = undefined) {
  if (value === undefined || value === null || value === '') return fallback;
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
}

async function failAndReset(msg, sessions, text = 'Ocorreu um erro. Tente novamente mais tarde.') {
  try {
    console.log('[failAndReset] message:', text);
    await msg.reply(text);
    if (sessions && msg && msg.from) {
      console.log('[failAndReset] clearing session for', msg.from);
      delete sessions[msg.from];
    }
  } catch (error) {
    console.error('[failAndReset] Erro ao responder:', error);
  }
}

async function safeReply(msg, text) {
  try {
    await msg.reply(text);
  } catch (error) {
    console.error('[safeReply] Erro ao enviar mensagem:', error);
  }
}

function finalizeSession(session, msg, sessions) {
  try {
    if (sessions && msg && msg.from) {
      delete sessions[msg.from];
    }
    return safeReply(msg, 
      '👋 Atendimento finalizado!\n\n' +
      'Quando precisar, é só me chamar novamente. Até logo!'
    );
  } catch (error) {
    console.error('[finalizeSession] Erro ao finalizar:', error);
  }
}

/* ========================================================= 
 * API CALLS - CLIENTE
 * =======================================================*/

async function findClientByCPF(cpf) {
  const cleanCPF = sanitizeCPF(cpf);
  
  // Endpoint correto: GET /{IdEmpresa}/cliente/cpf/{cpf}
  const url = joinUrl(companyBaseUrl, 'cliente', 'cpf', cleanCPF);
  
  console.log('[findClientByCPF] Buscando CPF:', cleanCPF);
  console.log('[findClientByCPF] URL:', url);
  
  try {
    const resp = await axios.get(url);
    console.log('[findClientByCPF] Resposta recebida:', JSON.stringify(resp.data, null, 2));
    
    // Normalizar resposta
    let client = resp.data;
    
    // Se vier dentro de um wrapper
    if (client && typeof client === 'object') {
      if (client.value) client = client.value;
      if (client.data) client = client.data;
      if (Array.isArray(client) && client.length > 0) client = client[0];
    }
    
    return client;
  } catch (error) {
    const status = error?.response?.status;
    console.error('[findClientByCPF] Erro:', {
      status,
      data: error?.response?.data,
      message: error.message
    });
    
    // CPF não encontrado
    if (status === 404 || status === 400) {
      console.log('[findClientByCPF] Cliente não encontrado para CPF:', cleanCPF);
      return null;
    }
    
    throw error;
  }
}

async function createClient({ cpf, nome, telefone }) {
  const url = joinUrl(companyBaseUrl, 'cliente');
  
  const payload = {
    cpf: sanitizeCPF(cpf),
    nome: nome.trim(),
    telefone: sanitizeCPF(telefone),
    email: '', // Opcional
    observacao: '',
    dataNascimento: null
  };
  
  console.log('[createClient] URL:', url);
  console.log('[createClient] Payload:', payload);
  
  try {
    const resp = await axios.post(url, payload, { headers: JSON_HEADERS });
    console.log('[createClient] Cliente criado:', resp.data);
    return resp.data;
  } catch (error) {
    console.error('[createClient] Erro:', {
      status: error?.response?.status,
      data: error?.response?.data,
      message: error.message
    });
    throw error;
  }
}

/* ========================================================= 
 * API CALLS - SERVIÇOS E PROFISSIONAIS
 * =======================================================*/

async function listServices() {
  const url = joinUrl(companyBaseUrl, 'servico');
  console.log('[listServices] URL:', url);
  
  try {
    const resp = await axios.get(url);
    return normalizeList(resp.data);
  } catch (error) {
    console.error('[listServices] Erro:', error?.response?.status, error?.response?.data);
    throw error;
  }
}

async function listProfessionals() {
  const url = joinUrl(companyBaseUrl, 'usuario');
  console.log('[listProfessionals] URL:', url);
  
  try {
    const resp = await axios.get(url);
    return normalizeList(resp.data);
  } catch (error) {
    console.error('[listProfessionals] Erro:', error?.response?.status, error?.response?.data);
    throw error;
  }
}

async function listAppointments() {
  const url = joinUrl(companyBaseUrl, 'agendamento');
  console.log('[listAppointments] URL:', url);
  
  try {
    const resp = await axios.get(url);
    return normalizeList(resp.data);
  } catch (error) {
    console.error('[listAppointments] Erro:', error?.response?.status, error?.response?.data);
    throw error;
  }
}

async function createAppointment(data) {
  const url = joinUrl(companyBaseUrl, 'agendamento');
  console.log('[createAppointment] URL:', url);
  console.log('[createAppointment] Payload:', data);
  
  try {
    const resp = await axios.post(url, data, { headers: JSON_HEADERS });
    console.log('[createAppointment] Agendamento criado:', resp.data);
    return resp.data;
  } catch (error) {
    console.error('[createAppointment] Erro:', error?.response?.status, error?.response?.data);
    throw error;
  }
}

async function updateAppointment(id, data) {
  const url = joinUrl(companyBaseUrl, 'agendamento', String(id));
  console.log('[updateAppointment] URL:', url);
  console.log('[updateAppointment] Payload:', data);
  
  try {
    const resp = await axios.put(url, data, { headers: JSON_HEADERS });
    console.log('[updateAppointment] Agendamento atualizado:', resp.data);
    return resp.data;
  } catch (error) {
    console.error('[updateAppointment] Erro:', error?.response?.status, error?.response?.data);
    throw error;
  }
}

/* ========================================================= 
 * HELPERS - FORMATAÇÃO E VALIDAÇÃO
 * =======================================================*/

function parseChoice(text) {
  const n = parseInt(String(text).trim(), 10);
  return Number.isNaN(n) ? null : n;
}

function toIsoDate(dateStr) {
  const cleaned = String(dateStr).trim();
  const [d, m, y] = cleaned.split('/');
  
  if (!d || !m || !y || y.length !== 4) return null;
  
  const day = String(d).padStart(2, '0');
  const month = String(m).padStart(2, '0');
  
  return `${y}-${month}-${day}`;
}

function getStatusText(statusValue) {
  // Status pode vir como número (enum) ou string
  let statusNum = statusValue;
  
  if (typeof statusValue === 'string') {
    const statusStr = statusValue.toLowerCase().trim();
    if (statusStr === 'pendente') statusNum = 1;
    else if (statusStr === 'finalizado') statusNum = 2;
    else if (statusStr === 'cancelado') statusNum = 3;
  }
  
  statusNum = toNumber(statusNum);
  
  switch (statusNum) {
    case 1: return '⏳ Pendente';
    case 2: return '✅ Finalizado';
    case 3: return '❌ Cancelado';
    default: return '❓ Status desconhecido';
  }
}

function formatAppointmentList(appointments) {
  if (!appointments || appointments.length === 0) {
    return 'Nenhum agendamento encontrado.';
  }
  
  let text = '';
  appointments.forEach((app, index) => {
    const service = getProp(app, 'servico', 'descricao') || 'Atendimento';
    const date = getProp(app, 'dataHoraInicio', 'inicio');
    const professional = getProp(app, 'usuario', 'nomeInteiro', 'nomeUsuario') || '';
    const status = getProp(app, 'statusAgendamento', 'status', 'Status');
    const statusText = getStatusText(status);
    
    let dateStr = '';
    if (date) {
      try {
        const d = new Date(date);
        dateStr = ` - ${d.toLocaleDateString('pt-BR')} às ${d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
      } catch {}
    }
    
    text += `${index + 1} - ${service} com ${professional}${dateStr} - ${statusText}\n`;
  });
  
  return text.trim();
}

function getClientAppointments(allAppointments, clientId) {
  if (!clientId || !Array.isArray(allAppointments)) return [];
  
  const clientIdStr = String(clientId);
  console.log('[getClientAppointments] Buscando agendamentos para cliente:', clientIdStr);
  
  const filtered = allAppointments.filter(app => {
    const appClientId = getProp(app, 'idCliente', 'clienteId', 'IdCliente');
    const appClientIdStr = String(appClientId);
    
    const match = appClientId && appClientIdStr === clientIdStr;
    
    if (match) {
      console.log('[getClientAppointments] Agendamento encontrado:', {
        id: getProp(app, 'id', 'idAgendamento'),
        clientId: appClientIdStr,
        status: getProp(app, 'statusAgendamento', 'status'),
        data: getProp(app, 'dataHoraInicio')
      });
    }
    
    return match;
  });
  
  console.log('[getClientAppointments] Total encontrado:', filtered.length);
  return filtered;
}

function getCancelableAppointments(appointments) {
  const now = new Date();
  
  return appointments.filter(app => {
    const statusRaw = getProp(app, 'statusAgendamento', 'status', 'Status');
    
    // Status pode vir como número (enum) ou string
    let statusValue = statusRaw;
    
    // Se for string, converter para número
    if (typeof statusRaw === 'string') {
      const statusStr = statusRaw.toLowerCase().trim();
      if (statusStr === 'pendente') statusValue = 1;
      else if (statusStr === 'finalizado') statusValue = 2;
      else if (statusStr === 'cancelado') statusValue = 3;
    }
    
    // Converter para número
    const statusNum = toNumber(statusValue);
    
    console.log('[getCancelableAppointments] Agendamento ID:', getProp(app, 'id', 'idAgendamento'), 'Status:', statusNum);
    
    // Apenas status PENDENTE (1) pode ser cancelado
    if (statusNum !== 1) {
      return false;
    }
    
    // Data deve ser futura
    const dateStr = getProp(app, 'dataHoraInicio', 'inicio');
    if (dateStr) {
      try {
        const appDate = new Date(dateStr);
        const isFuture = appDate > now;
        console.log('[getCancelableAppointments] Data:', dateStr, 'É futura?', isFuture);
        return isFuture;
      } catch {
        return false;
      }
    }
    
    return true;
  });
}

function getAvailableTimes(appointments, professionalId, date) {
  const allTimes = [
    '09:00', '10:00', '11:00', '12:00', 
    '13:00', '14:00', '15:00', '16:00', '17:00'
  ];
  
  if (!professionalId || !date) return allTimes;
  
  const datePrefix = `${date}T`;
  const profIdStr = String(professionalId);
  
  const busyTimes = appointments
    .filter(app => {
      const appProfId = getProp(app, 'idUsuario', 'usuarioId', 'IdUsuario');
      const start = getProp(app, 'dataHoraInicio', 'inicio');
      
      return appProfId && String(appProfId) === profIdStr && 
             start && String(start).startsWith(datePrefix);
    })
    .map(app => {
      const start = getProp(app, 'dataHoraInicio', 'inicio');
      const match = String(start).match(/T(\d{2}:\d{2})/);
      return match ? match[1] : null;
    })
    .filter(Boolean);
  
  return allTimes.filter(time => !busyTimes.includes(time));
}

/* ========================================================= 
 * FLUXO 1: CADASTRO E IDENTIFICAÇÃO
 * =======================================================*/

async function start(session, msg, text) {
  try {
    console.log('[start] Opção escolhida:', text);
    
    if (text === '1') {
      session.step = 'awaitExistingCPF';
      await safeReply(msg, askCPFExistingText());
    } else if (text === '2') {
      session.step = 'awaitCPF';
      await safeReply(msg, askCPFNewText());
    } else {
      await safeReply(msg, '❌ Opção inválida. Responda com *1* ou *2*.');
    }
  } catch (error) {
    console.error('[start] Erro:', error);
    await safeReply(msg, '❌ Ocorreu um erro. Tente novamente.');
  }
}

async function awaitExistingCPF(session, msg, text, sessions) {
  try {
    console.log('[awaitExistingCPF] CPF recebido:', text);
    
    // Validar entrada
    if (!isValidInput(text)) {
      await safeReply(msg, '❌ Mensagem inválida. Por favor, envie apenas o CPF em números.\n\n_Digite *0* para voltar._');
      return;
    }
    
    // Voltar
    if (text === '0' || String(text).toLowerCase() === 'voltar') {
      session.step = 'start';
      await safeReply(msg, startText());
      return;
    }
    
    // Validar CPF
    const validation = validateCPF(text);
    if (!validation.valid) {
      await safeReply(msg, `${validation.message}\n\n_Digite *0* para voltar._`);
      return;
    }
    
    const cpf = validation.cpf;
    session.cpf = cpf;
    
    console.log('[awaitExistingCPF] CPF validado:', cpf);
    
    const client = await findClientByCPF(cpf);
    
    if (client) {
      // Cliente encontrado
      session.client = client;
      session.tempClient = client;
      session.step = 'confirmClient';
      
      const clientName = getProp(client, 'nome', 'nomeInteiro', 'nomeCompleto') || 'cliente';
      
      await safeReply(msg,
        `✅ Olá *${clientName}*! Encontramos seu cadastro.\n\n` +
        `*1* - Sim, sou eu\n` +
        `*0* - Voltar`
      );
    } else {
      // Cliente não encontrado
      session.step = 'awaitCPF';
      await safeReply(msg,
        '📋 Não encontrei seu cadastro. Vamos fazer um novo!\n\n' +
        'Por favor, confirme seu CPF (apenas números):\n\n' +
        '_Digite *0* para voltar._'
      );
    }
  } catch (error) {
    console.error('[awaitExistingCPF] Erro ao buscar cliente:', error);
    await failAndReset(msg, sessions, '❌ Erro ao verificar cadastro. Tente novamente.');
  }
}

async function awaitCPF(session, msg, text) {
  try {
    console.log('[awaitCPF] CPF recebido:', text);
    
    // Validar entrada
    if (!isValidInput(text)) {
      await safeReply(msg, '❌ Mensagem inválida. Por favor, envie apenas o CPF em números.\n\n_Digite *0* para voltar._');
      return;
    }
    
    // Voltar
    if (text === '0' || String(text).toLowerCase() === 'voltar') {
      session.step = 'start';
      await safeReply(msg, startText());
      return;
    }
    
    // Validar CPF
    const validation = validateCPF(text);
    if (!validation.valid) {
      await safeReply(msg, `${validation.message}\n\n_Digite *0* para voltar._`);
      return;
    }
    
    const cpf = validation.cpf;
    session.cpf = cpf;
    session.step = 'awaitName';
    
    console.log('[awaitCPF] CPF validado:', cpf);
    
    await safeReply(msg, askNameText());
  } catch (error) {
    console.error('[awaitCPF] Erro:', error);
    await safeReply(msg, '❌ Ocorreu um erro. Tente novamente.');
  }
}

async function awaitName(session, msg, text, sessions) {
  try {
    console.log('[awaitName] Nome recebido:', text);
    
    // Validar entrada
    if (!isValidInput(text)) {
      await safeReply(msg, '❌ Mensagem inválida. Por favor, envie seu nome.\n\n_Digite *0* para voltar._');
      return;
    }
    
    // Voltar
    if (text === '0' || String(text).toLowerCase() === 'voltar') {
      session.step = 'awaitCPF';
      await safeReply(msg, askCPFNewText());
      return;
    }
    
    // Validar nome
    const parts = String(text).trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) {
      await safeReply(msg, '❌ Por favor, informe seu nome completo.\n\n_Digite *0* para voltar._');
      return;
    }
    
    if (parts.length === 1) {
      await safeReply(msg, '❌ Por favor, informe seu nome e sobrenome.\n\n_Digite *0* para voltar._');
      return;
    }
    
    const fullName = parts.join(' ');
    
    // Verificar se já existe (por segurança)
    const existing = await findClientByCPF(session.cpf);
    
    if (existing) {
      session.client = existing;
      console.log('[awaitName] Cliente já existia:', existing);
    } else {
      // Criar novo cliente
      const phone = (msg.from || '').split('@')[0] || '';
      
      const created = await createClient({
        cpf: session.cpf,
        nome: fullName,
        telefone: phone
      });
      
      session.client = created;
      console.log('[awaitName] Novo cliente criado:', created);
    }
    
    session.step = 'mainMenu';
    await safeReply(msg,
      '✅ Cadastro realizado com sucesso!\n\n' + 
      menuText()
    );
  } catch (error) {
    console.error('[awaitName] Erro ao criar cliente:', error);
    
    const status = error?.response?.status;
    
    if (status === 409) {
      await safeReply(msg, '❌ Já existe um cadastro com este CPF.');
    } else if (status === 400) {
      await safeReply(msg, '❌ Dados inválidos. Verifique as informações.');
    } else {
      await safeReply(msg, '❌ Não foi possível realizar o cadastro. Tente novamente.');
    }
    
    if (sessions && msg.from) {
      delete sessions[msg.from];
    }
  }
}

async function confirmClient(session, msg, text) {
  try {
    console.log('[confirmClient] Resposta:', text);
    
    // Validar entrada
    if (!isValidInput(text)) {
      await safeReply(msg, '❌ Mensagem inválida. Responda *1* para confirmar ou *0* para voltar.');
      return;
    }
    
    // Voltar
    if (text === '0' || String(text).toLowerCase() === 'voltar') {
      session.step = 'start';
      delete session.tempClient;
      await safeReply(msg, startText());
      return;
    }
    
    if (text === '1') {
      session.client = session.tempClient;
      delete session.tempClient;
      session.step = 'mainMenu';
      await safeReply(msg, '✅ Bem-vindo(a)!\n\n' + menuText());
    } else {
      await safeReply(msg, '❌ Opção inválida. Responda *1* para confirmar ou *0* para voltar.');
    }
  } catch (error) {
    console.error('[confirmClient] Erro:', error);
    await safeReply(msg, '❌ Ocorreu um erro. Tente novamente.');
  }
}

/* ========================================================= 
 * FLUXO 2: MENU PRINCIPAL
 * =======================================================*/

async function mainMenu(session, msg, text, sessions) {
  try {
    console.log('[mainMenu] Opção:', text);
    
    // Validar entrada
    if (!isValidInput(text)) {
      await safeReply(msg, '❌ Mensagem inválida. Escolha uma opção do menu:\n\n' + menuText());
      return;
    }
    
    // Voltar/Finalizar atendimento
    if (text === '0' || text.toLowerCase() === 'voltar' || text.toLowerCase() === 'sair') {
      return await finalizeSession(session, msg, sessions);
    }
    
    // 1 - Novo agendamento
    if (text === '1') {
      const services = await listServices();
      session.services = services;
      
      if (services.length === 0) {
        await safeReply(msg, '❌ Nenhum serviço disponível no momento.');
        await safeReply(msg, menuText());
        return;
      }
      
      session.step = 'service';
      const lines = services.map((s, i) => {
        const name = getProp(s, 'descricao', 'nome') || `Serviço ${i + 1}`;
        return `*${i + 1}* - ${name}`;
      });
      
      await safeReply(msg,
        `📋 Qual serviço você deseja agendar?\n\n${lines.join('\n')}\n\n*0* - Voltar`
      );
      return;
    }
    
    // 2 - Cancelar agendamento
    if (text === '2') {
      const clientId = getProp(session.client, 'id', 'idCliente', 'IdCliente');
      
      console.log('[mainMenu] Cliente ID para busca:', clientId);
      
      if (!clientId) {
        await safeReply(msg, '❌ Erro ao identificar seu cadastro.');
        await safeReply(msg, menuText());
        return;
      }
      
      const allAppointments = await listAppointments();
      console.log('[mainMenu] Total de agendamentos:', allAppointments.length);
      
      const clientAppointments = getClientAppointments(allAppointments, clientId);
      console.log('[mainMenu] Agendamentos do cliente:', clientAppointments.length);
      
      const cancelable = getCancelableAppointments(clientAppointments);
      console.log('[mainMenu] Agendamentos canceláveis:', cancelable.length);
      
      if (cancelable.length === 0) {
        await safeReply(msg, '📅 Você não possui agendamentos que podem ser cancelados.\n\n_Apenas agendamentos com status PENDENTE podem ser cancelados._');
        await safeReply(msg, menuText());
        return;
      }
      
      session.appointments = cancelable;
      session.step = 'cancelExisting';
      
      const list = formatAppointmentList(cancelable);
      await safeReply(msg,
        `🗑️ Qual agendamento deseja cancelar?\n\n${list}\n\n*0* - Voltar`
      );
      return;
    }
    
    // 3 - Ver meus agendamentos
    if (text === '3') {
      const clientId = getProp(session.client, 'id', 'idCliente', 'IdCliente');
      
      console.log('[mainMenu] Cliente ID para listagem:', clientId);
      
      if (!clientId) {
        await safeReply(msg, '❌ Erro ao identificar seu cadastro.');
        await safeReply(msg, menuText());
        return;
      }
      
      const allAppointments = await listAppointments();
      const clientAppointments = getClientAppointments(allAppointments, clientId);
      
      // Ordenar por data (mais recentes primeiro)
      clientAppointments.sort((a, b) => {
        const dateA = new Date(getProp(a, 'dataHoraInicio', 'inicio') || 0);
        const dateB = new Date(getProp(b, 'dataHoraInicio', 'inicio') || 0);
        return dateB - dateA; // Ordem decrescente
      });
      
      if (clientAppointments.length === 0) {
        await safeReply(msg, '📅 Você não possui agendamentos.');
      } else {
        const list = formatAppointmentList(clientAppointments);
        await safeReply(msg, `📅 *Seus agendamentos:*\n\n${list}`);
      }
      
      await safeReply(msg, menuText());
      return;
    }
    
    await safeReply(msg, '❌ Opção inválida. Escolha uma das opções do menu:\n\n' + menuText());
  } catch (error) {
    console.error('[mainMenu] Erro:', error);
    await safeReply(msg, '❌ Ocorreu um erro. Tente novamente.\n\n' + menuText());
  }
}

/* ========================================================= 
 * FLUXO 3: CANCELAMENTO
 * =======================================================*/

async function cancelExisting(session, msg, text) {
  console.log('[cancelExisting] Opção:', text);
  
  // Voltar
  if (text === '0' || text.toLowerCase() === 'voltar') {
    session.step = 'mainMenu';
    await msg.reply(menuText());
    return;
  }
  
  const index = parseInt(text, 10) - 1;
  
  if (Number.isNaN(index) || index < 0 || !session.appointments || index >= session.appointments.length) {
    await msg.reply('❌ Opção inválida. Escolha um número da lista.');
    return;
  }
  
  const appointment = session.appointments[index];
  const appointmentId = getProp(appointment, 'id', 'idAgendamento', 'IdAgendamento');
  
  console.log('[cancelExisting] Agendamento selecionado:', appointmentId);
  console.log('[cancelExisting] Dados completos:', JSON.stringify(appointment, null, 2));
  
  if (!appointmentId) {
    await msg.reply('❌ Erro ao identificar o agendamento.');
    session.step = 'mainMenu';
    await msg.reply(menuText());
    return;
  }
  
  try {
    // Buscar IDs dos serviços - pode vir de várias formas
    let serviceIds = [];
    
    // Tentar pegar de idServico direto
    const directServiceId = getProp(appointment, 'idServico', 'servicoId', 'IdServico');
    if (directServiceId) {
      if (Array.isArray(directServiceId)) {
        serviceIds = directServiceId;
      } else {
        serviceIds = [directServiceId];
      }
    }
    
    // Se não achou, tentar de agendamentoServico
    if (serviceIds.length === 0) {
      const agendamentoServico = getProp(appointment, 'agendamentoServico', 'AgendamentoServico');
      if (Array.isArray(agendamentoServico) && agendamentoServico.length > 0) {
        serviceIds = agendamentoServico
          .map(item => getProp(item, 'idServico', 'servicoId', 'IdServico'))
          .filter(Boolean);
      }
    }
    
    // Se ainda não achou, usar um ID padrão temporário
    if (serviceIds.length === 0) {
      console.warn('[cancelExisting] Nenhum serviço encontrado, usando ID padrão');
      serviceIds = [1]; // ID temporário - ajuste conforme necessário
    }
    
    console.log('[cancelExisting] Service IDs:', serviceIds);
    
    // Montar payload de atualização
    const payload = {
      idCliente: toNumber(getProp(appointment, 'idCliente', 'clienteId', 'IdCliente')),
      idUsuario: toNumber(getProp(appointment, 'idUsuario', 'usuarioId', 'IdUsuario')),
      idServico: serviceIds.map(id => toNumber(id)),
      dataHoraInicio: getProp(appointment, 'dataHoraInicio', 'inicio'),
      dataHoraFim: getProp(appointment, 'dataHoraFim', 'fim'),
      valorTotal: toNumber(getProp(appointment, 'valorTotal'), 0),
      statusAgendamento: 3, // CANCELADO (enum)
      observacao: getProp(appointment, 'observacao') || 'Cancelado via WhatsApp'
    };
    
    console.log('[cancelExisting] Payload para cancelamento:', JSON.stringify(payload, null, 2));
    
    await updateAppointment(appointmentId, payload);
    await msg.reply('✅ Agendamento cancelado com sucesso!');
  } catch (error) {
    console.error('[cancelExisting] Erro ao cancelar:', error);
    console.error('[cancelExisting] Resposta da API:', error?.response?.data);
    await msg.reply('❌ Não foi possível cancelar o agendamento. Tente novamente.');
  }
  
  session.step = 'mainMenu';
  await msg.reply(menuText());
}

/* ========================================================= 
 * FLUXO 4: NOVO AGENDAMENTO
 * =======================================================*/

async function service(session, msg, text) {
  console.log('[service] Opção:', text);
  
  // Voltar
  if (text === '0' || text.toLowerCase() === 'voltar') {
    session.step = 'mainMenu';
    await msg.reply(menuText());
    return;
  }
  
  const services = session.services || [];
  const choice = parseChoice(text);
  const idx = choice !== null ? choice - 1 : -1;
  
  if (idx < 0 || idx >= services.length) {
    await msg.reply('❌ Opção inválida. Escolha um número da lista.');
    return;
  }
  
  session.service = services[idx];
  
  try {
    const professionals = await listProfessionals();
    session.professionals = professionals;
    
    if (professionals.length === 0) {
      await msg.reply('❌ Nenhum profissional disponível no momento.');
      session.step = 'mainMenu';
      await msg.reply(menuText());
      return;
    }
    
    session.step = 'professional';
    const lines = professionals.map((p, i) => {
      const name = getProp(p, 'nomeInteiro', 'nome', 'nomeUsuario') || `Profissional ${i + 1}`;
      return `*${i + 1}* - ${name}`;
    });
    
    await msg.reply(
      `👤 Com qual profissional você deseja agendar?\n\n${lines.join('\n')}\n\n*0* - Voltar`
    );
  } catch (error) {
    console.error('[service] Erro ao carregar profissionais:', error);
    await msg.reply('❌ Não consegui carregar os profissionais. Tente novamente.');
    session.step = 'mainMenu';
    await msg.reply(menuText());
  }
}

async function professional(session, msg, text) {
  console.log('[professional] Opção:', text);
  
  // Voltar
  if (text === '0' || text.toLowerCase() === 'voltar') {
    session.step = 'service';
    
    const services = session.services || [];
    const lines = services.map((s, i) => {
      const name = getProp(s, 'descricao', 'nome') || `Serviço ${i + 1}`;
      return `*${i + 1}* - ${name}`;
    });
    
    await msg.reply(
      `📋 Qual serviço você deseja agendar?\n\n${lines.join('\n')}\n\n*0* - Voltar`
    );
    return;
  }
  
  const professionals = session.professionals || [];
  const choice = parseChoice(text);
  const idx = choice !== null ? choice - 1 : -1;
  
  if (idx < 0 || idx >= professionals.length) {
    await msg.reply('❌ Opção inválida. Escolha um número da lista.');
    return;
  }
  
  session.professional = professionals[idx];
  session.step = 'date';
  
  await msg.reply(
    '📅 Qual o melhor dia para você?\n\n' +
    'Digite a data no formato: *DD/MM/AAAA*\n' +
    'Exemplo: 15/12/2025\n\n' +
    '_Digite *0* para voltar._'
  );
}

async function date(session, msg, text) {
  console.log('[date] Data recebida:', text);
  
  // Voltar
  if (text === '0' || text.toLowerCase() === 'voltar') {
    session.step = 'professional';
    
    const professionals = session.professionals || [];
    const lines = professionals.map((p, i) => {
      const name = getProp(p, 'nomeInteiro', 'nome', 'nomeUsuario') || `Profissional ${i + 1}`;
      return `*${i + 1}* - ${name}`;
    });
    
    await msg.reply(
      `👤 Com qual profissional você deseja agendar?\n\n${lines.join('\n')}\n\n*0* - Voltar`
    );
    return;
  }
  
  // Validar data
  const isoDate = toIsoDate(text);
  if (!isoDate) {
    await msg.reply('❌ Data inválida. Use o formato *DD/MM/AAAA*.\n\n_Digite *0* para voltar._');
    return;
  }
  
  // Verificar se não é data passada
  try {
    const selectedDate = new Date(isoDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (selectedDate < today) {
      await msg.reply('❌ Não é possível agendar em datas passadas.\n\n_Digite *0* para voltar._');
      return;
    }
  } catch {}
  
  session.date = text;
  session.isoDate = isoDate;
  
  try {
    const allAppointments = await listAppointments();
    const professionalId = getProp(session.professional, 'id', 'idUsuario', 'IdUsuario');
    
    const availableTimes = getAvailableTimes(allAppointments, professionalId, isoDate);
    
    if (availableTimes.length === 0) {
      await msg.reply('❌ Não há horários disponíveis para este dia. Escolha outra data.');
      return;
    }
    
    session.times = availableTimes;
    session.step = 'time';
    
    const lines = availableTimes.map((t, i) => `*${i + 1}* - ${t}`);
    
    await msg.reply(
      `🕐 Horários disponíveis para ${text}:\n\n${lines.join('\n')}\n\n*0* - Voltar`
    );
  } catch (error) {
    console.error('[date] Erro ao buscar horários:', error);
    await msg.reply('❌ Não consegui carregar os horários disponíveis.');
    session.step = 'mainMenu';
    await msg.reply(menuText());
  }
}

async function time(session, msg, text) {
  console.log('[time] Opção:', text);
  
  // Voltar
  if (text === '0' || text.toLowerCase() === 'voltar') {
    session.step = 'date';
    await msg.reply(
      '📅 Qual o melhor dia para você?\n\n' +
      'Digite a data no formato: *DD/MM/AAAA*\n' +
      'Exemplo: 15/12/2025\n\n' +
      '_Digite *0* para voltar._'
    );
    return;
  }
  
  const times = session.times || [];
  const choice = parseChoice(text);
  const idx = choice !== null ? choice - 1 : -1;
  
  if (idx < 0 || idx >= times.length) {
    await msg.reply('❌ Opção inválida. Escolha um número da lista.');
    return;
  }
  
  session.time = times[idx];
  session.step = 'confirmAppointment';
  
  const serviceName = getProp(session.service, 'descricao', 'nome') || 'Serviço';
  const professionalName = getProp(session.professional, 'nomeInteiro', 'nome', 'nomeUsuario') || 'Profissional';
  
  await msg.reply(
    '✅ *Confirme seu agendamento:*\n\n' +
    `📋 Serviço: ${serviceName}\n` +
    `👤 Profissional: ${professionalName}\n` +
    `📅 Data: ${session.date}\n` +
    `🕐 Horário: ${session.time}\n\n` +
    '*1* - Confirmar\n' +
    '*2* - Cancelar e voltar ao menu\n' +
    '*0* - Voltar'
  );
}

async function confirmAppointment(session, msg, text) {
  console.log('[confirmAppointment] Resposta:', text);
  
  // Voltar
  if (text === '0' || text.toLowerCase() === 'voltar') {
    session.step = 'time';
    
    const times = session.times || [];
    const lines = times.map((t, i) => `*${i + 1}* - ${t}`);
    
    await msg.reply(
      `🕐 Horários disponíveis:\n\n${lines.join('\n')}\n\n*0* - Voltar`
    );
    return;
  }
  
  // Cancelar
  if (text === '2') {
    session.step = 'mainMenu';
    await msg.reply('❌ Agendamento cancelado.\n\n' + menuText());
    return;
  }
  
  // Confirmar
  if (text === '1') {
    const clientId = getProp(session.client, 'id', 'idCliente', 'IdCliente');
    const professionalId = getProp(session.professional, 'id', 'idUsuario', 'IdUsuario');
    const serviceId = getProp(session.service, 'id', 'idServico', 'IdServico');
    
    if (!clientId || !professionalId || !serviceId) {
      console.error('[confirmAppointment] Dados incompletos:', { clientId, professionalId, serviceId });
      await msg.reply('❌ Erro ao processar o agendamento. Dados incompletos.');
      session.step = 'mainMenu';
      await msg.reply(menuText());
      return;
    }
    
    try {
      const dataHoraInicio = `${session.isoDate}T${session.time}:00`;
      
      const payload = {
        idCliente: clientId,
        idUsuario: professionalId,
        idServico: [serviceId],
        dataHoraInicio: dataHoraInicio,
        observacao: 'Agendamento via WhatsApp'
      };
      
      await createAppointment(payload);
      
      await msg.reply('✅ *Agendamento confirmado com sucesso!*');
      session.step = 'mainMenu';
      await msg.reply(menuText());
    } catch (error) {
      console.error('[confirmAppointment] Erro ao criar agendamento:', error);
      await msg.reply('❌ Não foi possível confirmar o agendamento. Tente novamente.');
      session.step = 'mainMenu';
      await msg.reply(menuText());
    }
    return;
  }
  
  await msg.reply('❌ Opção inválida. Responda *1* para confirmar, *2* para cancelar ou *0* para voltar.');
}

/* ========================================================= 
 * EXPORTS
 * =======================================================*/

module.exports = {
  start,
  awaitExistingCPF,
  awaitCPF,
  awaitName,
  confirmClient,
  mainMenu,
  cancelExisting,
  service,
  professional,
  date,
  time,
  confirmAppointment,
  finalizeSession,
  safeReply
};