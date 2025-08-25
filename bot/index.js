const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const { allowedNumbers } = require('./config');
const registration = require('./flows/registration');
const menu = require('./flows/menu');
const appointment = require('./flows/appointment');

const client = new Client({ authStrategy: new LocalAuth() });

const sessions = {};
const handlers = { ...registration, ...menu, ...appointment };

client.on('qr', qr => {
  qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
  console.log('Bot is ready!');
});

client.on('message', async msg => {
  if (msg.from.endsWith('@g.us')) {
    return;
  }
  const sender = msg.from.split('@')[0];
  if (!allowedNumbers.includes(sender)) {
    return;
  }

  const chatId = msg.from;
  const text = msg.body.trim();

  if (!sessions[chatId]) {
    sessions[chatId] = { step: 'start' };
    await msg.reply('Seja bem-vindo(a), esse número ainda não possui cadastro, você já é cliente?\n1 - Sim\n2 - Não');
    return;
  }

  const session = sessions[chatId];
  const handler = handlers[session.step];

  try {
    if (handler) {
      await handler(session, msg, text, sessions);
    } else {
      await msg.reply('Não entendi. Vamos começar novamente.');
      delete sessions[chatId];
    }
  } catch (err) {
    console.error(err);
    await msg.reply('Ocorreu um erro ao processar sua solicitação.');
    delete sessions[chatId];
  }
});

client.initialize();
