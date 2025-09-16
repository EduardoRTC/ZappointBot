const GUID_REGEX = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
require('dotenv').config();

const DEFAULT_CPF_TENANT_ID = '11111111-2222-3333-4444-555555555555';

const {
  API_BASE_URL = 'http://localhost:8080',
  COMPANY_ID: RAW_COMPANY_ID,
  CPF_TENANT_ID: RAW_CPF_TENANT_ID,
  ALLOWED_NUMBERS = ''
} = process.env;

const COMPANY_ID = (RAW_COMPANY_ID || '').trim();
if (!COMPANY_ID || COMPANY_ID === '00000000-0000-0000-0000-000000000000' || !GUID_REGEX.test(COMPANY_ID)) {
  throw new Error('COMPANY_ID inválido');
}

const CPF_TENANT_ID = (RAW_CPF_TENANT_ID || DEFAULT_CPF_TENANT_ID).trim();
if (!GUID_REGEX.test(CPF_TENANT_ID)) {
  throw new Error('CPF_TENANT_ID inválido');
}

module.exports = {
  apiBaseUrl: API_BASE_URL,
  companyId: COMPANY_ID,
  cpfTenantId: CPF_TENANT_ID,
  // Accept comma-separated list of numbers
  allowedNumbers: ALLOWED_NUMBERS.split(',').map(n => n.trim()).filter(Boolean)
};
