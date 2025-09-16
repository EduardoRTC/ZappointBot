
const axios = require('axios');
const { apiBaseUrl, companyId } = require('../config');
const { menuText, startText } = require('../utils/messages');
const { listServices } = require('./appointment');

const JSON_HEADERS = { 'Content-Type': 'application/json' };
const STATUS = {
  pending: ['pendente', 'pending'],
  confirmed: ['confirmado', 'scheduled', 'agendado'],
  canceled: ['cancelado', 'canceled']
};

function joinUrl(...parts) {
  return parts
    .map((p, i) => (i === 0 ? String(p).replace(/\/+$/g, '') : String(p).replace(/^\/+|\/+$/g, '')))
    .filter(Boolean)
    .join('/');
}

const companyBaseUrl = joinUrl(apiBaseUrl, companyId);

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
  if (typeof maybeList === 'string') {
    try { return normalizeList(JSON.parse(maybeList)); } catch { return []; }
  }
  if (typeof maybeList === 'object') {
    if ('value' in maybeList) return normalizeList(maybeList.value);
    if ('data' in maybeList) return normalizeList(maybeList.data);
    return Object.values(maybeList);
  }
  return [];
}

function toNumber(value, fallback = undefined) {
  if (value === undefined || value === null || value === '') return fallback;
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
}

function getClientId(source) {
  const candidate = getProp(
    source,
    'id',
    'Id',
    'idCliente',
    'IdCliente',
    'clientId',
    'ClientId',
    'clienteId'
  );
  if (!hasValue(candidate)) return undefined;
  if (typeof candidate === 'number' && Number.isFinite(candidate)) return candidate;
  const parsed = Number(String(candidate).trim());
  return Number.isFinite(parsed) ? parsed : undefined;
}

function extractServiceInfo(raw) {
  const names = new Set();
  const ids = new Set();

  const directName = getProp(raw, 'service', 'Service', 'servico', 'Servico');
  if (hasValue(directName)) names.add(String(directName).trim());

  const directNames = getProp(raw, 'services', 'Services', 'servicos', 'Servicos');
  if (Array.isArray(directNames)) {
    directNames.forEach(n => {
      if (hasValue(n)) names.add(String(n).trim());
    });
  } else if (typeof directNames === 'string') {
    const text = directNames.trim();
    if (text.startsWith('[')) {
      try {
        const parsed = JSON.parse(text);
        if (Array.isArray(parsed)) {
          parsed.forEach(n => {
            if (hasValue(n)) names.add(String(n).trim());
          });
        }
      } catch {}
    } else if (text.includes(',')) {
      text.split(',').forEach(n => {
        if (n.trim()) names.add(n.trim());
      });
    } else if (text) {
      names.add(text);
    }
  }

  const agServ = getProp(raw, 'agendamentoServico', 'AgendamentoServico');
  if (Array.isArray(agServ)) {
    agServ.forEach(item => {
      const idServico = getProp(item, 'idServico', 'IdServico', 'servicoId', 'ServicoId', 'id');
      if (hasValue(idServico)) {
        const parsed = Number(String(idServico).trim());
        if (Number.isFinite(parsed)) ids.add(parsed);
      }
      const servico = getProp(item, 'servico', 'Servico');
      if (servico && typeof servico === 'object') {
        const nomeServico = getProp(servico, 'descricao', 'Descricao', 'nome', 'Nome');
        if (hasValue(nomeServico)) names.add(String(nomeServico).trim());
      }
    });
  }

  const idServico = getProp(raw, 'idServico', 'IdServico');
  if (Array.isArray(idServico)) {
    idServico.forEach(id => {
      const parsed = Number(String(id).trim());
      if (Number.isFinite(parsed)) ids.add(parsed);
    });
  } else if (typeof idServico === 'string') {
    const text = idServico.trim();
    if (text.startsWith('[')) {
      try {
        const parsed = JSON.parse(text);
        if (Array.isArray(parsed)) {
          parsed.forEach(id => {
            const parsedId = Number(String(id).trim());
            if (Number.isFinite(parsedId)) ids.add(parsedId);
          });
        }
      } catch {}
    } else if (text.includes(',')) {
      text.split(',').forEach(id => {
        const parsed = Number(id.trim());
        if (Number.isFinite(parsed)) ids.add(parsed);
      });
    } else {
      const parsed = Number(text);
      if (Number.isFinite(parsed)) ids.add(parsed);
    }
  } else if (Number.isFinite(idServico)) {
    ids.add(Number(idServico));
  }

  return {
    names: Array.from(names).filter(Boolean),
    ids: Array.from(ids).filter(Number.isFinite)
  };
}

function toDisplayDateTime(start, fallbackDate, fallbackTime) {
  let date = hasValue(fallbackDate) ? String(fallbackDate).trim() : '';
  let time = hasValue(fallbackTime) ? String(fallbackTime).trim() : '';

  const startStr = hasValue(start) ? String(start).trim() : '';
  if ((!date || !time) && startStr) {
    const splitter = startStr.includes('T') ? 'T' : ' ';
    const [datePart, timePartRaw = ''] = startStr.split(splitter);
    if (datePart && !date) {
      const [y, m, d] = datePart.split('-');
      if (y && m && d) {
        date = `${d.padStart(2, '0')}/${m.padStart(2, '0')}/${y.padStart(4, '0')}`;
      }
    }
    if (timePartRaw && !time) {
      const clean = timePartRaw.replace('Z', '').trim();
      if (clean) {
        const [h = '00', min = '00'] = clean.split(':');
        time = `${h.padStart(2, '0')}:${min.padStart(2, '0')}`;
      }
    }
  }

  return {
    date: date || null,
    time: time || null
  };
}

function composeIsoFromDateTime(dateStr, timeStr) {
  if (!hasValue(dateStr)) return null;
  const clean = String(dateStr).trim();
  const parts = clean.split(/[/-]/).map(p => p.trim()).filter(Boolean);
  if (parts.length !== 3) return null;

  let day;
  let month;
  let year;
  if (parts[0].length === 4) {
    [year, month, day] = parts;
  } else {
    [day, month, year] = parts;
  }

  if (!day || !month || !year) return null;

  const [hh = '00', mm = '00', ss = '00'] = hasValue(timeStr)
    ? String(timeStr).split(':').map(p => p.trim()).filter(Boolean)
    : ['00', '00', '00'];

  const iso = `${year.padStart(4, '0')}-${month.padStart(2, '0')}-${day.padStart(2, '0')}T${hh.padStart(2, '0')}:${mm.padStart(2, '0')}:${ss.padStart(2, '0')}`;
  return iso;
}

function toIsoDateTime(value, fallbackDate, fallbackTime) {
  if (value instanceof Date) {
    return formatDateToBackend(value);
  }
  if (typeof value === 'number' && Number.isFinite(value)) {
    return formatDateToBackend(new Date(value));
  }
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (trimmed) {
      if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(trimmed)) {
        return trimmed.length >= 19 ? trimmed.slice(0, 19) : trimmed;
      }
      const parsed = new Date(trimmed);
      if (!Number.isNaN(parsed.getTime())) {
        return formatDateToBackend(parsed);
      }
    }
  }
  const iso = composeIsoFromDateTime(fallbackDate, fallbackTime);
  if (iso) return iso;
  return null;
}

function formatDateToBackend(date) {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return null;
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
}

function parseIsoToDate(value) {
  if (value instanceof Date) return value;
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return null;
    const parsed = new Date(trimmed);
    if (!Number.isNaN(parsed.getTime())) return parsed;
  }
  return null;
}

function parseDurationToMinutes(duration) {
  if (!hasValue(duration)) return null;
  if (typeof duration === 'number' && Number.isFinite(duration)) return duration;
  if (typeof duration === 'string') {
    const trimmed = duration.trim();
    if (!trimmed) return null;
    if (trimmed.includes(':')) {
      const [h = '0', m = '0', s = '0'] = trimmed.split(':');
      const hours = Number(h);
      const minutes = Number(m);
      const seconds = Number(s);
      let total = 0;
      if (!Number.isNaN(hours)) total += hours * 60;
      if (!Number.isNaN(minutes)) total += minutes;
      if (!Number.isNaN(seconds)) total += seconds / 60;
      return total || null;
    }
    const numeric = Number(trimmed);
    return Number.isFinite(numeric) ? numeric : null;
  }
  if (typeof duration === 'object') {
    const hours = toNumber(getProp(duration, 'hours', 'Hours', 'hour')) || 0;
    const minutes = toNumber(getProp(duration, 'minutes', 'Minutes', 'minute')) || 0;
    const seconds = toNumber(getProp(duration, 'seconds', 'Seconds', 'second')) || 0;
    const total = hours * 60 + minutes + seconds / 60;
    return total || null;
  }
  return null;
}

function addDurationMinutes(startIso, duration) {
  const startDate = parseIsoToDate(startIso);
  if (!startDate) return null;
  const minutes = parseDurationToMinutes(duration);
  const totalMinutes = minutes || 60;
  const end = new Date(startDate.getTime() + totalMinutes * 60000);
  return formatDateToBackend(end);
}

function mapAppointment(raw, fallbackClientId) {
  const serviceInfo = extractServiceInfo(raw);
  const professional = getProp(raw, 'professionalName', 'profissionalNome', 'professional', 'profissional');
  const usuarioObj = getProp(raw, 'usuario', 'Usuario', 'professional', 'Professional');
  const professionalName = hasValue(professional)
    ? String(professional).trim()
    : (usuarioObj && getProp(usuarioObj, 'nomeInteiro', 'NomeInteiro', 'nome', 'Nome', 'nomeUsuario', 'NomeUsuario'));

  const start = getProp(raw, 'start', 'Start', 'dataHoraInicio', 'DataHoraInicio', 'inicio');
  const end = getProp(raw, 'end', 'End', 'dataHoraFim', 'DataHoraFim', 'fim');
  const providedDate = getProp(raw, 'date', 'Date', 'data', 'Data');
  const providedTime = getProp(raw, 'time', 'Time', 'hora', 'Hora');
  const { date, time } = toDisplayDateTime(start, providedDate, providedTime);

  const status = getProp(raw, 'status', 'Status', 'statusAgendamento', 'StatusAgendamento', 'situacao');
  const normalizedStatus = hasValue(status) ? String(status).trim().toLowerCase() : '';

  const clientId = getClientId(raw)
    ?? getClientId(getProp(raw, 'cliente', 'Cliente'))
    ?? fallbackClientId;

  const professionalId = getProp(raw, 'idUsuario', 'IdUsuario', 'usuarioId', 'UsuarioId');
  const id = getProp(raw, 'id', 'Id', 'idAgendamento', 'IdAgendamento');

  const valorTotal = getProp(raw, 'valorTotal', 'ValorTotal');
  const observacao = getProp(raw, 'observacao', 'Observacao');

  const serviceText = serviceInfo.names.length
    ? serviceInfo.names.join(', ')
    : (hasValue(getProp(raw, 'service', 'Service')) ? String(getProp(raw, 'service', 'Service')).trim() : null);

  const descriptionParts = [];
  if (serviceText) descriptionParts.push(serviceText);
  else descriptionParts.push('Atendimento');
  if (hasValue(professionalName)) descriptionParts.push(`com ${professionalName}`);

  return {
    id: hasValue(id) ? id : null,
    clientId: hasValue(clientId) ? clientId : null,
    professionalId: hasValue(professionalId) ? professionalId : null,
    status: status || '',
    normalizedStatus,
    start: hasValue(start) ? start : null,
    end: hasValue(end) ? end : null,
    date: date,
    time: time,
    serviceName: serviceText || 'Atendimento',
    serviceIds: serviceInfo.ids,
    serviceNames: serviceInfo.names,
    professionalName: professionalName ? String(professionalName).trim() : null,
    description: descriptionParts.join(' '),
    valorTotal: hasValue(valorTotal) ? Number(valorTotal) : null,
    observacao: hasValue(observacao) ? String(observacao) : null,
    raw
  };
}

async function fetchCompanyAppointments() {
  const url = joinUrl(companyBaseUrl, 'agendamento');
  const resp = await axios.get(url);
  return normalizeList(resp.data);
}

function hasStatus(app, statuses) {
  if (!app || !Array.isArray(statuses)) return false;
  return statuses.some(status => {
    if (!status) return false;
    return app.normalizedStatus === status.toLowerCase();
  });
}

function parseComparableDate(app) {
  if (!app) return null;
  if (hasValue(app.start)) {
    const date = parseIsoToDate(app.start);
    if (date) return date;
  }
  if (app.date) {
    const iso = composeIsoFromDateTime(app.date, app.time || '00:00');
    if (iso) {
      const date = parseIsoToDate(iso);
      if (date) return date;
    }
  }
  return null;
}

async function loadAppointmentsForClient(session, filterType) {
  if (!session.client) {
    throw new Error('Sessão sem cliente associado.');
  }
  const sessionClientId = getClientId(session.client);
  if (!hasValue(sessionClientId)) {
    throw new Error('Não foi possível identificar o cliente na sessão.');
  }

  const rawAppointments = await fetchCompanyAppointments();
  const targetId = String(sessionClientId);
  const mapped = rawAppointments
    .map(raw => mapAppointment(raw, sessionClientId))
    .filter(app => app && hasValue(app.clientId) && String(app.clientId) === targetId);

  if (filterType === 'pending') {
    return mapped.filter(app => hasStatus(app, STATUS.pending));
  }
  if (filterType === 'cancelable') {
    return mapped.filter(app => hasStatus(app, STATUS.confirmed) || hasStatus(app, STATUS.pending));
  }
  if (filterType === 'future') {
    const now = new Date();
    return mapped.filter(app => {
      if (hasStatus(app, STATUS.canceled)) return false;
      const date = parseComparableDate(app);
      if (!date) return false;
      return date >= now;
    });
  }
  return mapped;
}

function buildAppointmentPrompt(title, appointments) {
  let text = `${title}\n`;
  appointments.forEach((app, index) => {
    const datePart = app.date ? ` em ${app.date}` : '';
    const timePart = app.time ? ` às ${app.time}` : '';
    text += `${index + 1} - ${app.description}${datePart}${timePart}\n`;
  });
  text += '0 - Voltar';
  return text.trim();
}

async function fetchAppointmentById(id) {
  try {
    const url = joinUrl(companyBaseUrl, 'agendamento', String(id));
    const resp = await axios.get(url);
    return resp.data;
  } catch (err) {
    console.error('[menu.fetchAppointmentById] erro ao buscar agendamento:', err?.response?.status, err?.response?.data || err.message);
    return null;
  }
}

function normalizeId(value) {
  if (!hasValue(value)) return null;
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  const parsed = Number(String(value).trim());
  return Number.isFinite(parsed) ? parsed : null;
}

function mergeAppointmentData(base, extra) {
  if (!extra) return base;
  const mergedRaw = { ...base.raw, ...extra };
  const merged = {
    ...base,
    raw: mergedRaw
  };

  if (!hasValue(base.start)) merged.start = getProp(extra, 'dataHoraInicio', 'DataHoraInicio') || base.start;
  if (!hasValue(base.end)) merged.end = getProp(extra, 'dataHoraFim', 'DataHoraFim') || base.end;
  if (!hasValue(base.serviceIds) || base.serviceIds.length === 0) {
    const info = extractServiceInfo(extra);
    if (info.ids.length) {
      merged.serviceIds = info.ids;
      merged.serviceNames = info.names;
    }
  }
  if (!hasValue(base.observacao)) merged.observacao = getProp(extra, 'observacao', 'Observacao') || base.observacao;
  if (!hasValue(base.valorTotal)) {
    const valor = getProp(extra, 'valorTotal', 'ValorTotal');
    if (hasValue(valor)) merged.valorTotal = Number(valor);
  }
  if (!hasValue(base.professionalId)) {
    merged.professionalId = getProp(extra, 'idUsuario', 'IdUsuario', 'usuarioId', 'UsuarioId') || base.professionalId;
  }
  if (!hasValue(base.clientId)) {
    merged.clientId = getClientId(extra) ?? getClientId(getProp(extra, 'cliente', 'Cliente')) ?? base.clientId;
  }
  return merged;
}

function buildUpdatePayload(app, newStatus) {
  const id = normalizeId(app.id);
  if (!id) throw new Error('Agendamento sem identificador.');

  const serviceIds = Array.isArray(app.serviceIds) ? app.serviceIds.filter(Number.isFinite) : [];
  if (!serviceIds.length) {
    throw new Error('Serviços do agendamento não encontrados.');
  }

  const clientId = normalizeId(app.clientId ?? getClientId(app.raw) ?? getClientId(getProp(app.raw, 'cliente', 'Cliente')));
  const professionalId = normalizeId(app.professionalId ?? getProp(app.raw, 'idUsuario', 'IdUsuario', 'usuarioId', 'UsuarioId'));

  const startIso = toIsoDateTime(app.start, app.date, app.time);
  const endIsoCandidate = toIsoDateTime(app.end, null, null)
    || toIsoDateTime(getProp(app.raw, 'dataHoraFim', 'DataHoraFim'))
    || addDurationMinutes(startIso, getProp(app.raw, 'tempoDuracaoAgendamento', 'TempoDuracaoAgendamento'))
    || (startIso ? addDurationMinutes(startIso, 60) : null);

  if (!clientId || !professionalId || !startIso || !endIsoCandidate) {
    throw new Error('Dados do agendamento incompletos para atualização.');
  }

  const valorTotal = toNumber(app.valorTotal ?? getProp(app.raw, 'valorTotal', 'ValorTotal'), 0) ?? 0;
  const observacao = hasValue(app.observacao) ? app.observacao : getProp(app.raw, 'observacao', 'Observacao') || null;

  return {
    IdCliente: clientId,
    IdUsuario: professionalId,
    IdServico: serviceIds,
    DataHoraInicio: startIso,
    DataHoraFim: endIsoCandidate,
    ValorTotal: valorTotal,
    StatusAgendamento: newStatus,
    Observacao: observacao
  };
}

async function updateAppointmentStatus(app, newStatus) {
  let payload;
  try {
    payload = buildUpdatePayload(app, newStatus);
  } catch (err) {
    const detailed = await fetchAppointmentById(app.id);
    if (!detailed) throw err;
    const merged = mergeAppointmentData(app, detailed);
    payload = buildUpdatePayload(merged, newStatus);
  }

  const url = joinUrl(companyBaseUrl, 'agendamento', String(app.id));
  await axios.put(url, payload, { headers: JSON_HEADERS });
}

module.exports = {
  mainMenu: async (session, msg, text) => {
    if (text === '0' || text.toLowerCase() === 'voltar') {
      session.step = 'start';
      await msg.reply(startText());
      return;
    }

    if (text === '1') {
      session.step = 'service';
      await listServices(session, msg);
      return;
    }

    if (text === '2') {
      try {
        const appointments = await loadAppointmentsForClient(session, 'pending');
        session.appointments = appointments;
        if (!appointments.length) {
          await msg.reply('Você não possui agendamentos pendentes de confirmação.');
          await msg.reply(menuText());
          return;
        }
        session.step = 'confirmExisting';
        await msg.reply(buildAppointmentPrompt('Qual agendamento deseja confirmar?', appointments));
      } catch (err) {
        console.error('[menu.mainMenu -> pending] erro ao buscar agendamentos:', err?.response?.status, err?.response?.data || err.message);
        await msg.reply('Não consegui carregar seus agendamentos pendentes agora.');
        await msg.reply(menuText());
      }
      return;
    }

    if (text === '3') {
      try {
        const appointments = await loadAppointmentsForClient(session, 'cancelable');
        session.appointments = appointments;
        if (!appointments.length) {
          await msg.reply('Você não possui agendamentos para cancelar.');
          await msg.reply(menuText());
          return;
        }
        session.step = 'cancelExisting';
        await msg.reply(buildAppointmentPrompt('Qual agendamento deseja cancelar?', appointments));
      } catch (err) {
        console.error('[menu.mainMenu -> cancelable] erro ao buscar agendamentos:', err?.response?.status, err?.response?.data || err.message);
        await msg.reply('Não consegui carregar seus agendamentos agora.');
        await msg.reply(menuText());
      }
      return;
    }

    if (text === '4') {
      try {
        const appointments = await loadAppointmentsForClient(session, 'future');
        if (!appointments.length) {
          await msg.reply('Você não possui agendamentos futuros.');
        } else {
          let list = 'Seus agendamentos:\n';
          appointments.forEach(app => {
            const datePart = app.date ? ` em ${app.date}` : '';
            const timePart = app.time ? ` às ${app.time}` : '';
            list += `- ${app.description}${datePart}${timePart}\n`;
          });
          await msg.reply(list.trim());
        }
      } catch (err) {
        console.error('[menu.mainMenu -> future] erro ao buscar agendamentos:', err?.response?.status, err?.response?.data || err.message);
        await msg.reply('Não consegui carregar seus agendamentos no momento.');
      }
      await msg.reply(menuText());
      return;
    }

    await msg.reply('Opção inválida. Escolha uma das opções do menu.');
  },

  confirmExisting: async (session, msg, text) => {
    if (text === '0' || text.toLowerCase() === 'voltar') {
      session.step = 'mainMenu';
      await msg.reply(menuText());
      return;
    }

    const index = parseInt(text, 10) - 1;
    if (Number.isNaN(index) || index < 0 || !Array.isArray(session.appointments) || index >= session.appointments.length) {
      await msg.reply('Opção inválida.');
      return;
    }

    const appointment = session.appointments[index];
    try {
      await updateAppointmentStatus(appointment, 'Confirmado');
      await msg.reply('Agendamento confirmado com sucesso!');
    } catch (err) {
      console.error('[menu.confirmExisting] erro ao confirmar agendamento:', err?.response?.status, err?.response?.data || err.message);
      await msg.reply('Não foi possível confirmar o agendamento.');
    }

    session.step = 'mainMenu';
    await msg.reply(menuText());
  },

  cancelExisting: async (session, msg, text) => {
    if (text === '0' || text.toLowerCase() === 'voltar') {
      session.step = 'mainMenu';
      await msg.reply(menuText());
      return;
    }

    const index = parseInt(text, 10) - 1;
    if (Number.isNaN(index) || index < 0 || !Array.isArray(session.appointments) || index >= session.appointments.length) {
      await msg.reply('Opção inválida.');
      return;
    }

    const appointment = session.appointments[index];
    try {
      await updateAppointmentStatus(appointment, 'Cancelado');
      await msg.reply('Agendamento cancelado.');
    } catch (err) {
      console.error('[menu.cancelExisting] erro ao cancelar agendamento:', err?.response?.status, err?.response?.data || err.message);
      await msg.reply('Não foi possível cancelar o agendamento.');
    }

    session.step = 'mainMenu';
    await msg.reply(menuText());
  }
};
