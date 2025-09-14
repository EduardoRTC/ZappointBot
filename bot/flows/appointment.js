'use strict';

const axios = require('axios');
const { apiBaseUrl, companyId } = require('../config');
const { menuText } = require('../utils/messages');

/* ======================= Utils ======================= */

function joinUrl(...parts) {
  return parts
    .map((p, i) => (i === 0 ? String(p).replace(/\/+$/g, '') : String(p).replace(/^\/+|\/+$/g, '')))
    .filter(Boolean)
    .join('/');
}

const baseUrl = joinUrl(apiBaseUrl, companyId);

function toIsoDate(dateStr) {
  // aceita "DD/MM/AAAA" ou "D/M/AAAA"
  const [d, m, y] = String(dateStr).trim().split('/');
  if (!d || !m || !y) return null;
  const day = String(d).padStart(2, '0');
  const mon = String(m).padStart(2, '0');
  // validação simples
  if (y.length !== 4) return null;
  return `${y}-${mon}-${day}`;
}

function normalizeList(maybeList) {
  if (typeof maybeList === 'string') {
    try { maybeList = JSON.parse(maybeList); } catch { return []; }
  }
  if (Array.isArray(maybeList)) return maybeList;
  if (maybeList && typeof maybeList === 'object') {
    if ('value' in maybeList) return normalizeList(maybeList.value);
    if ('data' in maybeList) return normalizeList(maybeList.data);
    return Object.values(maybeList);
  }
  return [];
}

function parseChoice(text) {
  const n = parseInt(String(text).trim(), 10);
  return Number.isNaN(n) ? null : n;
}

/* ======================= API helpers ======================= */

async function apiGet(path, opts = {}) {
  const url = joinUrl(baseUrl, path);
  const resp = await axios.get(url, opts);
  return resp.data;
}

async function apiPost(path, body, opts = {}) {
  const url = joinUrl(baseUrl, path);
  const resp = await axios.post(url, body, { headers: { 'Content-Type': 'application/json' }, ...opts });
  return resp.data;
}

/* ======================= Flow steps ======================= */

async function listServices(session, msg) {
  try {
    const data = await apiGet('servico');
    const services = normalizeList(data);
    session.services = services;

    if (services.length === 0) {
      await msg.reply('Nenhum serviço disponível.');
      session.step = 'mainMenu';
      await msg.reply(menuText());
      return;
    }

    const lines = services.map((s, i) => `${i + 1} - ${s.descricao ?? s.nome ?? `Serviço ${i + 1}`}`);
    await msg.reply(`Qual serviço gostaria de agendar?\n${lines.join('\n')}\n0 - Voltar`.trim());
  } catch (err) {
    console.error('[appointment.listServices] API error:', err?.response?.status, err?.response?.data || err.message);
    await msg.reply('Não consegui carregar os serviços agora. Tente novamente mais tarde.');
    session.step = 'mainMenu';
    await msg.reply(menuText());
  }
}

module.exports = {
  listServices,

  service: async (session, msg, text) => {
    // voltar
    if (text === '0' || String(text).toLowerCase() === 'voltar') {
      session.step = 'mainMenu';
      await msg.reply(menuText());
      return;
    }

    const services = normalizeList(session.services);
    if (services.length === 0) {
      await msg.reply('Lista de serviços vazia. Carregando novamente...');
      return listServices(session, msg);
    }

    const choice = parseChoice(text);
    const idx = choice !== null ? choice - 1 : -1;
    if (idx < 0 || idx >= services.length) {
      await msg.reply('Opção inválida. Escolha um número da lista.');
      return;
    }

    session.service = services[idx];

    try {
      const data = await apiGet('usuario');
      const professionals = normalizeList(data);
      session.professionals = professionals;

      if (professionals.length === 0) {
        await msg.reply('Nenhum profissional disponível.');
        session.step = 'mainMenu';
        await msg.reply(menuText());
        return;
      }

      session.step = 'professional';
      const lines = professionals.map((p, i) => `${i + 1} - ${p.nomeInteiro ?? p.nome ?? `Profissional ${i + 1}`}`);
      await msg.reply(`Com qual profissional?\n${lines.join('\n')}\n0 - Voltar`.trim());
    } catch (err) {
      console.error('[appointment.service->professionals] API error:', err?.response?.status, err?.response?.data || err.message);
      await msg.reply('Não consegui carregar os profissionais agora.');
      session.step = 'mainMenu';
      await msg.reply(menuText());
    }
  },

  professional: async (session, msg, text) => {
    // voltar
    if (text === '0' || String(text).toLowerCase() === 'voltar') {
      session.step = 'service';
      await listServices(session, msg);
      return;
    }

    const professionals = normalizeList(session.professionals);
    if (professionals.length === 0) {
      await msg.reply('Lista de profissionais vazia. Voltando aos serviços...');
      session.step = 'service';
      await listServices(session, msg);
      return;
    }

    const choice = parseChoice(text);
    const idx = choice !== null ? choice - 1 : -1;
    if (idx < 0 || idx >= professionals.length) {
      await msg.reply('Opção inválida. Escolha um número da lista.');
      return;
    }

    session.professional = professionals[idx];
    session.step = 'date';
    await msg.reply('Qual o melhor dia para você? (DD/MM/AAAA)\n0 - Voltar');
  },

  date: async (session, msg, text) => {
    // voltar
    if (text === '0' || String(text).toLowerCase() === 'voltar') {
      session.step = 'professional';
      const professionals = normalizeList(session.professionals);
      const lines = professionals.map((p, i) => `${i + 1} - ${p.nomeInteiro ?? p.nome ?? `Profissional ${i + 1}`}`);
      await msg.reply(`Com qual profissional?\n${lines.join('\n')}\n0 - Voltar`.trim());
      return;
    }

    const iso = toIsoDate(text);
    if (!iso) {
      await msg.reply('Data inválida. Use o formato DD/MM/AAAA.\n0 - Voltar');
      return;
    }
    session.date = text; // mantém como digitado para exibir depois

    // carrega agendamentos do dia para esse profissional
    try {
      const data = await apiGet('agendamento');
      const appointments = normalizeList(data);

      const profId = session.professional?.id ?? session.professional?.idUsuario ?? session.professional?.Id;
      const dayPrefix = `${iso}T`;

      const busy = appointments.filter(a => {
        const aUser = a.idUsuario ?? a.usuarioId ?? a.IdUsuario;
        const start = a.dataHoraInicio ?? a.inicio ?? a.start;
        return aUser === profId && typeof start === 'string' && start.startsWith(dayPrefix);
      });

      // slots estáticos (ajuste conforme sua regra/duração de serviço)
      const allTimes = ['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00'];
      const times = allTimes.filter(t => !busy.some(b => String(b.dataHoraInicio ?? b.inicio ?? '').includes(`${t}`)));

      session.times = times;

      if (times.length === 0) {
        await msg.reply('Nenhum horário disponível para esse dia.');
        session.step = 'mainMenu';
        await msg.reply(menuText());
        return;
      }

      session.step = 'time';
      const lines = times.map((t, i) => `${i + 1} - ${t}`);
      await msg.reply(`De acordo com os horários disponíveis, escolha um abaixo:\n${lines.join('\n')}\n0 - Voltar`.trim());
    } catch (err) {
      console.error('[appointment.date->agendamento] API error:', err?.response?.status, err?.response?.data || err.message);
      await msg.reply('Não consegui carregar os horários agora.');
      session.step = 'mainMenu';
      await msg.reply(menuText());
    }
  },

  time: async (session, msg, text) => {
    // voltar
    if (text === '0' || String(text).toLowerCase() === 'voltar') {
      session.step = 'date';
      await msg.reply('Qual o melhor dia para você? (DD/MM/AAAA)\n0 - Voltar');
      return;
    }

    const times = Array.isArray(session.times) ? session.times : [];
    if (times.length === 0) {
      await msg.reply('A lista de horários está vazia. Informe a data novamente.');
      session.step = 'date';
      await msg.reply('Qual o melhor dia para você? (DD/MM/AAAA)\n0 - Voltar');
      return;
    }

    const choice = parseChoice(text);
    const idx = choice !== null ? choice - 1 : -1;
    if (idx < 0 || idx >= times.length) {
      await msg.reply('Opção inválida. Escolha um número da lista.');
      return;
    }

    session.time = times[idx];
    session.step = 'confirmAppointment';

    const svc = session.service || {};
    const prof = session.professional || {};
    await msg.reply(
      `Certo, agora confirme o agendamento:\n${svc.descricao ?? svc.nome ?? 'Serviço'} ` +
      `com o profissional ${prof.nomeInteiro ?? prof.nome ?? ''}, ` +
      `no dia ${session.date} às ${session.time}.\n\n` +
      `1 - Confirmar\n2 - Cancelar e iniciar novamente\n0 - Voltar`
    );
  },

  confirmAppointment: async (session, msg, text) => {
    // voltar
    if (text === '0' || String(text).toLowerCase() === 'voltar') {
      session.step = 'time';
      const times = Array.isArray(session.times) ? session.times : [];
      const lines = times.map((t, i) => `${i + 1} - ${t}`);
      await msg.reply(
        (lines.length
          ? `De acordo com os horários disponíveis, escolha um abaixo:\n${lines.join('\n')}\n0 - Voltar`
          : 'Sem horários carregados. Informe novamente a data (DD/MM/AAAA).'
        ).trim()
      );
      return;
    }

    if (text === '1') {
      const iso = toIsoDate(session.date);
      if (!iso) {
        await msg.reply('Data inválida. Recomeçando a seleção de data.');
        session.step = 'date';
        await msg.reply('Qual o melhor dia para você? (DD/MM/AAAA)\n0 - Voltar');
        return;
      }

      const idCliente =
        session.client?.id ??
        session.client?.idCliente ??
        session.client?.IdCliente ??
        session.client?.Id;

      const idUsuario =
        session.professional?.id ??
        session.professional?.idUsuario ??
        session.professional?.IdUsuario ??
        session.professional?.Id;

      const idServico =
        session.service?.id ??
        session.service?.idServico ??
        session.service?.IdServico ??
        session.service?.Id;

      if (!idCliente || !idUsuario || !idServico) {
        console.error('[appointment.confirm] missing ids', { idCliente, idUsuario, idServico });
        await msg.reply('Dados insuficientes para confirmar o agendamento. Recomeçando.');
        session.step = 'mainMenu';
        await msg.reply(menuText());
        return;
      }

      try {
        await apiPost('agendamento', {
          idCliente,
          idUsuario,
          idServico: [idServico],
          dataHoraInicio: `${iso}T${session.time}:00`
        });
        await msg.reply('Agendamento confirmado com sucesso! ✔');
        session.step = 'mainMenu';
        await msg.reply(menuText());
      } catch (err) {
        console.error('[appointment.confirm] API error:', err?.response?.status, err?.response?.data || err.message);
        await msg.reply('Não consegui confirmar seu agendamento agora.');
        session.step = 'mainMenu';
        await msg.reply(menuText());
      }

    } else if (text === '2') {
      session.step = 'service';
      await listServices(session, msg);
    } else {
      await msg.reply('Opção inválida.');
    }
  }
};
