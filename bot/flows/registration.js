const axios = require('axios');
const { apiBaseUrl } = require('../config');
const { menuText } = require('../utils/messages');

module.exports = {
  start: async (session, msg, text) => {
    if (text === '1') {
      session.step = 'awaitExistingCPF';
      await msg.reply('Certo, me informe seu CPF.');
    } else if (text === '2') {
      session.step = 'awaitCPF';
      await msg.reply('Então vamos realizar o seu cadastro!\nSerá bem rápido.\nPrimeiro me passe o seu CPF.');
    } else {
      await msg.reply('Opção inválida. Responda com 1 ou 2.');
    }
  },

  awaitExistingCPF: async (session, msg, text, sessions) => {
    session.cpf = text.replace(/\D/g, '');
    try {
      const resp = await axios.get(`${apiBaseUrl}/clients?cpf=${session.cpf}`);
      if (resp.data && resp.data.length > 0) {
        session.client = resp.data[0];
        session.step = 'mainMenu';
        await msg.reply(menuText());
      } else {
        session.step = 'awaitCPF';
        await msg.reply('Não encontrei seu cadastro, vamos realizar um novo.\nPrimeiro me passe o seu CPF.');
      }
    } catch (e) {
      console.error(e);
      await msg.reply('Erro ao verificar cadastro.');
      delete sessions[msg.from];
    }
  },

  awaitCPF: async (session, msg, text) => {
    session.cpf = text.replace(/\D/g, '');
    session.step = 'awaitName';
    await msg.reply('Certo!! Agora preciso do seu primeiro e último nome.');
  },

  awaitName: async (session, msg, text, sessions) => {
    const [firstName, ...rest] = text.split(' ');
    const lastName = rest.join(' ');
    try {
      const existing = await axios.get(`${apiBaseUrl}/clients?cpf=${session.cpf}`);
      if (!existing.data || existing.data.length === 0) {
        const created = await axios.post(`${apiBaseUrl}/clients`, { cpf: session.cpf, firstName, lastName });
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
