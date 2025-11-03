const ApiAutoresbot = require("api-autoresbot");
const config = require("@config");
const { logCustom } = require("@lib/logger");

async function handle(sock, messageInfo) {
  const { remoteJid, message, prefix, command, content } = messageInfo;

  try {
    // English: Trim content and validate
    // العربية: إزالة المسافات الزائدة والتحقق من صحة المحتوى
    const trimmedContent = content.trim();

    if (!trimmedContent) {
      return await sock.sendMessage(
        remoteJid,
        { text: `_Enter GAME ID | أدخل ID اللعبة_\n\n${prefix + command} 427679814 9954` },
        { quoted: message }
      );
    }

    // English: Split content into user_id and server
    // العربية: تقسيم المحتوى إلى user_id و server
    const [user_id, server] = trimmedContent.split(" ");

    if (!user_id || !server) {
      return await sock.sendMessage(
        remoteJid,
        {
          text: `⚠️ _Incorrect format | صيغة خاطئة. استخدم:_\n\n${prefix + command} <user_id> <server>`,
        },
        { quoted: message }
      );
    }

    // English: Send loading reaction
    // العربية: إرسال رد فعل التحميل
    await sock.sendMessage(remoteJid, {
      react: { text: "⏰", key: message.key },
    });

    // English: Initialize API
    // العربية: تهيئة API
    const api = new ApiAutoresbot(config.APIKEY);

    // English: Call API to fetch Mobile Legend data
    // العربية: استدعاء API للحصول على بيانات Mobile Legend
    const response = await api.get("/api/stalker/ml", { user_id, server });

    if (response?.data) {
      const { username, this_login_country } = response.data;

      // English: Format game data for sending
      // العربية: تنسيق بيانات اللعبة للإرسال
      const gameDataId = `🎮 | *MOBILE LEGEND*

◧ User ID | معرف اللاعب : ${user_id}
◧ Server | السيرفر : ${server}
◧ Username | اسم المستخدم : ${username || "Unknown | غير معروف"}
◧ Country | الدولة : ${this_login_country || "Not available | غير متوفر"}`;

      // English: Send formatted data
      // العربية: إرسال البيانات المنسقة
      await sock.sendMessage(
        remoteJid,
        { text: gameDataId },
        { quoted: message }
      );
    } else {
      // English: Log error if no data received
      // العربية: تسجيل الخطأ إذا لم يتم استقبال بيانات
      logCustom("info", content, `ERROR-COMMAND-${command}.txt`);

      await sock.sendMessage(
        remoteJid,
        { text: "Sorry, no response from server | عذرًا، لم يتم الحصول على أي استجابة من الخادم." },
        { quoted: message }
      );
    }
  } catch (error) {
    console.error("Error | خطأ:", error);
    logCustom("info", content, `ERROR-COMMAND-${command}.txt`);

    // English: Handle error and notify user
    // العربية: معالجة الخطأ وإبلاغ المستخدم
    await sock.sendMessage(
      remoteJid,
      {
        text: `Sorry, an error occurred while processing your request | عذرًا، حدث خطأ أثناء معالجة طلبك.\n\nDetails | التفاصيل: ${error.message || error}`,
      },
      { quoted: message }
    );
  }
}

module.exports = {
  handle,
  Commands: ["ml", "mlcek"],
  OnlyPremium: false,
  OnlyOwner: false,
  limitDeduction: 1, // English: Deduct 1 limit per use | العربية: خصم 1 من الحد عند الاستخدام
};