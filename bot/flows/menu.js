const axios = require('axios');
const { apiBaseUrl } = require('../config');
const { menuText, serviceText, startText } = require('../utils/messages');

module.exports = {
  mainMenu: async (session, msg, text) => {
    if (text === '0' || text.toLowerCase() === 'voltar') {
      session.step = 'start';
      await msg.reply(startText());
    } else if (text === '1') {
      session.step = 'service';
      await msg.reply(serviceText());
    } else if (text === '2') {
      const resp = await axios.get(`${apiBaseUrl}/clients/${session.client.id}/appointments`, { params: { status: 'pending' } });
      session.appointments = resp.data || [];
      if (session.appointments.length === 0) {
        await msg.reply('Você não possui agendamentos pendentes de confirmação.');
        await msg.reply(menuText());
      } else {
        session.step = 'confirmExisting';
        let textList = 'Qual agendamento deseja confirmar?\n';
        session.appointments.forEach((a, i) => {
          textList += `${i + 1} - ${a.service} com ${a.professionalName} em ${a.date} às ${a.time}\n`;
        });
        textList += '0 - Voltar';
        await msg.reply(textList.trim());
      }
    } else if (text === '3') {
      const resp = await axios.get(`${apiBaseUrl}/clients/${session.client.id}/appointments`, { params: { status: 'scheduled' } });
      session.appointments = resp.data || [];
      if (session.appointments.length === 0) {
        await msg.reply('Você não possui agendamentos para cancelar.');
        await msg.reply(menuText());
      } else {
        session.step = 'cancelExisting';
        let textList = 'Qual agendamento deseja cancelar?\n';
        session.appointments.forEach((a, i) => {
          textList += `${i + 1} - ${a.service} com ${a.professionalName} em ${a.date} às ${a.time}\n`;
        });
        textList += '0 - Voltar';
        await msg.reply(textList.trim());
      }
    } else if (text === '4') {
      const resp = await axios.get(`${apiBaseUrl}/clients/${session.client.id}/appointments`, { params: { status: 'future' } });
      const apps = resp.data || [];
      if (apps.length === 0) {
        await msg.reply('Você não possui agendamentos futuros.');
      } else {
        let list = 'Seus agendamentos:\n';
        apps.forEach(a => {
          list += `- ${a.service} com ${a.professionalName} em ${a.date} às ${a.time}\n`;
        });
        await msg.reply(list.trim());
      }
      await msg.reply(menuText());
    } else {
      await msg.reply('Opção inválida. Escolha uma das opções do menu.');
    }
  },

  confirmExisting: async (session, msg, text) => {
    if (text === '0' || text.toLowerCase() === 'voltar') {
      session.step = 'mainMenu';
      await msg.reply(menuText());
      return;
    }
    const cIdx = parseInt(text) - 1;
    if (isNaN(cIdx) || cIdx < 0 || cIdx >= session.appointments.length) {
      await msg.reply('Opção inválida.');
      return;
    }
    const app = session.appointments[cIdx];
    await axios.patch(`${apiBaseUrl}/appointments/${app.id}/confirm`);
    await msg.reply('Agendamento confirmado com sucesso!');
    session.step = 'mainMenu';
    await msg.reply(menuText());
  },

  cancelExisting: async (session, msg, text) => {
    if (text === '0' || text.toLowerCase() === 'voltar') {
      session.step = 'mainMenu';
      await msg.reply(menuText());
      return;
    }
    const xIdx = parseInt(text) - 1;
    if (isNaN(xIdx) || xIdx < 0 || xIdx >= session.appointments.length) {
      await msg.reply('Opção inválida.');
      return;
    }
    const appToCancel = session.appointments[xIdx];
    await axios.delete(`${apiBaseUrl}/appointments/${appToCancel.id}`);
    await msg.reply('Agendamento cancelado.');
    session.step = 'mainMenu';
    await msg.reply(menuText());
  }
};
