const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
const pino = require('pino');
const logger = pino({ level: 'silent' });

const {
  default: makeWASocket,
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
  DisconnectReason,
} = require('baileys');

const { processMessage, participantUpdate } = require('../autoresbot');
const {
  extractNumbers,
  logWithTime,
  sendMessageWithMentionNotQuoted,
  getSenderType,
} = require('@lib/utils');

// =======================
// Sessions map
// =======================
const sessions = new Map(); // لتخزين كل الجلسات

// =======================
// Delay helper
// =======================
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// =======================
// Connect to WhatsApp
// =======================
async function connectToWhatsApp(folder = 'session') {
  const sessionDir = path.join(process.cwd(), folder);
  if (!fs.existsSync(sessionDir)) fs.mkdirSync(sessionDir, { recursive: true });

  const { state, saveCreds } = await useMultiFileAuthState(sessionDir);
  const { version } = await fetchLatestBaileysVersion();

  const sock = makeWASocket({
    version,
    logger,
    auth: state,
    browser: ['Ubuntu', 'Chrome', '20.0.04'],
  });

  // ⚡ حفظ الجلسة في sessions
  sessions.set(folder, sock);

  // =======================
  // Credentials update
  // =======================
  sock.ev.on('creds.update', saveCreds);

  // =======================
  // Handle incoming messages
  // =======================
  sock.ev.on('messages.upsert', async (m) => {
    try {
      await processMessage(sock, m);
    } catch (err) {
      console.log(chalk.redBright('Error processing message:'), err.message);
    }
  });

  // =======================
  // Handle group participants update
  // =======================
  sock.ev.on('group-participants.update', async (m) => {
    try {
      await participantUpdate(sock, m);
    } catch (err) {
      console.log(chalk.redBright('Error in participant update:'), err.message);
    }
  });

  // =======================
  // Handle incoming calls
  // =======================
  sock.ev.on('call', async (calls) => {
    for (let call of calls) {
      if (!call.isGroup && call.status === 'offer') {
        const callType = call.isVideo ? 'VIDEO' : 'VOICE';
        const userTag = `@${call.from.split('@')[0]}`;
        const statusJid = getSenderType(call.from);
        const messageText = `⚠️ _BOT CANNOT RECEIVE ${callType} CALLS._\n_MAFF ${userTag}, YOU WILL BE BLOCKED._\n_Contact owner for unblock._\nWebsite: autoresbot.com/contact`;
        logWithTime('System', `Call from ${call.from}`);
        await sendMessageWithMentionNotQuoted(sock, call.from, messageText, statusJid);
        await delay(2000);
        await sock.updateBlockStatus(call.from, 'block');
      }
    }
  });

  // =======================
  // Handle connection updates
  // =======================
  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect } = update;

    // =======================
    // Pairing mode (بدل QR)
    // =======================
    if (!sock.authState.creds.registered) {
      const phoneNumber = extractNumbers(folder); // رقم الجلسة
      await delay(1000);
      try {
        const code = await sock.requestPairingCode(phoneNumber.trim());
        const formattedCode = code.slice(0, 4) + '-' + code.slice(4);
        console.log(chalk.blue('📱 PHONE NUMBER: '), chalk.yellow(phoneNumber));
        console.log(chalk.blue('🔑 PAIRING CODE: '), chalk.green(formattedCode));
        console.log(chalk.yellow('Use this code to link WhatsApp without scanning QR.'));
      } catch (err) {
        console.log(chalk.red('Failed to generate pairing code:'), err.message);
      }
    }

    // =======================
    // Connection handling
    // =======================
    if (connection === 'close') {
      const reason = lastDisconnect?.error?.output?.statusCode;
      console.log('Disconnected:', lastDisconnect?.error || 'Unknown reason');

      if (reason !== DisconnectReason.loggedOut) {
        console.log(chalk.yellow('Reconnecting...'));
        await delay(3000);
        await connectToWhatsApp(folder);
      } else {
        console.log(chalk.red('Logged out. Delete session folder and restart.'));
      }
    } else if (connection === 'open') {
      console.log(chalk.green('✅ Connected to WhatsApp successfully!'));
    }
  });

  return sock;
}

module.exports = { connectToWhatsApp, sessions };