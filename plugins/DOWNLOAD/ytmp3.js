const ApiAutoresbot = require("api-autoresbot");
// Autoresbot API / مكتبة API الخاصة بـ Autoresbot
const config = require("@config");
// Configuration / الإعدادات
const { extractLink } = require("@lib/utils");
// Extract URL from text / استخراج الرابط من النص
const { logCustom } = require("@lib/logger");
// Logger for errors / مسجل الأخطاء
const { downloadToBuffer } = require("@lib/utils");
// Utility to download file to buffer / أداة لتحميل الملف إلى Buffer

/**
 * Send a message quoting the original message / إرسال رسالة مقتبسة
 */
async function sendMessageWithQuote(sock, remoteJid, message, text) {
  await sock.sendMessage(remoteJid, { text }, { quoted: message });
}

/**
 * Main handler for YT MP3 downloader command / الدالة الرئيسية لمعالجة أمر تنزيل صوت من فيديو YouTube
 */
async function handle(sock, messageInfo) {
  const { remoteJid, message, content, prefix, command } = messageInfo;

  try {
    const validLink = extractLink(content);

    // Validate input / التحقق من صحة المدخلات
    if (!content.trim() || content.trim() === "") {
      return sendMessageWithQuote(
        sock,
        remoteJid,
        message,
        `_⚠️ Format Usage:_ \n\n_💬 Example:_ _*${prefix + command} https://www.youtube.com/watch?v=xxxxx*_`
      );
    }

    // Show "Loading" reaction / عرض رد فعل أثناء التحميل
    await sock.sendMessage(remoteJid, {
      react: { text: "😎", key: message.key },
    });

    // Initialize API with APIKEY / تهيئة API باستخدام مفتاح API
    const api = new ApiAutoresbot(config.APIKEY);

    // Call API to download audio / استدعاء API لتحميل الصوت
    const response = await api.get("/api/downloader/ytplay", {
      url: validLink,
      format: "m4a",
    });

    // Validate API response / التحقق من استجابة API
    if (response.status) {
      const url_media = response.data.url;

      // Download file to buffer / تحميل الملف إلى Buffer
      const audioBuffer = await downloadToBuffer(url_media, "mp3");

      // Send audio file / إرسال ملف الصوت
      await sock.sendMessage(
        remoteJid,
        {
          audio: audioBuffer,
          mimetype: "audio/mp4",
        },
        { quoted: message }
      );
    } else {
      logCustom("info", content, `ERROR-COMMAND-${command}.txt`);
      // Notify user if no audio URL / إعلام المستخدم إذا لم يتم العثور على رابط الصوت
      await sendMessageWithQuote(
        sock,
        remoteJid,
        message,
        "Sorry, unable to find audio from the URL you provided. / عذراً، لم يمكن العثور على صوت من الرابط المرسل."
      );
    }
  } catch (error) {
    // Handle errors and log them / معالجة الأخطاء وتسجيلها
    console.error("Error calling Autoresbot API:", error);
    logCustom("info", content, `ERROR-COMMAND-${command}.txt`);

    // Send informative error message / إرسال رسالة خطأ مفصلة
    const errorMessage = `Sorry, an error occurred while processing your request. Please try again later.\n\n*Error Details:* ${
      error.message || error
    }`;
    await sendMessageWithQuote(sock, remoteJid, message, errorMessage);
  }
}

module.exports = {
  handle,
  Commands: ["ytmp3"], // Supported command / الأمر المدعوم
  OnlyPremium: false,
  OnlyOwner: false,
  limitDeduction: 1, // Daily limit deduction / الخصم من الحد اليومي
};