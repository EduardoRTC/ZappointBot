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

/**
 * Caminho base para operações de cliente (GET para consulta, POST para criação).
 * Ajuste se seu backend usar outro padrão.
 */
const CLIENT_PATH = 'cliente';

const jsonHeaders = { 'Content-Type': 'application/json' };

/**
 * Normaliza resposta de API que pode vir como array ou objeto.
 */
function normalizeClientResponse(data) {
  if (!data) return null;
  if (Array.isArray(data)) return data[0] || null;
  return data;
}

/**
 * Consulta cliente por CPF usando GET com query string.
 * Retorna `null` se não encontrado.
 */
async function findClientByCPF(cpf) {
  const base = `${apiBaseUrl}/${companyId}`;
  const lookupUrl = `${base}/${CLIENT_PATH}`;

  try {
    const resp = await axios.get(lookupUrl, {
      params: { cpf },
      headers: jsonHeaders
    });
    return normalizeClientResponse(resp.data);
  } catch (e) {
    const status = e.response?.status;
    if (status === 404) {
      return null;
    }
    throw e;
  }
}

/**
 * Cria cliente via POST.
 */
async function createClient({ cpf, nome, telefone }) {
  const base = `${apiBaseUrl}/${companyId}`;
  const createUrl = `${base}/${CLIENT_PATH}`;
  const resp = await axios.post(createUrl, { cpf, nome, telefone }, { headers: jsonHeaders });
  return resp.data;
}

/**
 * Valida e limpa CPF (mantém só dígitos).
 */
function sanitizeCPF(text) {
  if (!text) return '';
  return String(text).replace(/\D/g, '');
}

/**
 * Mensagem padrão de erro (encapsulada para reuso).
 */
async function failAndReset(msg, sessions, text = 'Ocorreu um erro. Tente novamente mais tarde.') {
  await msg.reply(text);
  if (sessions && msg && msg.from) delete sessions[msg.from];
}

module.exports = {
  /**
   * Menu inicial: 1 = já tenho CPF (consulta), 2 = novo cadastro.
   */
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

  /**
   * Fluxo para quem já é cliente: pede CPF e consulta via GET.
   */
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
        // Não encontrou: direciona para fluxo de novo cadastro
        session.step = 'awaitCPF';
        await msg.reply(
          'Não encontrei seu cadastro, vamos realizar um novo.\n' +
          'Primeiro me passe o seu CPF.\n0 - Voltar'
        );
      }
    } catch (e) {
      console.error('[registration.awaitExistingCPF] Error:', e);
      await failAndReset(msg, sessions, 'Erro ao verificar cadastro.');
    }
  },

  /**
   * Fluxo de novo cadastro: pede CPF e vai para nome.
   */
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

  /**
   * Depois do CPF, pede nome e tenta criar cadastro.
   * Se já existir, apenas usa o existente.
   */
  awaitName: async (session, msg, text, sessions) => {
    const back = text === '0' || String(text).toLowerCase() === 'voltar';
    if (back) {
      session.step = 'awaitCPF';
      await msg.reply(askCPFNewText());
      return;
    }

    // Nome completo: junta tudo que vier
    const parts = String(text).trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) {
      await msg.reply('Por favor, informe seu nome. Ex: João da Silva\n0 - Voltar');
      return;
    }
    const fullName = parts.join(' ');

    try {
      // 1) Verifica se já existe
      const existing = await findClientByCPF(session.cpf);

      if (!existing) {
        // 2) Cria se não existir
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
      console.error('[registration.awaitName] Error:', e);
      await failAndReset(msg, sessions, 'Não foi possível realizar o cadastro.');
    }
  }
};
