'use strict';
require('dotenv').config();

const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const { allowedNumbers } = require('./config');

const {
  start,
  awaitExistingCPF,
  awaitCPF,
  awaitName,
  confirmClient
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

client.on('qr', qr => {
  qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
  console.log('Bot is ready!');
});

client.on('message', async msg => {
  try {
    const sender = (msg.author || msg.from).split('@')[0];

    // Ignora grupos
    if (msg.from.endsWith('@g.us')) {
      console.log(`Mensagem de ${sender} enviada de um grupo IGNORADA`);
      return;
    }

    // Whitelist simples
    if (!allowedNumbers.includes(sender)) {
      console.log(`Mensagem de numero ${sender} IGNORADA Não é whitelisted`);
      return;
    }
    console.log(`Mensagem de numero ${sender} permitido`);

    const chatId = msg.from;
    const text = (msg.body || '').trim();

    // Cria sessão e manda menu inicial
    if (!sessions[chatId]) {
      sessions[chatId] = { step: 'start' };
      await msg.reply(startText());
      return;
    }

    const session = sessions[chatId];
    const handler = handlers[session.step];

    if (handler) {
      await handler(session, msg, text, sessions);
    } else {
      await msg.reply('Não entendi. Vamos começar novamente.');
      delete sessions[chatId];
    }
  } catch (err) {
    console.error(err);
    try {
      await msg.reply('Ocorreu um erro ao processar sua solicitação.');
    } catch {}
    delete sessions[msg.from];
  }
});

client.initialize();
