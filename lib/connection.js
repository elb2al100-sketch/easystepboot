// Import required modules / استيراد المكتبات المطلوبة
const config = require("@config");
const fs = require("fs");
const path = require("path");
const chalk = require("chalk");
const {
  default: makeWASocket,
  useMultiFileAuthState,
  getContentType,
  DisconnectReason,
  fetchLatestBaileysVersion,
} = require("baileys");
const EventEmitter = require("events");

const eventBus = new EventEmitter(); // Event bus for global events / ناقل الأحداث للأحداث العامة
const store = {
  contacts: {}, // Store contacts / تخزين جهات الاتصال
};

global.statusConnected = global.statusConnected || {}; // Global connection status / حالة الاتصال العالمية

// Set connection status for a given ID / تعيين حالة الاتصال لمعرف معين
function setStatusConnected(id, status) {
  global.statusConnected = global.statusConnected || {};
  global.statusConnected[id] = !!status; // Ensure true/false only / تأكد أن القيمة true/false فقط
}

const { Boom } = require("@hapi/boom");
const qrcode = require("qrcode-terminal");
const pino = require("pino");
const logger = pino({ level: "silent" });

const { updateSocket } = require("@lib/scheduled");
const { sessions } = require("@lib/cache");
const serializeMessage = require("@lib/serializeMessage");

const { processMessage, participantUpdate } = require("../autoresbot");
const {
  createBackup,
  getnumberbot,
  clearDirectory,
  logWithTime,
  setupSessionDirectory,
  isQuotedMessage,
  removeSpace,
  restaring,
  success,
  danger,
  sleep,
  sendMessageWithMentionNotQuoted,
  validations,
  extractNumbers,
  deleteFolderRecursive,
  getSenderType,
} = require("@lib/utils");

// Clear temporary files / مسح الملفات المؤقتة
clearDirectory("./tmp");

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms)); // Delay helper / دالة تأخير

let qrCount = 0; // Counter for QR code display / عداد لعرض QR
let error403Timestamps = []; // Store timestamps of error 403 / تخزين الطوابع الزمنية للخطأ 403

// Get current timestamp in Jakarta timezone / الحصول على الطابع الزمني الحالي بتوقيت جاكرتا
async function getTimeStamp() {
  const now = new Date();
  const options = { timeZone: "Asia/Jakarta", hour12: false };
  const timeString = now.toLocaleTimeString("id-ID", options);
  return `[${timeString}]`;
}

// Generate a log file path / إنشاء مسار ملف تسجيل
async function getLogFileName() {
  const now = new Date();
  const folder = path.join(process.cwd(), "logs_panel");

  // Create folder if not exists / إنشاء المجلد إذا لم يكن موجود
  if (!fs.existsSync(folder)) {
    fs.mkdirSync(folder, { recursive: true });
  }

  // Format: YYYY-MM-DD_HH-MM.log / صيغة الملف
  return path.join(
    folder,
    `${now.getFullYear()}-${(now.getMonth() + 1)
      .toString()
      .padStart(2, "0")}-` +
      `${now.getDate().toString().padStart(2, "0")}______` +
      `${now.getHours().toString().padStart(2, "0")}-` +
      `${now.getMinutes().toString().padStart(2, "0")}.log`
  );
}

// Debug logging to file / تسجيل معلومات debugging في الملف
async function debugLog(msg) {
  // Ensure input is an object / تأكد أن الإدخال object
  if (typeof msg !== "object" || msg === null) {
    console.error("debugLog only accepts objects / debugLog يقبل فقط object.");
    return;
  }

  const logEntry = `${await getTimeStamp()} DEBUGGING\n${JSON.stringify(
    msg,
    null,
    2
  )}\n----------------- || ------------------\n`;

  const logFile = await getLogFileName();

  try {
    await fs.promises.appendFile(logFile, logEntry);
  } catch (error) {
    console.error(`Failed to write log / فشل في كتابة السجل: ${error.message}`);
  }
}

// Main function to connect WhatsApp / الدالة الرئيسية للاتصال بـ WhatsApp
async function connectToWhatsApp(folder = "session") {
  let phone_number_bot = "";
  const numbersString = extractNumbers(folder);
  const { updateJadibot, getJadibot } = require("@lib/jadibot");
  const dataSession = await getJadibot(numbersString);

  if (dataSession) {
    phone_number_bot = numbersString;
    if (dataSession.status == "stop" || dataSession.status == "logout") {
      return;
    }
  }

  // Validate config.js values / التحقق من إعدادات config.js
  for (const { key, validValues, validate, errorMessage } of validations) {
    const value = config[key]?.toLowerCase();
    if (validValues && !validValues.includes(value)) {
      return danger("Error config.js", errorMessage);
    }
    if (validate && !validate(config[key])) {
      return danger("Error config.js", errorMessage);
    }
  }

  const sessionDir = path.join(process.cwd(), folder);

  const { state, saveCreds } = await useMultiFileAuthState(sessionDir);
  const { version } = await fetchLatestBaileysVersion();

  const sock = makeWASocket({
    version,
    logger: logger,
    printQRInTerminal: false,
    auth: state,
    browser: ["Ubuntu", "Chrome", "20.0.04"],
  });

  // Store session in Map / تخزين الجلسة في Map
  sessions.set(folder, sock);

  // Pairing mode handling / التعامل مع وضعية pairing
  if (
    !sock.authState.creds.registered &&
    config.type_connection.toLowerCase() == "pairing"
  ) {
    if (folder != "session") {
      logWithTime("Jadibot", `Connection "${folder}" disconnected`, "merah");
      return false;
    }
    const phoneNumber = config.phone_number_bot;
    await delay(4000);
    const code = await sock.requestPairingCode(phoneNumber.trim());

    // Format pairing code / تنسيق رمز الـpairing
    const formattedCode = code.slice(0, 4) + "-" + code.slice(4);

    console.log(chalk.blue("PHONE NUMBER: "), chalk.yellow(phoneNumber));
    console.log(chalk.blue("CODE PAIRING: "), chalk.yellow(formattedCode));
  }

  sock.ev.on("creds.update", saveCreds); // Save credentials / حفظ بيانات المصادقة

  try {
    setupSessionDirectory(sessionDir);
  } catch {}

  // Contact update event / حدث تحديث جهات الاتصال
  sock.ev.on("contacts.update", (contacts) => {
    contacts.forEach((contact) => {
      store.contacts[contact.id] = contact;
    });
  });

  // Messages upsert event / حدث وصول الرسائل الجديدة
  sock.ev.on("messages.upsert", async (m) => {
    try {
      eventBus.emit("contactsUpdated", store.contacts);
      const result = serializeMessage(m, sock); // Serialize message / تحويل الرسالة
      if (!result) return;

      const { id, message, remoteJid, command } = result;
      const key = message.key;

      try {
        if (config.autoread) {
          await sock.readMessages([key]); // Auto read / قراءة تلقائية
        }

        const validPresenceUpdates = [
          "unavailable",
          "available",
          "composing",
          "recording",
          "paused",
        ];

        if (validPresenceUpdates.includes(config?.PresenceUpdate)) {
          await sock.sendPresenceUpdate(config.PresenceUpdate, remoteJid);
        }

        await processMessage(sock, result); // Process incoming message / معالجة الرسالة
      } catch (error) {
        console.log(`Error processing message / خطأ في معالجة الرسالة: ${error}`);
      }
    } catch (error) {
      console.log(chalk.redBright(`Error in message upsert / خطأ في message upsert: ${error.message}`));
    }
  });

  // Group participants update / تحديث المشاركين في المجموعات
  sock.ev.on("group-participants.update", async (m) => {
    if (!m || !m.id || !m.participants || !m.action) {
      logWithTime("System", `Invalid participant / مشارك غير صالح`);
      return;
    }
    const messageInfo = {
      id: m.id,
      participants: m.participants,
      action: m.action,
      store,
    };

    try {
      await participantUpdate(sock, messageInfo);
    } catch (error) {
      console.log(chalk.redBright(`Error in participant update / خطأ في participant update: ${error}`));
    }
  });

  // Incoming call handling / التعامل مع المكالمات
  sock.ev.on("call", async (calls) => {
    if (!config.anticall) return;
    for (let call of calls) {
      if (!call.isGroup && call.status === "offer") {
        const callType = call.isVideo ? "VIDEO" : "VOICE";
        const userTag = `@${call.from.split("@")[0]}`;
        const statusJid = getSenderType(call.from);
        const messageText = `⚠️ _BOT CANNOT ACCEPT ${callType} CALLS._\n
_SORRY ${userTag}, YOU WILL BE *BLOCKED*._
_Contact Owner to unblock!_
_Website: autoresbot.com/contact_`;

        logWithTime("System", `Call from ${call.from}`);
        await sendMessageWithMentionNotQuoted(sock, call.from, messageText, statusJid);
        await sleep(2000);
        await sock.updateBlockStatus(call.from, "block"); // Block user / حظر المستخدم
      }
    }
  });

  // Connection update / تحديث حالة الاتصال
  sock.ev.on("connection.update", async (update) => {
    if (sock && sock.user && sock.user.id) {
      global.phone_number_bot = getnumberbot(sock.user.id);
    }

    const { connection, lastDisconnect, qr } = update;

    // QR handling / عرض QR
    if (qr != null && config.type_connection.toLowerCase() == "qr") {
      if (folder != "session") {
        logWithTime("Jadibot", `Connection "${folder}" disconnected`, "merah");
        return false;
      }
      qrCount++;
      logWithTime("System", `Displaying QR / عرض QR`);
      qrcode.generate(qr, { small: true }, (qrcodeStr) => console.log(qrcodeStr));
      success("QR", `Scan the QR code in WhatsApp app! (Try ${qrCount}/5)`);

      if (qrCount >= 5) {
        danger("Timeout / انتهاء الوقت", "Too many QR displays, try again");
        process.exit(0);
      }
    }

    // Connection closed / الاتصال مغلق
    if (connection === "close") {
      setStatusConnected(config.phone_number_bot, false);
      await updateSocket(sock); // Update scheduled / تحديث الجلسة

      sessions.delete(folder);

      let reason = new Boom(lastDisconnect?.error)?.output.statusCode;
      switch (reason) {
        case DisconnectReason.badSession:
          console.log(chalk.redBright(`Bad Session File, restarting...`));
          logWithTime("System", `Bad Session File, restarting...`);
          return await connectToWhatsApp(folder);
        case DisconnectReason.connectionClosed:
          console.log(chalk.redBright(`Connection closed, reconnecting...`));
          logWithTime("System", `Connection closed, reconnecting...`);
          return await connectToWhatsApp(folder);
        case DisconnectReason.connectionLost:
          console.log(chalk.redBright(`Connection lost, reconnecting...`));
          logWithTime("System", `Connection lost, reconnecting...`);
          return await connectToWhatsApp(folder);
        case DisconnectReason.connectionReplaced:
          console.log(chalk.redBright(`Connection replaced, restart bot`));
          logWithTime("System", `Connection replaced, restart bot`);
          if (sock) await sock.logout();
          await delay(4000);
          return await connectToWhatsApp(folder);
        case DisconnectReason.loggedOut:
          console.log(chalk.redBright(`Device logged out, remove session folder and scan again`));
          logWithTime("System", `Device logged out, remove session folder and scan again`);
          if (folder != "session" && phone_number_bot) {
            const { updateJadibot } = require("@lib/jadibot");
            await updateJadibot(phone_number_bot, "logout");
            deleteFolderRecursive(folder);
            const sockSesi = sessions.get(folder);
            if (sockSesi) await sockSesi.ws.close();
          }
          return;
        case DisconnectReason.restartRequired:
          logWithTime("System", `Restart required, restarting...`);
          return await connectToWhatsApp(folder);
        case DisconnectReason.timedOut:
          console.log(chalk.redBright(`Connection timed out, reconnecting...`));
          logWithTime("System", `Connection timed out, reconnecting...`);
          return await connectToWhatsApp(folder);
        default:
          console.log(chalk.redBright(`Unknown DisconnectReason: ${reason}|${connection}`));
          logWithTime("System", `Unknown DisconnectReason: ${reason}|${connection}`);
          return await connectToWhatsApp(folder);
      }
    }

    // Connection open / الاتصال مفتوح
    else if (connection === "open") {
      setStatusConnected(config.phone_number_bot, true);
      const isSession = folder === "session";
      success(isSession ? "System" : "Jadibot", "Connection established / الاتصال متصل");

      if (!isSession && phone_number_bot) {
        const { updateJadibot } = require("@lib/jadibot");
        await updateJadibot(phone_number_bot, "active");
      }

      const isRestart = await restaring();
      if (isRestart && isSession