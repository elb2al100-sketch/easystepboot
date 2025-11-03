/*
⚠️ تحذير / WARNING:
هذا السكريبت **لا يجوز بيعه بأي شكل من الأشكال**
This script **MUST NOT BE SOLD** in any form!

╔══════════════════════════════════════════════╗
║                🛠️ معلومات السكريبت / Script Information           ║
╠══════════════════════════════════════════════╣
║ 📦 النسخة / Version   : 4.2.6                       ║
║ 👨‍💻 المطور / Developer  : Eslam Samo              ║
║ 🌐 الموقع / Website   : https://easystep.life     ║
║ 📲 الرقم / Number     : +201065537938             ║
╚══════════════════════════════════════════════╝

📌 اعتبارًا من 1 نوفمبر 2025:
أصبح سكريبت **easystepbot** رسميًا **مفتوح المصدر** ويمكن استخدامه مجانًا.
Starting from November 1, 2025:
The "easystepbot" script officially becomes **Open Source** and can be used for free.
🔗 https://easystep.life
*/

// ===== استيراد المكتبات / Import Dependencies =====
const moment = require("moment-timezone"); // مكتبة إدارة الوقت بالمناطق الزمنية / Time management with timezone

// ===== إعدادات الاتصال والمالك / Connection & Owner Settings =====
const CONNECTION = "pairing"; // qr أو pairing / QR or pairing
const OWNER_NAME = "easystepbot"; // اسم المالك / Owner Name
const NOMOR_BOT = "2xxxxxxxxxx"; // رقم واتساب البوت / WhatsApp bot number
const DESTINATION = "group"; // نوع الدردشة: group, private, both / Chat destination
const APIKEY = "easystep"; // مفتاح API من autoresbot.com / API key from autoresbot.com
const RATE_LIMIT = 3000; // الحد الأدنى بين الرسائل بالمللي ثانية / Minimum time between messages in ms
const SIMILARITY = true; // البحث عن أوامر مشابهة / Command similarity search
const MODE = "production"; // وضع السكريبت [production, development] / Script mode
const VERSION = global.version; // لا تعدل / Do not edit

const EMAIL = "owner@easystep.life "; // بريد المالك / Owner email
const REGION = "Egypt"; // المنطقة / Region
const WEBSITE = "easystep.life "; // موقع المالك / Owner website
const DATA_OWNER = ["201065537938"]; // أرقام مالك البوت / Owner numbers

// ===== إعدادات الدردشة / Chat Config =====
const ANTI_CALL = true; // حظر المكالمات الخاصة إذا true / Block private calls if true
const AUTO_READ = true; // قراءة الرسائل تلقائيًا / Auto-read messages
const AUTO_BACKUP = false; // نسخ احتياطي تلقائي عند إعادة التشغيل / Auto backup on restart
const MIDNIGHT_RESTART = false; // إعادة تشغيل كل منتصف الليل / Restart at midnight
const PRESENCE_UPDATE = ""; // حالة البوت: unavailable, available, composing, recording, paused / Bot presence
const TYPE_WELCOME = "3"; // نوع رسالة الترحيب / Welcome message type (1-6 text/random)
const BG_WELCOME2 = "https://api.autoresbot.com/api/maker/bg-default"; // خلفية الترحيب / Welcome background image

// ===== إعدادات لوحة التحكم / Panel Config =====
const PANEL_URL = ""; // رابط لوحة التحكم / Panel URL
const PANEL_PLTA = ""; // مفتاح التطبيق / Application key
const PANEL_DESCRIPTION = "Butuh Bantuan Hubungi 628xxxxx"; // وصف لوحة التحكم / Panel description
const PANEL_ID_EGG = 15; // معرف السيرفر / Server Egg ID
const PANEL_ID_LOCATION = 1; // معرف الموقع / Location ID
const PANEL_DEFAULT_DISK = 5120; // حجم التخزين الافتراضي MB / Default disk space in MB
const PANEL_DEFAULT_CPU = 90; // نسبة CPU الافتراضية / Default CPU usage

// ===== إعدادات الكلمات السيئة في المجموعات / Badword Config =====
const BADWORD_WARNING = 3; // عدد التحذيرات قبل الإجراء / Max warnings before action
const BADWORD_ACTION = "both"; // الإجراء بعد التحذير (kick, block, both) / Action after warning

// ===== إعدادات منع السبام في المجموعات / Spam Config =====
const SPAM_LIMIT = 3; // الحد الأعلى للرسائل المتكررة / Max messages before spam
const SPAM_COULDOWN = 10; // مدة الانتظار بالثواني / Cooldown in seconds
const SPAM_WARNING = 3; // عدد التحذيرات قبل الإجراء / Max warnings before action
const SPAM_ACTION = "both"; // الإجراء بعد التحذير (kick, block, both) / Action after warning

// ===== تصدير إعدادات السكريبت / Export Config =====
const config = {
  APIKEY,
  phone_number_bot: NOMOR_BOT,
  type_connection: CONNECTION,
  bot_destination: DESTINATION,
  owner_name: OWNER_NAME,
  owner_number: DATA_OWNER,
  owner_website: WEBSITE,
  owner_email: EMAIL,
  region: REGION,
  version: VERSION,
  rate_limit: RATE_LIMIT,
  status_prefix: true, // يجب استخدام البادئة / Require prefix
  prefix: [".", "!", "#"], // بادئات الأوامر / Command prefixes
  sticker_packname: OWNER_NAME, // اسم حزمة الملصقات / Sticker pack name
  sticker_author: `Date: ${moment.tz("Asia/Jakarta").format("DD/MM/YY")}\nYouTube: Azhari Creative\nOwner: 0852-4615-4386`, // مؤلف الملصقات / Sticker author
  mode: MODE,
  commandSimilarity: SIMILARITY,
  anticall: ANTI_CALL,
  autoread: AUTO_READ,
  autobackup: AUTO_BACKUP,
  PresenceUpdate: PRESENCE_UPDATE,
  typewelcome: TYPE_WELCOME,
  bgwelcome2: BG_WELCOME2,
  midnight_restart: MIDNIGHT_RESTART,
  PANEL: {
    URL: PANEL_URL,
    KEY_APPLICATION: PANEL_PLTA,
    description: PANEL_DESCRIPTION,
    SERVER_EGG: PANEL_ID_EGG,
    id_location: PANEL_ID_LOCATION,
    default_disk: PANEL_DEFAULT_DISK,
    cpu_default: PANEL_DEFAULT_CPU,
  },
  SPAM: {
    limit: SPAM_LIMIT,
    couldown: SPAM_COULDOWN,
    warning: SPAM_WARNING,
    action: SPAM_ACTION,
  },
  BADWORD: {
    warning: BADWORD_WARNING,
    action: BADWORD_ACTION,
  },
};

module.exports = config;