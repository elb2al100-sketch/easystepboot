const ApiAutoresbot = require("api-autoresbot");
const config = require("@config");
const { logCustom } = require("@lib/logger");

async function handle(sock, messageInfo) {
  const { remoteJid, message, prefix, command, content } = messageInfo;

  try {
    // English: Trim content and validate
    // العربية: إزالة المسافات الزائدة والتحقق من المحتوى
    const trimmedContent = content.trim();

    if (!trimmedContent) {
      return await sock.sendMessage(
        remoteJid,
        { text: `_Enter GAME ID | أدخل ID اللعبة_\n\n${prefix + command} 5178789962` },
        { quoted: message }
      );
    }

    // English: Store the user_id from input
    // العربية: تخزين User ID من المدخلات
    const user_id = trimmedContent;
    if (!user_id) {
      return await sock.sendMessage(
        remoteJid,
        { text: `⚠️ _Incorrect format | صيغة خاطئة. استخدم:_\n\n${prefix + command} <user_id>` },
        { quoted: message }
      );
    }

    // English: Send loading reaction
    // العربية: إرسال رد فعل التحميل
    await sock.sendMessage(remoteJid, {
      react: { text: "😎", key: message.key },
    });

    // English: Initialize API
    // العربية: تهيئة API
    const api = new ApiAutoresbot(config.APIKEY);

    // English: Call API to fetch PUBG MOBILE data
    // العربية: استدعاء API للحصول على بيانات PUBG MOBILE
    const response = await api.get("/api/stalker/pubg-mobile", { user_id });

    if (response?.data) {
      const { username } = response.data;

      // English: Format game data
      // العربية: تنسيق بيانات اللعبة
      const gameDataId = `🎮 | *PUBG MOBILE*

◧ User ID | معرف اللاعب : ${user_id}
◧ Username | اسم المستخدم : ${username || "Unknown | غير معروف"}`;

      // English: Send formatted data
      // العربية: إرسال البيانات المنسقة
      await sock.sendMessage(
        remoteJid,
        { text: gameDataId },
        { quoted: message }
      );
      return;
    } else {
      // English: Log error if no data received
      // العربية: تسجيل الخطأ إذا لم يتم استقبال بيانات
      logCustom("info", content, `ERROR-COMMAND-${command}.txt`);

      await sock.sendMessage(
        remoteJid,
        { text: "Sorry, no response from server | عذرًا، لم يتم الحصول على أي استجابة من الخادم." },
        { quoted: message }
      );
      return;
    }
  } catch (error) {
    console.error("Error | خطأ:", error);

    // English: Log error
    // العربية: تسجيل الخطأ
    logCustom("info", content, `ERROR-COMMAND-${command}.txt`);

    // English: Handle error and notify user
    // العربية: معالجة الخطأ وإبلاغ المستخدم
    await sock.sendMessage(
      remoteJid,
      {
        text: `Sorry, an error occurred while processing your request | عذرًا، حدث خطأ أثناء معالجة طلبك.\n\nDetails | التفاصيل: ${
          error.message || error
        }`,
      },
      { quoted: message }
    );
    return;
  }
}

module.exports = {
  handle,
  Commands: ["pubgcek", "pubg"],
  OnlyPremium: false,
  OnlyOwner: false,
  limitDeduction: 1, // English: Deduct 1 limit per use | العربية: خصم 1 من الحد عند الاستخدام
};