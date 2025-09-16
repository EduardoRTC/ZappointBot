require('dotenv').config();

const {
  API_BASE_URL = 'http://localhost:8080',
  ALLOWED_NUMBERS = '',
  EMPRESA_ID = ''
} = process.env;

function normalizeBaseUrl(value) {
  const raw = String(value || '').trim();
  const fallback = raw.length > 0 ? raw : 'http://localhost:8080';
  return fallback.replace(/\/+$/g, '');
}

function normalizePathSegment(value) {
  return String(value || '').trim().replace(/^\/+|\/+$/g, '');
}

const rawApiBaseUrl = normalizeBaseUrl(API_BASE_URL);
const empresaId = normalizePathSegment(EMPRESA_ID);
const apiBaseUrl = empresaId ? `${rawApiBaseUrl}/${empresaId}` : rawApiBaseUrl;

module.exports = {
  apiBaseUrl,
  rawApiBaseUrl,
  empresaId,
  // Accept comma-separated list of numbers
  allowedNumbers: ALLOWED_NUMBERS.split(',').map(n => n.trim()).filter(Boolean)
};
