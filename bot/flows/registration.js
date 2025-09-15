'use strict';

const axios = require('axios');
const { apiBaseUrl, companyId } = require('../config');
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

/** GET /{companyId}/cliente/by-cpf?cpf=... → objeto ou null */
async function findClientByCPF(cpf) {
  const url = joinUrl(apiBaseUrl, companyId, 'cliente', 'by-cpf');
  try {
    // Garante que o CPF enviado esteja apenas com números
    const clean = sanitizeCPF(cpf);
    const resp = await axios.get(url, { params: { cpf: clean } });
    return normalizeClient(resp.data);
  } catch (e) {
    const status = e?.response?.status;
    // Quando o backend retorna 400 ou 404 significa que o CPF não foi localizado
    if (status === 400 || status === 404) return null;
    throw e; // outros códigos de status devem ser tratados pelo chamador
  }
}

/** POST /{companyId}/cliente → cria e retorna o cliente */
async function createClient({ cpf, nome, telefone }) {
  const url = joinUrl(apiBaseUrl, companyId, 'cliente');
  const resp = await axios.post(url, { cpf, nome, telefone }, { headers: JSON_HEADERS });
  return resp.data;
}

async function failAndReset(msg, sessions, text = 'Ocorreu um erro. Tente novamente mais tarde.') {
  await msg.reply(text);
  if (sessions && msg && msg.from) delete sessions[msg.from];
}

module.exports = {
  start: async (session, msg, text) => {
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
    const back = text === '0' || String(text).toLowerCase() === 'voltar';
    if (back) {
      session.step = 'start';
      await msg.reply(startText());
      return;
    }

    const cpf = sanitizeCPF(text);
    if (cpf.length !== 11) {
      await msg.reply('CPF inválido. Envie apenas os números (11 dígitos) ou 0 para voltar.');
      return;
    }

    session.cpf = cpf;

    try {
      const client = await findClientByCPF(session.cpf);
      if (client) {
        session.client = client;
        session.step = 'mainMenu';
        await msg.reply(menuText());
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
    const back = text === '0' || String(text).toLowerCase() === 'voltar';
    if (back) {
      session.step = 'start';
      await msg.reply(startText());
      return;
    }

    const cpf = sanitizeCPF(text);
    if (cpf.length !== 11) {
      await msg.reply('CPF inválido. Envie apenas os números (11 dígitos) ou 0 para voltar.');
      return;
    }

    session.cpf = cpf;
    session.step = 'awaitName';
    await msg.reply(askNameText());
  },

  awaitName: async (session, msg, text, sessions) => {
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

    try {
      const existing = await findClientByCPF(session.cpf);

      if (!existing) {
        const phone = (msg.from || '').split('@')[0] || '';
        const created = await createClient({
          cpf: session.cpf,
          nome: fullName,
          telefone: phone
        });
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
  }
};
