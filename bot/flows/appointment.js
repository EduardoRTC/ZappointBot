const axios = require('axios');
const { apiBaseUrl } = require('../config');
const { menuText, serviceText } = require('../utils/messages');

module.exports = {
  service: async (session, msg, text) => {
    const services = { '1': 'Cabelo', '2': 'Barba', '3': 'Cabelo e Barba' };
    if (!services[text]) {
      await msg.reply('Opção inválida.');
      return;
    }
    session.service = services[text];
    const profResp = await axios.get(`${apiBaseUrl}/professionals`);
    session.professionals = profResp.data || [];
    if (session.professionals.length === 0) {
      await msg.reply('Nenhum profissional disponível.');
      session.step = 'mainMenu';
      await msg.reply(menuText());
      return;
    }
    session.step = 'professional';
    let profText = 'Com qual profissional?\n';
    session.professionals.forEach((p, i) => {
      profText += `${i + 1} - ${p.name}\n`;
    });
    await msg.reply(profText.trim());
  },

  professional: async (session, msg, text) => {
    const idx = parseInt(text) - 1;
    if (isNaN(idx) || idx < 0 || idx >= session.professionals.length) {
      await msg.reply('Opção inválida.');
      return;
    }
    session.professional = session.professionals[idx];
    const dateResp = await axios.get(`${apiBaseUrl}/professionals/${session.professional.id}/available-dates`);
    session.dates = dateResp.data || [];
    if (session.dates.length === 0) {
      await msg.reply('Nenhuma data disponível.');
      session.step = 'mainMenu';
      await msg.reply(menuText());
      return;
    }
    session.step = 'date';
    let dateText = 'Qual o melhor dia para você?\n';
    session.dates.forEach((d, i) => { dateText += `${i + 1} - ${d}\n`; });
    await msg.reply(dateText.trim());
  },

  date: async (session, msg, text) => {
    const dIdx = parseInt(text) - 1;
    if (isNaN(dIdx) || dIdx < 0 || dIdx >= session.dates.length) {
      await msg.reply('Opção inválida.');
      return;
    }
    session.date = session.dates[dIdx];
    const timeResp = await axios.get(`${apiBaseUrl}/professionals/${session.professional.id}/available-times`, { params: { date: session.date } });
    session.times = timeResp.data || [];
    if (session.times.length === 0) {
      await msg.reply('Nenhum horário disponível.');
      session.step = 'mainMenu';
      await msg.reply(menuText());
      return;
    }
    session.step = 'time';
    let timeText = 'De acordo com os horários disponíveis, escolha um abaixo:\n';
    session.times.forEach((t, i) => { timeText += `${i + 1} - ${t}\n`; });
    await msg.reply(timeText.trim());
  },

  time: async (session, msg, text) => {
    const tIdx = parseInt(text) - 1;
    if (isNaN(tIdx) || tIdx < 0 || tIdx >= session.times.length) {
      await msg.reply('Opção inválida.');
      return;
    }
    session.time = session.times[tIdx];
    session.step = 'confirmAppointment';
    await msg.reply(`Certo, agora confirme o agendamento:\n${session.service} com o profissional ${session.professional.name}, no dia ${session.date} às ${session.time}.\n\n1 - Confirmar\n2 - Cancelar e iniciar novamente`);
  },

  confirmAppointment: async (session, msg, text) => {
    if (text === '1') {
      await axios.post(`${apiBaseUrl}/appointments`, {
        clientId: session.client.id,
        professionalId: session.professional.id,
        service: session.service,
        date: session.date,
        time: session.time
      });
      await msg.reply('Agendamento confirmado com sucesso! ✔');
      session.step = 'mainMenu';
      await msg.reply(menuText());
    } else if (text === '2') {
      session.step = 'service';
      await msg.reply(serviceText());
    } else {
      await msg.reply('Opção inválida.');
    }
  }
};
