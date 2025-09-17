#!/usr/bin/env node
'use strict';

const path = require('path');
const axios = require('axios');
const dotenv = require('dotenv');

// Load environment variables from root and bot directories when available
dotenv.config({ path: path.resolve(__dirname, '..', '..', '.env') });
dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

const GUID_REGEX = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
const DEFAULT_COMPANY_ID = '11111111-2222-3333-4444-555555555555';

const API_BASE_URL = (process.env.API_BASE_URL || 'http://localhost:8080').trim().replace(/\/+$/g, '');
const COMPANY_ID = (process.env.COMPANY_ID || DEFAULT_COMPANY_ID).trim();

if (!GUID_REGEX.test(COMPANY_ID)) {
  console.error('❌  COMPANY_ID inválido. Configure a variável de ambiente COMPANY_ID com um GUID válido.');
  process.exit(1);
}

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json'
  }
});

let useCompanyPrefix = true;

class ApiError extends Error {
  constructor(method, url, status, data) {
    super(`Falha na requisição ${method.toUpperCase()} ${url} (status ${status})`);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
    this.method = method.toUpperCase();
    this.url = url;
  }
}

function isAllowedStatus(status, allowedStatuses) {
  if (Array.isArray(allowedStatuses)) {
    return allowedStatuses.includes(status);
  }
  if (typeof allowedStatuses === 'function') {
    return Boolean(allowedStatuses(status));
  }
  return status >= 200 && status < 300;
}

function buildResourcePath(resource, includeCompany = true) {
  const cleanResource = String(resource || '').replace(/^\/+/, '');
  if (includeCompany && useCompanyPrefix) {
    return `/${COMPANY_ID}/${cleanResource}`;
  }
  return `/${cleanResource}`;
}

async function getResource(resource, options = {}) {
  const { params, includeCompany = true, allowedStatuses } = options;
  const url = buildResourcePath(resource, includeCompany);
  const response = await axiosInstance.get(url, {
    params,
    validateStatus: () => true
  });

  if (!isAllowedStatus(response.status, allowedStatuses)) {
    throw new ApiError('GET', url, response.status, response.data);
  }

  return response;
}

async function postResource(resource, data, options = {}) {
  const { includeCompany = true, allowedStatuses } = options;
  const url = buildResourcePath(resource, includeCompany);
  const response = await axiosInstance.post(url, data, {
    validateStatus: () => true
  });

  if (!isAllowedStatus(response.status, allowedStatuses)) {
    throw new ApiError('POST', url, response.status, response.data);
  }

  return response;
}

function normalizeList(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  if (typeof value !== 'object') return [];

  const directValue = value.value ?? value.Value;
  if (Array.isArray(directValue)) return directValue;
  if (directValue && typeof directValue === 'object') {
    const nested = normalizeList(directValue);
    if (nested.length) return nested;
  }

  const keysToInspect = ['data', 'Data', 'items', 'Items', 'result', 'Result', 'results', 'Results', 'lista', 'Lista', 'values', 'Values'];
  for (const key of keysToInspect) {
    if (Array.isArray(value[key])) return value[key];
    if (value[key] && typeof value[key] === 'object') {
      const nested = normalizeList(value[key]);
      if (nested.length) return nested;
    }
  }

  return [];
}

function getField(obj, ...names) {
  if (!obj || typeof obj !== 'object') return undefined;
  for (const name of names) {
    if (Object.prototype.hasOwnProperty.call(obj, name)) {
      const candidate = obj[name];
      if (candidate !== undefined && candidate !== null) return candidate;
    }
  }
  const entries = Object.entries(obj);
  for (const name of names) {
    const lower = name.toLowerCase();
    for (const [key, value] of entries) {
      if (key.toLowerCase() === lower && value !== undefined && value !== null) {
        return value;
      }
    }
  }
  return undefined;
}

function normalizeString(value) {
  if (value === undefined || value === null) return '';
  return String(value).trim().toLowerCase();
}

function cleanDigits(value) {
  return String(value || '').replace(/\D/g, '');
}

const servicesToEnsure = [
  {
    Descricao: 'Corte Clássico Masculino',
    Valor: 55,
    TempoDuracao: '00:40:00'
  },
  {
    Descricao: 'Barba Completa com Toalha Quente',
    Valor: 35,
    TempoDuracao: '00:30:00'
  },
  {
    Descricao: 'Combo Corte + Barba Premium',
    Valor: 80,
    TempoDuracao: '01:10:00'
  }
];

const professionalsToEnsure = [
  {
    NomeUsuario: 'joao.sousa',
    NomeInteiro: 'João Sousa',
    Senha: 'SenhaForte123',
    Email: 'joao.sousa@example.com',
    IdCargo: 1,
    Cpf: '96655850533'
  },
  {
    NomeUsuario: 'maria.santos',
    NomeInteiro: 'Maria Santos',
    Senha: 'SenhaForte456',
    Email: 'maria.santos@example.com',
    IdCargo: 1,
    Cpf: '34432855894'
  },
  {
    NomeUsuario: 'carlos.pereira',
    NomeInteiro: 'Carlos Pereira',
    Senha: 'SenhaForte789',
    Email: 'carlos.pereira@example.com',
    IdCargo: 2,
    Cpf: '59392624654'
  }
];

const clientsToEnsure = [
  {
    Nome: 'Bruno Oliveira',
    Telefone: '11999990001',
    Cpf: '85103991314',
    Email: 'bruno.oliveira@example.com',
    Observacao: 'Cliente de demonstração criado automaticamente.'
  },
  {
    Nome: 'Ana Costa',
    Telefone: '11988880002',
    Cpf: '67308238954',
    Email: 'ana.costa@example.com',
    Observacao: 'Cliente de demonstração criado automaticamente.'
  },
  {
    Nome: 'Felipe Martins',
    Telefone: '11977770003',
    Cpf: '35499352933',
    Email: 'felipe.martins@example.com',
    Observacao: 'Cliente de demonstração criado automaticamente.'
  }
];

async function ensureCompanyExists() {
  console.log('🔎  Verificando existência da empresa padrão...');
  try {
    const response = await axiosInstance.get(`/empresa/${COMPANY_ID}`, { validateStatus: () => true });
    if (response.status === 200) {
      const nome = getField(response.data, 'nomeFantasia', 'NomeFantasia');
      console.log(`✅  Empresa encontrada: ${nome || COMPANY_ID}`);
      return;
    }
    if (response.status === 404) {
      throw new Error('Empresa padrão não encontrada. Cadastre a empresa antes de executar o script.');
    }
    console.warn(`⚠️  Não foi possível confirmar a empresa (status ${response.status}). Continuando mesmo assim...`);
  } catch (err) {
    if (err instanceof ApiError) {
      throw err;
    }
    throw new Error(`Falha ao verificar empresa: ${err.message}`);
  }
}

async function detectRoutePrefix() {
  console.log('🔎  Detectando formato das rotas da API...');
  useCompanyPrefix = true;
  try {
    await getResource('servico', { allowedStatuses: status => status >= 200 && status < 400 });
    console.log(`✅  Usando rotas com prefixo da empresa (${COMPANY_ID}).`);
    return;
  } catch (err) {
    if (err instanceof ApiError) {
      console.log(`ℹ️  Rotas com prefixo retornaram status ${err.status}. Tentando sem prefixo...`);
    } else {
      console.log('ℹ️  Erro inesperado ao testar rotas com prefixo. Tentando sem prefixo...');
    }
  }

  useCompanyPrefix = false;
  await getResource('servico', {
    includeCompany: false,
    allowedStatuses: status => status >= 200 && status < 400
  }).catch(err => {
    if (err instanceof ApiError) {
      throw new Error(`Não foi possível acessar os endpoints de serviço. Último status: ${err.status}.`);
    }
    throw err;
  });
  console.log('✅  Usando rotas sem prefixo da empresa.');
}

async function ensureServices() {
  console.log('\n💈  Sincronizando serviços...');
  const existingResponse = await getResource('servico');
  const existing = normalizeList(existingResponse.data);
  const existingByName = new Map();

  for (const item of existing) {
    const name = normalizeString(getField(item, 'descricao', 'Descricao', 'nome', 'Nome'));
    if (name) {
      existingByName.set(name, item);
    }
  }

  for (const service of servicesToEnsure) {
    const key = normalizeString(service.Descricao);
    if (existingByName.has(key)) {
      const found = existingByName.get(key);
      const id = getField(found, 'id', 'Id');
      console.log(`   • Serviço "${service.Descricao}" já existe (id ${id ?? 'desconhecido'}).`);
      continue;
    }

    await createService(service);
  }
}

async function createService(service) {
  try {
    const response = await postResource('servico', service, {
      allowedStatuses: status => status === 201 || (status >= 200 && status < 300)
    });
    const created = response.data;
    const id = getField(created, 'id', 'Id');
    console.log(`   • Serviço "${service.Descricao}" criado (id ${id ?? 'novo'}).`);
  } catch (err) {
    if (err instanceof ApiError) {
      console.error(`   ❌  Falha ao criar serviço "${service.Descricao}": status ${err.status}`, err.data);
    } else {
      console.error(`   ❌  Falha ao criar serviço "${service.Descricao}":`, err.message);
    }
  }
}

async function ensureProfessionals() {
  console.log('\n🧑‍🤝‍🧑  Sincronizando profissionais...');
  const response = await getResource('usuario');
  const existing = normalizeList(response.data);
  const existingByUsername = new Map();

  for (const item of existing) {
    const username = normalizeString(getField(item, 'nomeUsuario', 'NomeUsuario', 'usuario', 'Usuario'));
    if (username) {
      existingByUsername.set(username, item);
    }
  }

  for (const professional of professionalsToEnsure) {
    const usernameKey = normalizeString(professional.NomeUsuario);
    if (existingByUsername.has(usernameKey)) {
      const found = existingByUsername.get(usernameKey);
      const id = getField(found, 'id', 'Id');
      console.log(`   • Profissional "${professional.NomeInteiro}" já existe (usuário ${professional.NomeUsuario}, id ${id ?? 'desconhecido'}).`);
      continue;
    }

    await createProfessional(professional);
  }
}

async function createProfessional(professional) {
  try {
    const response = await postResource('usuario', professional, {
      allowedStatuses: status => status === 201 || (status >= 200 && status < 300)
    });
    const created = response.data;
    const id = getField(created, 'id', 'Id');
    console.log(`   • Profissional "${professional.NomeInteiro}" criado (usuário ${professional.NomeUsuario}, id ${id ?? 'novo'}).`);
  } catch (err) {
    if (err instanceof ApiError) {
      console.error(`   ❌  Falha ao criar profissional "${professional.NomeInteiro}": status ${err.status}`, err.data);
    } else {
      console.error(`   ❌  Falha ao criar profissional "${professional.NomeInteiro}":`, err.message);
    }
  }
}

async function ensureClients() {
  console.log('\n👥  Sincronizando clientes de demonstração...');
  let existing = [];
  try {
    const response = await getResource('cliente');
    existing = normalizeList(response.data);
  } catch (err) {
    if (err instanceof ApiError) {
      console.warn(`   ⚠️  Não foi possível listar clientes (status ${err.status}). Os clientes podem não ser criados.`);
      return;
    }
    console.warn(`   ⚠️  Não foi possível listar clientes: ${err.message}`);
    return;
  }

  const existingByCpf = new Map();
  for (const item of existing) {
    const cpf = cleanDigits(getField(item, 'cpf', 'Cpf'));
    if (cpf) {
      existingByCpf.set(cpf, item);
    }
  }

  for (const client of clientsToEnsure) {
    const cpf = cleanDigits(client.Cpf);
    if (existingByCpf.has(cpf)) {
      const found = existingByCpf.get(cpf);
      const id = getField(found, 'id', 'Id');
      console.log(`   • Cliente "${client.Nome}" já existe (CPF ${cpf}, id ${id ?? 'desconhecido'}).`);
      continue;
    }

    await createClient(client);
  }
}

async function createClient(client) {
  try {
    const payload = {
      ...client,
      Cpf: cleanDigits(client.Cpf),
      Telefone: cleanDigits(client.Telefone)
    };
    const response = await postResource('cliente', payload, {
      allowedStatuses: status => status === 201 || (status >= 200 && status < 300)
    });
    const created = response.data;
    const id = getField(created, 'id', 'Id');
    console.log(`   • Cliente "${client.Nome}" criado (CPF ${payload.Cpf}, id ${id ?? 'novo'}).`);
  } catch (err) {
    if (err instanceof ApiError) {
      console.error(`   ❌  Falha ao criar cliente "${client.Nome}": status ${err.status}`, err.data);
    } else {
      console.error(`   ❌  Falha ao criar cliente "${client.Nome}":`, err.message);
    }
  }
}

async function main() {
  console.log('🚀  Iniciando rotina de preparação de dados para agendamentos.');
  console.log(`📡  API: ${API_BASE_URL}`);
  console.log(`🏢  Empresa alvo: ${COMPANY_ID}`);

  await ensureCompanyExists();
  await detectRoutePrefix();
  await ensureServices();
  await ensureProfessionals();
  await ensureClients();

  console.log('\n✅  Dados essenciais para o fluxo de agendamento sincronizados com sucesso.');
}

main().catch(err => {
  if (err instanceof ApiError) {
    console.error(`❌  ${err.message}`);
    if (err.data) {
      console.error('Detalhes:', err.data);
    }
  } else {
    console.error('❌  Erro inesperado:', err.message);
  }
  process.exit(1);
});
