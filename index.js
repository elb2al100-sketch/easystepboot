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

// ===== بدء تشغيل التطبيق / Start App =====
console.log(`[✔] Start App ...`);

// ===== التحقق من نسخة Node.js المطلوبة / Ensure Node.js version 20 =====
const [major] = process.versions.node.split(".").map(Number);

if (major < 20 || major >= 21) {
  console.error(`❌ هذا السكريبت متوافق فقط مع Node.js نسخة 20.x`);
  console.error(
    `ℹ️ إذا كنت تشغل السكريبت عبر لوحة التحكم، افتح قائمة *Startup* ثم غيّر *Docker Image* إلى Node.js 20`
  );

  // الانتظار 60 ثانية قبل الإغلاق / Wait 60 seconds before exit
  setTimeout(() => {
    process.exit(1);
  }, 60_000);
  return;
}

// ===== إعداد المنطقة الزمنية / Set Default Timezone =====
process.env.TZ = "Asia/Jakarta"; // المنطقة الزمنية الرئيسية / Primary timezone

// ===== تسجيل المسارات / Module Aliases =====
require("module-alias/register");
require("@lib/version");

// ===== استيراد الأدوات / Import Utilities =====
const { checkAndInstallModules } = require("@lib/utils");
const config = require("@config");
const axios = require("axios");

// ===== تشغيل التطبيق بشكل غير متزامن / Async App Startup =====
(async () => {
  try {
    // التحقق من وجود جميع الحزم المطلوبة وتثبيتها إذا لزم الأمر
    // Check and install required npm modules
    await checkAndInstallModules([
      "wa-sticker-formatter",
      "follow-redirects",
      "qrcode-reader",
      "jimp",
      "baileys@6.7.18",
      "api-autoresbot@1.0.6",
    ]);

    // استدعاء دالة بدء التطبيق / Start app function
    const { start_app } = require("@lib/startup");
    await start_app();
  } catch (err) {
    console.error("❌ خطأ أثناء start_app / Error during start_app:", err.message);
    await reportCrash("inactive");
    process.exit(1);
  }
})();

// ===== إعداد رقم البوت / Bot Number =====
const BOT_NUMBER = config.phone_number_bot || "";

// ===== دالة للإبلاغ عن توقف البوت / Crash Report Function =====
async function reportCrash(status) {
  // مثال على الرابط للإبلاغ / Example report URL
  // const reportUrl = `https://autoresbot.com/api/sewabot/${BOT_NUMBER}/status?status=${encodeURIComponent(status)}`;
  // try {
  //   await axios.get(reportUrl);
  //   console.log('✅ تم إرسال تقرير التوقف بنجاح / Crash report sent successfully.');
  // } catch (err) {
  //   console.error('❌ فشل إرسال تقرير التوقف / Failed to send crash report:', err.message);
  // }
}

// ─── معالجة الأخطاء غير المعالجة / Error Handlers ─────────────────────────────
process.on("uncaughtException", async (err) => {
  console.error("❌ استثناء غير معالج / Uncaught Exception:", err);
  await reportCrash("inactive");
  process.exit(1);
});

process.on("unhandledRejection", async (reason, promise) => {
  console.error("❌ رفض غير معالج / Unhandled Rejection:", reason);
  await reportCrash("inactive");
  process.exit(1);
});