const ApiAutoresbot = require("api-autoresbot");
const config = require("@config");
const { logCustom } = require("@lib/logger");

async function handle(sock, messageInfo) {
  const { remoteJid, message, prefix, command, content } = messageInfo;

  try {
    const trimmedContent = content.trim();

    // English: Validate empty input
    // العربية: التحقق من إدخال فارغ
    if (!trimmedContent) {
      return await sock.sendMessage(
        remoteJid,
        { text: `_Enter GAME ID | أدخل معرف اللعبة_\n\n${prefix + command} 3806721101` },
        { quoted: message }
      );
    }

    const user_id = trimmedContent;

    // English: Validate correct format
    // العربية: التحقق من صيغة صحيحة
    if (!user_id) {
      return await sock.sendMessage(
        remoteJid,
        {
          text: `⚠️ _Invalid format | الصيغة غير صحيحة. Use | استخدم:_\n\n${prefix + command} <user_id>`,
        },
        { quoted: message }
      );
    }

    // English: Send loading reaction
    // العربية: إرسال رد فعل التحميل
    await sock.sendMessage(remoteJid, {
      react: { text: "😎", key: message.key },
    });

    const api = new ApiAutoresbot(config.APIKEY);

    // English: Call Free Fire API
    // العربية: استدعاء API للعبة Free Fire
    const response = await api.get("/api/stalker/ff", { user_id });

    if (response?.data) {
      const { username } = response.data;

      // English: Prepare response text
      // العربية: تجهيز نص الرد
      const gameDataId = `🎮 | *FREE FIRE | فري فاير*

◧ User ID | معرف المستخدم : ${user_id}
◧ Username | اسم المستخدم : ${username || "Unknown | غير معروف"}`;

      // English: Send response data
      // العربية: إرسال البيانات المستلمة
      await sock.sendMessage(
        remoteJid,
        { text: gameDataId },
        { quoted: message }
      );
    } else {
      // English: Log error if no response
      // العربية: تسجيل الخطأ إذا لم توجد بيانات
      logCustom("info", content, `ERROR-COMMAND-${command}.txt`);

      await sock.sendMessage(
        remoteJid,
        { text: "Sorry, no response from the server | عذرًا، لم يتم استلام رد من الخادم." },
        { quoted: message }
      );
    }
  } catch (error) {
    console.error("Error:", error);

    // English: Log error details
    // العربية: تسجيل تفاصيل الخطأ
    logCustom("info", content, `ERROR-COMMAND-${command}.txt`);

    // English: Send error message to user
    // العربية: إرسال رسالة خطأ للمستخدم
    await sock.sendMessage(
      remoteJid,
      {
        text: `Sorry, an error occurred while processing your request | حدث خطأ أثناء معالجة طلبك. Try again later | حاول مرة أخرى لاحقًا.\n\nDetails | التفاصيل: ${
          error.message || error
        }`,
      },
      { quoted: message }
    );
  }
}

module.exports = {
  handle,
  Commands: ["ffcek", "ff"],
  OnlyPremium: false,
  OnlyOwner: false,
  limitDeduction: 1, // English: Each use deducts 1 limit
                      // العربية: كل استخدام يخصم 1 من الحد اليومي
};