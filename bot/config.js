require('dotenv').config();

const {
  API_BASE_URL = 'http://localhost:8080',
  ALLOWED_NUMBERS = ''
} = process.env;

module.exports = {
  apiBaseUrl: API_BASE_URL,
  // Accept comma-separated list of numbers
  allowedNumbers: ALLOWED_NUMBERS.split(',').map(n => n.trim()).filter(Boolean)
};
