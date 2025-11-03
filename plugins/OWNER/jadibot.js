const fs = require('fs');
const path = require('path');
const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion } = require('baileys');
const { Boom } = require("@hapi/boom");
const qrcode = require('qrcode-terminal');
const pino = require("pino");
const logger = pino({ level: "silent" });
const { logWithTime, success, danger, deleteFolderRecursive } = require('@lib/utils');
const { sessions } = require('@lib/cache');

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

const SESSION_PATH = './session/';

/**
 * Starts a new WhatsApp session for a number
 * / بدء جلسة جديدة على WhatsApp لرقم معين
 */
async function startNewSession(masterSessions, senderId, type_connection) {
    logWithTime('System', `Starting startNewSession`, 'red');
    const sessionFolder = path.join(SESSION_PATH, senderId);

    if (!fs.existsSync(sessionFolder)) {
        await fs.promises.mkdir(sessionFolder, { recursive: true });
    }

    const { state, saveCreds } = await useMultiFileAuthState(sessionFolder);
    const { version } = await fetchLatestBaileysVersion();

    const sock = makeWASocket({
        version,
        logger: logger,
        printQRInTerminal: false,
        auth: state,
        browser: ["Ubuntu", "Chrome", "20.0.04"],
    });

    // If the bot is not registered and using pairing, generate pairing code
    if (!sock.authState.creds.registered && type_connection === 'pairing') {
        const phoneNumber = senderId;
        await delay(4000);
        const code = await sock.requestPairingCode(phoneNumber.trim());
        logWithTime('System', `Pairing Code : ${code}`);
        const textResponse = `⏳ _Jadibot ${senderId}_\n
_Code Pairing:_ ${code}`;
        await masterSessions.sock.sendMessage(masterSessions.remoteJid, { text: textResponse }, { quoted: masterSessions.message });
    }

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on("connection.update", async (update) => {
        const { connection, lastDisconnect, qr } = update;

        // Display QR code if required
        if (qr && type_connection === 'qr') {
            logWithTime('System', `Displaying QR`);
            await masterSessions.sock.sendMessage(masterSessions.remoteJid, { text: 'Displaying QR' }, { quoted: masterSessions.message });
            qrcode.generate(qr, { small: true }, (qrcodeStr) => console.log(qrcodeStr));
        }

        // Handle connection close
        if (connection === 'close') {
            const reason = new Boom(lastDisconnect?.error)?.output?.statusCode || 'Unknown';
            const reasonMessages = {
                [DisconnectReason.badSession]: 'Bad Session File, Start Again ...',
                [DisconnectReason.connectionClosed]: 'Connection closed, reconnecting...',
                [DisconnectReason.connectionLost]: 'Connection Lost from Server, reconnecting...',
                [DisconnectReason.connectionReplaced]: 'Connection Replaced, Another New Session Opened',
                [DisconnectReason.loggedOut]: 'Device Logged Out, Please Re-scan/Pair',
                [DisconnectReason.restartRequired]: 'Restart Required, Restarting...',
                [DisconnectReason.timedOut]: 'Connection TimedOut, Reconnecting...'
            };

            const message = reasonMessages[reason] || `Unknown DisconnectReason: ${reason}`;

            // Handle logged out
            if (reason === DisconnectReason.loggedOut) {
                const sessionPath = path.join(SESSION_PATH, senderId);
                if (fs.existsSync(sessionPath)) {
                    deleteFolderRecursive(sessionPath);
                    await masterSessions.sock.sendMessage(
                        masterSessions.remoteJid,
                        { text: `✅ _Device logged out. Please type .jadibot again._` },
                        { quoted: masterSessions.message }
                    );
                }
            }

            // Handle restart required
            if (reason === DisconnectReason.restartRequired) {
                logWithTime('System', message);
                if (sock) await sock.ws.close();
                const { connectToWhatsApp } = require('@lib/connection');
                await connectToWhatsApp(`session/${senderId}`);
            } else if (reason === 405) {
                const { updateJadibot } = require('@lib/jadibot');
                await updateJadibot(senderId, 'inactive');
                await masterSessions.sock.sendMessage(
                    masterSessions.remoteJid,
                    { text: `⚠️ _There is an issue connecting to the socket_\n\n_Please type *.stopjadibot* to stop and try again_` },
                    { quoted: masterSessions.message }
                );
                return;
            } else {
                danger('Jadibot', message);
            }
        }

        // Handle successful connection
        if (connection === 'open') {
            success('System', 'JADIBOT CONNECTED');
            const { updateJadibot } = require('@lib/jadibot');
            await updateJadibot(senderId, 'active');
            await masterSessions.sock.sendMessage(
                masterSessions.remoteJid,
                { text: `✅ _Success! Number *${senderId}* is now a bot._` },
                { quoted: masterSessions.message }
            );
            if (sock) {
                await sock.ws.close();
                const { connectToWhatsApp } = require('@lib/connection');
                await connectToWhatsApp(`session/${senderId}`);
            }
        }
    });

    return sock;
}

/**
 * Handles the "jadibot" command
 * / معالجة أمر "jadibot"
 */
async function handle(sock, messageInfo) {
    const { remoteJid, message, prefix, command, content } = messageInfo;

    // Validate input: content must exist / التحقق من الإدخال: يجب أن يكون هناك محتوى
    if (!content) {
        await sock.sendMessage(
            remoteJid,
            {
                text: `_⚠️ Usage Format:_\n\n_💬 Example:_ _*${prefix + command} 6285246154386*_\n\n_Type *${prefix}stopjadibot* to stop_`
            },
            { quoted: message }
        );
        return;
    }

    // Extract phone number / استخراج رقم الهاتف
    let targetNumber = content.replace(/\D/g, ''); // Numbers only / أرقام فقط

    // Validate phone number length / التحقق من طول الرقم
    if (targetNumber.length < 10 || targetNumber.length > 15) {
        await sock.sendMessage(remoteJid, { text: `⚠️ Invalid number.` }, { quoted: message });
        return;
    }

    // Append WhatsApp domain if missing / إضافة النطاق إذا لم يكن موجود
    if (!targetNumber.endsWith('@s.whatsapp.net')) {
        targetNumber += '@s.whatsapp.net';
    }

    // Validate if number exists on WhatsApp / التحقق من تسجيل الرقم على WhatsApp
    const result = await sock.onWhatsApp(targetNumber);
    if (!result || result.length === 0 || !result[0].exists) {
        await sock.sendMessage(remoteJid, { text: `⚠️ Number not registered on WhatsApp.` }, { quoted: message });
        return;
    }

    const type_connection = 'pairing';

    try {
        // Send loading reaction / إرسال رمز انتظار
        await sock.sendMessage(remoteJid, { react: { text: '🤌🏻', key: message.key } });

        // Prepare session folder / التأكد من مجلد الجلسة
        const senderId = targetNumber.replace('@s.whatsapp.net', '');
        const sessionPath = path.join(SESSION_PATH, senderId);

        // Update bot status to inactive / تحديث حالة البوت إلى غير نشط
        const { updateJadibot } = require('@lib/jadibot');
        await updateJadibot(senderId, 'inactive');

        // Remove existing active session / حذف الجلسة النشطة
        const sockSesi = sessions.get(`session/${senderId}`);
        if (sockSesi) {
            const { updateJadibot } = require('@lib/jadibot');
            await updateJadibot(senderId, 'stop');
            await sockSesi.ws.close();
            sessions.delete(`session/${senderId}`);
        }

        // Start new session / بدء جلسة جديدة
        if (fs.existsSync(sessionPath)) {
            logWithTime(`Reload Session for ${senderId}`, message);