const axios = require('axios');
const { apiBaseUrl, companyId } = require('../config');
const {
  menuText,
  startText,
  askCPFExistingText,
  askCPFNewText,
  askNameText
} = require('../utils/messages');

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
    if (text === '0' || text.toLowerCase() === 'voltar') {
      session.step = 'start';
      await msg.reply(startText());
      return;
    }
    session.cpf = text.replace(/\D/g, '');
    try {
      const resp = await axios.post(
        `${apiBaseUrl}/${companyId}/cliente/buscar`,
        { cpf: session.cpf }
      );
      if (resp.data && resp.data.length > 0) {
        session.client = resp.data[0];
        session.step = 'mainMenu';
        await msg.reply(menuText());
      } else {
        session.step = 'awaitCPF';
        await msg.reply('Não encontrei seu cadastro, vamos realizar um novo.\nPrimeiro me passe o seu CPF.\n0 - Voltar');
      }
    } catch (e) {
      console.error(e);
      await msg.reply('Erro ao verificar cadastro.');
      delete sessions[msg.from];
    }
  },

  awaitCPF: async (session, msg, text) => {
    if (text === '0' || text.toLowerCase() === 'voltar') {
      session.step = 'start';
      await msg.reply(startText());
      return;
    }
    session.cpf = text.replace(/\D/g, '');
    session.step = 'awaitName';
    await msg.reply(askNameText());
  },

  awaitName: async (session, msg, text, sessions) => {
    if (text === '0' || text.toLowerCase() === 'voltar') {
      session.step = 'awaitCPF';
      await msg.reply(askCPFNewText());
      return;
    }
    const [firstName, ...rest] = text.split(' ');
    const lastName = rest.join(' ');
    try {
      const existing = await axios.post(
        `${apiBaseUrl}/${companyId}/cliente/buscar`,
        { cpf: session.cpf }
      );
      if (!existing.data || existing.data.length === 0) {
        const phone = msg.from.split('@')[0];
        const created = await axios.post(`${apiBaseUrl}/${companyId}/cliente`, {
          cpf: session.cpf,
          nome: `${firstName} ${lastName}`,
          telefone: phone
        });
        session.client = created.data;
      } else {
        session.client = existing.data[0];
      }
      session.step = 'mainMenu';
      await msg.reply('Ok, pré-cadastro realizado com sucesso!\n' + menuText());
    } catch (e) {
      console.error(e);
      await msg.reply('Não foi possível realizar o cadastro.');
      delete sessions[msg.from];
    }
  }
};
