const GUID_REGEX = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

const {
  API_BASE_URL = 'http://localhost:8080',
  COMPANY_ID: RAW_COMPANY_ID,
  ALLOWED_NUMBERS = ''
} = process.env;

const COMPANY_ID = (RAW_COMPANY_ID || '').trim();
if (!COMPANY_ID || COMPANY_ID === '00000000-0000-0000-0000-000000000000' || !GUID_REGEX.test(COMPANY_ID)) {
  throw new Error('COMPANY_ID inválido');
}

module.exports = {
  apiBaseUrl: API_BASE_URL,
  companyId: COMPANY_ID,
  // Accept comma-separated list of numbers
  allowedNumbers: ALLOWED_NUMBERS.split(',').map(n => n.trim()).filter(Boolean)
};
