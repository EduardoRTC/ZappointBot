const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const { allowedNumbers } = require('./config');
const {
  start,
  awaitExistingCPF,
  awaitCPF,
  awaitName
} = require('./flows/registration');
const {
  mainMenu,
  confirmExisting,
  cancelExisting
} = require('./flows/menu');
const {
  service,
  professional,
  date,
  time,
  confirmAppointment
} = require('./flows/appointment');
const { startText } = require('./utils/messages');

const client = new Client({ authStrategy: new LocalAuth() });

const sessions = {};
const handlers = {
  start,
  awaitExistingCPF,
  awaitCPF,
  awaitName,
  mainMenu,
  confirmExisting,
  cancelExisting,
  service,
  professional,
  date,
  time,
  confirmAppointment
};

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
    await msg.reply(startText());
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
