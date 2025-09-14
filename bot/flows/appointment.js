const axios = require('axios');
const { apiBaseUrl, companyId } = require('../config');
const { menuText } = require('../utils/messages');

function toIsoDate(dateStr) {
  const [day, month, year] = dateStr.split('/');
  return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
}

async function listServices(session, msg) {
  const resp = await axios.get(`${apiBaseUrl}/${companyId}/servico`);
  session.services = resp.data || [];
  if (session.services.length === 0) {
    await msg.reply('Nenhum serviço disponível.');
    session.step = 'mainMenu';
    await msg.reply(menuText());
    return;
  }
  let text = 'Qual serviço gostaria de agendar?\n';
  session.services.forEach((s, i) => { text += `${i + 1} - ${s.descricao}\n`; });
  text += '0 - Voltar';
  await msg.reply(text.trim());
}

module.exports = {
  listServices,
  service: async (session, msg, text) => {
    if (text === '0' || text.toLowerCase() === 'voltar') {
      session.step = 'mainMenu';
      await msg.reply(menuText());
      return;
    }
    const idx = parseInt(text) - 1;
    if (isNaN(idx) || idx < 0 || idx >= session.services.length) {
      await msg.reply('Opção inválida.');
      return;
    }
    session.service = session.services[idx];
    const profResp = await axios.get(`${apiBaseUrl}/${companyId}/usuario`);
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
      profText += `${i + 1} - ${p.nomeInteiro}\n`;
    });
    profText += '0 - Voltar';
    await msg.reply(profText.trim());
  },

  professional: async (session, msg, text) => {
    if (text === '0' || text.toLowerCase() === 'voltar') {
      session.step = 'service';
      await listServices(session, msg);
      return;
    }
    const idx = parseInt(text) - 1;
    if (isNaN(idx) || idx < 0 || idx >= session.professionals.length) {
      await msg.reply('Opção inválida.');
      return;
    }
    session.professional = session.professionals[idx];
    session.step = 'date';
    await msg.reply('Qual o melhor dia para você? (DD/MM/AAAA)\n0 - Voltar');
  },

  date: async (session, msg, text) => {
    if (text === '0' || text.toLowerCase() === 'voltar') {
      session.step = 'professional';
      let profText = 'Com qual profissional?\n';
      session.professionals.forEach((p, i) => { profText += `${i + 1} - ${p.nomeInteiro}\n`; });
      profText += '0 - Voltar';
      await msg.reply(profText.trim());
      return;
    }
    session.date = text;
    const resp = await axios.get(`${apiBaseUrl}/${companyId}/agendamento`);
    const appointments = resp.data || [];
    const day = toIsoDate(session.date);
    const busy = appointments.filter(a => a.idUsuario === session.professional.id && a.dataHoraInicio.startsWith(day));
    const allTimes = ['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00'];
    session.times = allTimes.filter(t => !busy.some(b => b.dataHoraInicio.includes(t)));
    if (session.times.length === 0) {
      await msg.reply('Nenhum horário disponível.');
      session.step = 'mainMenu';
      await msg.reply(menuText());
      return;
    }
    session.step = 'time';
    let timeText = 'De acordo com os horários disponíveis, escolha um abaixo:\n';
    session.times.forEach((t, i) => { timeText += `${i + 1} - ${t}\n`; });
    timeText += '0 - Voltar';
    await msg.reply(timeText.trim());
  },

  time: async (session, msg, text) => {
    if (text === '0' || text.toLowerCase() === 'voltar') {
      session.step = 'date';
      await msg.reply('Qual o melhor dia para você? (DD/MM/AAAA)\n0 - Voltar');
      return;
    }
    const tIdx = parseInt(text) - 1;
    if (isNaN(tIdx) || tIdx < 0 || tIdx >= session.times.length) {
      await msg.reply('Opção inválida.');
      return;
    }
    session.time = session.times[tIdx];
    session.step = 'confirmAppointment';
    await msg.reply(`Certo, agora confirme o agendamento:\n${session.service.descricao} com o profissional ${session.professional.nomeInteiro}, no dia ${session.date} às ${session.time}.\n\n1 - Confirmar\n2 - Cancelar e iniciar novamente\n0 - Voltar`);
  },

  confirmAppointment: async (session, msg, text) => {
    if (text === '0' || text.toLowerCase() === 'voltar') {
      session.step = 'time';
      let timeText = 'De acordo com os horários disponíveis, escolha um abaixo:\n';
      session.times.forEach((t, i) => { timeText += `${i + 1} - ${t}\n`; });
      timeText += '0 - Voltar';
      await msg.reply(timeText.trim());
      return;
    }
    if (text === '1') {
      const dateISO = toIsoDate(session.date);
      await axios.post(`${apiBaseUrl}/${companyId}/agendamento`, {
        idCliente: session.client.id,
        idUsuario: session.professional.id,
        idServico: [session.service.id],
        dataHoraInicio: `${dateISO}T${session.time}:00`
      });
      await msg.reply('Agendamento confirmado com sucesso! ✔');
      session.step = 'mainMenu';
      await msg.reply(menuText());
    } else if (text === '2') {
      session.step = 'service';
      await listServices(session, msg);
    } else {
      await msg.reply('Opção inválida.');
    }
  }
};
