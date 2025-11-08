const GUID_REGEX = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
require('dotenv').config();

const DEFAULT_CPF_TENANT_ID = 'da314161-d6eb-4db3-8da7-93203718a96c';

const {
  API_BASE_URL = 'http://localhost:5235',
  COMPANY_ID: RAW_COMPANY_ID,
  CPF_TENANT_ID: RAW_CPF_TENANT_ID,
  ALLOWED_NUMBERS = ''
} = process.env;

const COMPANY_ID = (RAW_COMPANY_ID || '').trim();
if (!COMPANY_ID || !GUID_REGEX.test(COMPANY_ID)) {
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
