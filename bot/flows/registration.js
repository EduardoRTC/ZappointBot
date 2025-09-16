'use strict';

const axios = require('axios');
const { apiBaseUrl, companyId, cpfTenantId } = require('../config');
const {
  menuText,
  startText,
  askCPFExistingText,
  askCPFNewText,
  askNameText
} = require('../utils/messages');

const JSON_HEADERS = { 'Content-Type': 'application/json' };

function joinUrl(...parts) {
  return parts
    .map((p, i) => (i === 0 ? String(p).replace(/\/+$/g, '') : String(p).replace(/^\/+|\/+$/g, '')))
    .filter(Boolean)
    .join('/');
}

function sanitizeCPF(text) {
  if (!text) return '';
  return String(text).replace(/\D/g, '');
}

function normalizeClient(data) {
  if (!data) return null;
  if (Array.isArray(data)) return data[0] || null;
  if (typeof data === 'object' && 'value' in data) {
    const v = data.value;
    if (Array.isArray(v)) return v[0] || null;
    return v;
  }
  return data;
}

/** GET /{cpfTenantId}/cliente/by-cpf?cpf=... → objeto ou null */
async function findClientByCPF(cpf) {
  const url = joinUrl(apiBaseUrl, cpfTenantId, 'cliente', 'by-cpf');
  const clean = sanitizeCPF(cpf);
  console.log('[findClientByCPF] url:', url, 'tenant:', cpfTenantId, 'cpf:', clean);
  try {
    // Garante que o CPF enviado esteja apenas com números
    const resp = await axios.get(url, { params: { cpf: clean } });
    const normalized = normalizeClient(resp.data);
    console.log('[findClientByCPF] response:', normalized);
    return normalized;
  } catch (e) {
    const status = e?.response?.status;
    console.error('[findClientByCPF] error:', status, e?.response?.data || e);
    // Quando o backend retorna 400 ou 404 significa que o CPF não foi localizado
    if (status === 400 || status === 404) {
      console.log('[findClientByCPF] CPF não encontrado:', clean);
      return null;
    }
    throw e; // outros códigos de status devem ser tratados pelo chamador
  }
}

/** POST /{companyId}/cliente → cria e retorna o cliente */
async function createClient({ cpf, nome, telefone }) {
  const url = joinUrl(apiBaseUrl, companyId, 'cliente');
  console.log('[createClient] url:', url, 'payload:', { cpf, nome, telefone });
  const resp = await axios.post(url, { cpf, nome, telefone }, { headers: JSON_HEADERS });
  console.log('[createClient] response:', resp.data);
  return resp.data;
}

async function failAndReset(msg, sessions, text = 'Ocorreu um erro. Tente novamente mais tarde.') {
  console.log('[failAndReset] message:', text);
  await msg.reply(text);
  if (sessions && msg && msg.from) {
    console.log('[failAndReset] clearing session for', msg.from);
    delete sessions[msg.from];
  }
}

module.exports = {
  start: async (session, msg, text) => {
    console.log('[registration.start] option:', text);
    if (text === '1') {
      session.step = 'awaitExistingCPF';
      await msg.reply(askCPFExistingText());
    } else if (text === '2') {
      session.step = 'awaitCPF';
      await msg.reply(askCPFNewText());
    } else {
      await msg.reply('Opção inválida. Responda com 1 ou 2.');
    }
  },

  awaitExistingCPF: async (session, msg, text, sessions) => {
    console.log('[registration.awaitExistingCPF] text:', text);
    const back = text === '0' || String(text).toLowerCase() === 'voltar';
    if (back) {
      session.step = 'start';
      await msg.reply(startText());
      return;
    }

    const cpf = sanitizeCPF(text);
    console.log('[registration.awaitExistingCPF] sanitized CPF:', cpf);
    if (cpf.length !== 11) {
      await msg.reply('CPF inválido. Envie apenas os números (11 dígitos) ou 0 para voltar.');
      return;
    }

    session.cpf = cpf;

    try {
      console.log('[registration.awaitExistingCPF] searching client by CPF');
      const client = await findClientByCPF(session.cpf);
      console.log('[registration.awaitExistingCPF] result:', client);
      if (client) {
        session.tempClient = client;
        session.step = 'confirmClient';
        await msg.reply(`Encontramos seu cadastro: ${client.nome}.\n1 - Sim, sou eu\n0 - Voltar`);
      } else {
        session.step = 'awaitCPF';
        await msg.reply(
          'Não encontrei seu cadastro, vamos realizar um novo.\n' +
          'Primeiro me passe o seu CPF.\n0 - Voltar'
        );
      }
    } catch (e) {
      console.error('[registration.awaitExistingCPF] Error:', e?.response?.status, e?.response?.data || e);
      if (e?.response?.status === 404) {
        await failAndReset(msg, sessions, 'Empresa não encontrada. Verifique o companyId no backend.');
        return;
      }
      await failAndReset(msg, sessions, 'Erro ao verificar cadastro.');
    }
  },

  awaitCPF: async (session, msg, text) => {
    console.log('[registration.awaitCPF] text:', text);
    const back = text === '0' || String(text).toLowerCase() === 'voltar';
    if (back) {
      session.step = 'start';
      await msg.reply(startText());
      return;
    }

    const cpf = sanitizeCPF(text);
    console.log('[registration.awaitCPF] sanitized CPF:', cpf);
    if (cpf.length !== 11) {
      await msg.reply('CPF inválido. Envie apenas os números (11 dígitos) ou 0 para voltar.');
      return;
    }

    session.cpf = cpf;
    session.step = 'awaitName';
    await msg.reply(askNameText());
  },

  awaitName: async (session, msg, text, sessions) => {
    console.log('[registration.awaitName] text:', text);
    const back = text === '0' || String(text).toLowerCase() === 'voltar';
    if (back) {
      session.step = 'awaitCPF';
      await msg.reply(askCPFNewText());
      return;
    }

    const parts = String(text).trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) {
      await msg.reply('Por favor, informe seu nome. Ex: João da Silva\n0 - Voltar');
      return;
    }
    const fullName = parts.join(' ');
    console.log('[registration.awaitName] fullName:', fullName);

    try {
      console.log('[registration.awaitName] checking existing client for CPF', session.cpf);
      const existing = await findClientByCPF(session.cpf);
      console.log('[registration.awaitName] existing:', existing);

      if (!existing) {
        const phone = (msg.from || '').split('@')[0] || '';
        console.log('[registration.awaitName] creating client with phone', phone);
        const created = await createClient({
          cpf: session.cpf,
          nome: fullName,
          telefone: phone
        });
        console.log('[registration.awaitName] created:', created);
        session.client = created;
      } else {
        session.client = existing;
      }

      session.step = 'mainMenu';
      await msg.reply('Ok, pré-cadastro realizado com sucesso!\n' + menuText());
    } catch (e) {
      console.error('[registration.awaitName] Error:', e?.response?.status, e?.response?.data || e);
      if (e?.response?.status === 404) {
        await msg.reply('Empresa/rota não encontrada. Confirme o companyId e a rota no backend.');
      } else if (e?.response?.status === 409) {
        await msg.reply('Cadastro já existente para este CPF.');
      } else if (e?.response?.status === 400) {
        await msg.reply('Dados inválidos para criação do cliente.');
      } else if (e?.response?.status === 405) {
        await msg.reply('Método não permitido na rota. (GET by-cpf para consultar, POST /cliente para criar).');
      } else {
        await msg.reply('Não foi possível realizar o cadastro.');
      }
      delete sessions[msg.from];
    }
  },

  confirmClient: async (session, msg, text) => {
    console.log('[registration.confirmClient] text:', text);
    const back = text === '0' || String(text).toLowerCase() === 'voltar';
    if (back) {
      session.step = 'start';
      delete session.tempClient;
      await msg.reply(startText());
      return;
    }

    if (text === '1') {
      console.log('[registration.confirmClient] client confirmed');
      session.client = session.tempClient;
      delete session.tempClient;
      session.step = 'mainMenu';
      await msg.reply(menuText());
    } else {
      console.log('[registration.confirmClient] invalid option:', text);
      await msg.reply('Opção inválida. Responda 1 para confirmar ou 0 para voltar.');
    }
  }
};
