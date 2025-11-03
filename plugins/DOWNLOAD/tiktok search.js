const { tiktokSearch } = require("@scrape/tiktok");
// TikTok search API / مكتبة للبحث عن فيديوهات TikTok
const { logCustom } = require("@lib/logger");
// Logger / مسجل للأخطاء
const { downloadToBuffer } = require("@lib/utils");
// Utility to download files to Buffer / أداة لتحويل الملفات إلى Buffer

/**
 * Send a message quoting the original message / إرسال رسالة مقتبسة
 */
async function sendMessageWithQuote(sock, remoteJid, message, text) {
  await sock.sendMessage(remoteJid, { text }, { quoted: message });
}

/**
 * Main handler for TikTok search command / الدالة الرئيسية لمعالجة أمر البحث في TikTok
 */
async function handle(sock, messageInfo) {
  const { remoteJid, message, content, prefix, command } = messageInfo;

  try {
    // Validate input / التحقق من النص المرسل
    if (!content.trim() || content.trim() == "") {
      return sendMessageWithQuote(
        sock,
        remoteJid,
        message,
        `_⚠️ Format Usage:_ \n\n_💬 Example:_ _*${prefix + command} cute cat*_`
      );
    }

    // Show "Loading" reaction / إرسال رد فعل أثناء التحميل
    await sock.sendMessage(remoteJid, {
      react: { text: "😎", key: message.key },
    });

    // Call TikTok search API / استدعاء API للبحث في TikTok
    const response = await tiktokSearch(content);

    // Download video to Buffer / تحميل الفيديو إلى Buffer
    const videoBuffer = await downloadToBuffer(response.no_watermark, "mp4");

    // Send video without watermark and with caption / إرسال الفيديو بدون العلامة المائية مع العنوان
    await sock.sendMessage(
      remoteJid,
      {
        video: videoBuffer,
        caption: response.title,
      },
      { quoted: message }
    );
  } catch (error) {
    console.error("Error processing TikTok search command:", error);
    logCustom("info", content, `ERROR-COMMAND-${command}.txt`);

    // Send descriptive error message / إرسال رسالة خطأ واضحة
    const errorMessage = `Sorry, an error occurred while processing your request. Please try again later.\n\n*Error Details:* ${
      error.message || error
    }`;
    await sendMessageWithQuote(sock, remoteJid, message, errorMessage);
  }
}

module.exports = {
  handle,
  Commands: ["tiktoksearch", "ttsearch", "tts"], // Supported commands / الأوامر المدعومة
  OnlyPremium: false,
  OnlyOwner: false,
  limitDeduction: 1, // Daily limit deduction / مقدار الخصم من الحد اليومي
};