module.exports = {
  apiBaseUrl: process.env.API_BASE_URL || 'http://localhost:3000',
  companyId: process.env.COMPANY_ID || '00000000-0000-0000-0000-000000000000',
  // Update with the phone numbers (digits only) that the bot should respond to
  allowedNumbers: [
    process.env.ALLOWED_NUMBER || '5511999999999'
  ]
};
