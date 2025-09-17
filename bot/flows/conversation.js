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

/* =========================================================
 * Utils compartilhadas
 * =======================================================*/
function joinUrl(...parts) {
  return parts
    .map((p, i) => (i === 0 ? String(p).replace(/\/+$/g, '') : String(p).replace(/^\/+|\/+$/g, '')))
    .filter(Boolean)
    .join('/');
}

const companyBaseUrl = joinUrl(apiBaseUrl, companyId);

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

async function findClientByCPF(cpf) {
  const url = joinUrl(apiBaseUrl, cpfTenantId, 'cliente', 'by-cpf');
  const clean = sanitizeCPF(cpf);
  console.log('[findClientByCPF] url:', url, 'tenant:', cpfTenantId, 'cpf:', clean);
  try {
    const resp = await axios.get(url, { params: { cpf: clean } });
    const normalized = normalizeClient(resp.data);
    console.log('[findClientByCPF] response:', normalized);
    return normalized;
  } catch (e) {
    const status = e?.response?.status;
    console.error('[findClientByCPF] error:', status, e?.response?.data || e);
    if (status === 400 || status === 404) {
      console.log('[findClientByCPF] CPF não encontrado:', clean);
      return null;
    }
    throw e;
  }
}

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
  if (typeof maybeList !== 'object') return [];

  const nested = getProp(maybeList, 'value', 'values', 'data', 'items', 'itens', 'result', 'results', 'lista');
  if (nested !== undefined && nested !== maybeList) {
    const normalized = normalizeList(nested);
    if (normalized.length) return normalized;
    if (Array.isArray(nested)) return nested;
  }

  if (typeof maybeList.length === 'number' && maybeList.length >= 0) {
    try { return Array.from(maybeList); } catch {}
  }

  const keys = Object.keys(maybeList);
  const numericKeys = keys.filter(key => /^\d+$/.test(key));
  if (numericKeys.length && numericKeys.length === keys.length) {
    return numericKeys
      .sort((a, b) => Number(a) - Number(b))
      .map(key => maybeList[key]);
  }

  const aggregated = [];
  for (const value of Object.values(maybeList)) {
    if (!value || typeof value !== 'object') continue;
    const normalized = normalizeList(value);
    if (normalized.length) {
      aggregated.push(...normalized);
    }
  }

  return aggregated;
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
      if (!hasValue(n)) return;
      if (typeof n === 'object') {
        const id = getProp(n, 'id', 'Id', 'idServico', 'IdServico', 'servicoId', 'ServicoId');
        if (hasValue(id)) {
          const parsed = Number(String(id).trim());
          if (Number.isFinite(parsed)) ids.add(parsed);
        }
        const nomeServico = getProp(n, 'descricao', 'Descricao', 'nome', 'Nome');
        if (hasValue(nomeServico)) {
          names.add(String(nomeServico).trim());
        }
        return;
      }
      names.add(String(n).trim());
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

  const servicosDetalhados = normalizeList(getProp(
    raw,
    'servicosAgendamento',
    'ServicosAgendamento',
    'servicosDetalhes',
    'ServicosDetalhes',
    'servicosDetalhados',
    'ServicosDetalhados'
  ));
  servicosDetalhados.forEach(item => {
    if (!item || typeof item !== 'object') return;
    const idServicoItem = getProp(item, 'id', 'Id', 'idServico', 'IdServico', 'servicoId', 'ServicoId');
    if (hasValue(idServicoItem)) {
      const parsed = Number(String(idServicoItem).trim());
      if (Number.isFinite(parsed)) ids.add(parsed);
    }
    const nomeItem = getProp(item, 'descricao', 'Descricao', 'nome', 'Nome');
    if (hasValue(nomeItem)) names.add(String(nomeItem).trim());

    const servicoNested = getProp(item, 'servico', 'Servico');
    if (servicoNested && typeof servicoNested === 'object') {
      const nestedId = getProp(servicoNested, 'id', 'Id', 'idServico', 'IdServico');
      if (hasValue(nestedId)) {
        const parsedId = Number(String(nestedId).trim());
        if (Number.isFinite(parsedId)) ids.add(parsedId);
      }
      const nestedName = getProp(servicoNested, 'descricao', 'Descricao', 'nome', 'Nome');
      if (hasValue(nestedName)) names.add(String(nestedName).trim());
    }
  });

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

  const agServPlural = normalizeList(getProp(raw, 'agendamentoServicos', 'AgendamentoServicos'));
  agServPlural.forEach(item => {
    if (!item || typeof item !== 'object') return;
    const idServico = getProp(item, 'idServico', 'IdServico', 'servicoId', 'ServicoId', 'id');
    if (hasValue(idServico)) {
      const parsed = Number(String(idServico).trim());
      if (Number.isFinite(parsed)) ids.add(parsed);
    }
    const servico = getProp(item, 'servico', 'Servico');
    if (servico && typeof servico === 'object') {
      const nomeServico = getProp(servico, 'descricao', 'Descricao', 'nome', 'Nome');
      if (hasValue(nomeServico)) names.add(String(nomeServico).trim());
      const nestedId = getProp(servico, 'id', 'Id');
      if (hasValue(nestedId)) {
        const parsedId = Number(String(nestedId).trim());
        if (Number.isFinite(parsedId)) ids.add(parsedId);
      }
    }
  });

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

const STATUS = {
  pending: ['pendente', 'pending'],
  confirmed: ['confirmado', 'scheduled', 'agendado'],
  canceled: ['cancelado', 'canceled']
};

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
    const payload = resp.data;
    if (payload && typeof payload === 'object') {
      const nested = getProp(payload, 'data', 'Data', 'resultado', 'Resultado', 'agendamento', 'Agendamento');
      if (nested && typeof nested === 'object') {
        return nested;
      }
    }
    return payload;
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

  let serviceIds = [];
  if (Array.isArray(app.serviceIds)) {
    serviceIds = app.serviceIds
      .map(value => {
        if (Number.isFinite(value)) return Number(value);
        const parsed = Number(String(value).trim());
        return Number.isFinite(parsed) ? parsed : null;
      })
      .filter(Number.isFinite);
  }

  if ((!serviceIds || !serviceIds.length) && app.raw) {
    try {
      const info = extractServiceInfo(app.raw);
      serviceIds = Array.isArray(info?.ids)
        ? info.ids
            .map(value => {
              if (Number.isFinite(value)) return Number(value);
              const parsed = Number(String(value).trim());
              return Number.isFinite(parsed) ? parsed : null;
            })
            .filter(Number.isFinite)
        : [];
    } catch (err) {
      console.error('[menu.buildUpdatePayload] erro ao extrair serviços do agendamento:', err?.message || err);
    }
  }

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

function toIsoDate(dateStr) {
  const [d, m, y] = String(dateStr).trim().split('/');
  if (!d || !m || !y) return null;
  const day = String(d).padStart(2, '0');
  const mon = String(m).padStart(2, '0');
  if (y.length !== 4) return null;
  return `${y}-${mon}-${day}`;
}

function parseChoice(text) {
  const n = parseInt(String(text).trim(), 10);
  return Number.isNaN(n) ? null : n;
}

async function apiGet(path, opts = {}) {
  const url = joinUrl(companyBaseUrl, path);
  const resp = await axios.get(url, opts);
  return resp.data;
}

async function apiPost(path, body, opts = {}) {
  const url = joinUrl(companyBaseUrl, path);
  const resp = await axios.post(url, body, { headers: JSON_HEADERS, ...opts });
  return resp.data;
}

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

/* =========================================================
 * Fluxo de cadastro
 * =======================================================*/
async function start(session, msg, text) {
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
}

async function awaitExistingCPF(session, msg, text, sessions) {
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
      const clientName =
        getProp(client, 'nome', 'nomeInteiro', 'nomeCompleto', 'nomeCliente', 'Nome', 'NomeCompleto', 'NomeCliente') ||
        'cliente';
      const trimmedName = String(clientName).trim();
      const greetingName = trimmedName.length ? trimmedName : 'cliente';
      await msg.reply(
        `Olá ${greetingName}! Encontramos seu cadastro.\n1 - Sim, sou eu\n0 - Voltar`
      );
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
}

async function awaitCPF(session, msg, text) {
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
}

async function awaitName(session, msg, text, sessions) {
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
}

async function confirmClient(session, msg, text) {
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

/* =========================================================
 * Fluxo de menu e agendamentos
 * =======================================================*/
async function mainMenu(session, msg, text) {
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

  if (text === '3') {
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
}

async function confirmExisting(session, msg, text) {
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
}

async function cancelExisting(session, msg, text) {
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

async function service(session, msg, text) {
  if (text === '0' || String(text).toLowerCase() === 'voltar') {
    session.step = 'mainMenu';
    await msg.reply(menuText());
    return;
  }

  const services = normalizeList(session.services);
  if (services.length === 0) {
    await msg.reply('Lista de serviços vazia. Carregando novamente...');
    await listServices(session, msg);
    return;
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
}

async function professional(session, msg, text) {
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
}

async function date(session, msg, text) {
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
  session.date = text;

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
}

async function time(session, msg, text) {
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
}

async function confirmAppointment(session, msg, text) {
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

module.exports = {
  start,
  awaitExistingCPF,
  awaitCPF,
  awaitName,
  confirmClient,
  mainMenu,
  confirmExisting,
  cancelExisting,
  service,
  professional,
  date,
  time,
  confirmAppointment
};
