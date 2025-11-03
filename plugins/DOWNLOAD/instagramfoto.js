const { igdl } = require("btch-downloader"); 
// Instagram downloader function / دالة لتحميل الوسائط من إنستغرام
const mess = require("@mess"); 
// Import general messages / استيراد الرسائل الجاهزة
const { logCustom } = require("@lib/logger"); 
// Custom logger / مسجل مخصص
const { downloadToBuffer } = require("@lib/utils"); 
// Utility function to download file as buffer / دالة لتحويل الملف إلى buffer

/**
 * Send message quoting the original message / إرسال رسالة مقتبسة
 * @param {object} sock - WebSocket connection object / كائن اتصال WebSocket
 * @param {string} remoteJid - Target user ID / معرف المستخدم الهدف
 * @param {object} message - Original message being quoted / الرسالة الأصلية المقتبسة
 * @param {string} text - Text message to send / نص الرسالة المرسل
 */
async function sendMessageWithQuote(sock, remoteJid, message, text) {
  await sock.sendMessage(remoteJid, { text }, { quoted: message });
}

/**
 * Validate if URL is an Instagram URL / التحقق من أن الرابط هو رابط إنستغرام صحيح
 * @param {string} url - URL to validate / الرابط للتحقق منه
 * @returns {boolean} True if valid, false if not / صحيح أم لا
 */
function isIGUrl(url) {
  return /instagram\.com/i.test(url);
}

/**
 * Main handler function to download Instagram media / الدالة الرئيسية لمعالجة طلب تحميل الوسائط من إنستغرام
 * @param {object} sock - WebSocket connection object / كائن اتصال WebSocket
 * @param {object} messageInfo - Message information including content and sender / معلومات الرسالة بما في ذلك المحتوى والمرسل
 */
async function handle(sock, messageInfo) {
  const { remoteJid, message, content, prefix, command } = messageInfo;

  try {
    // Validate input: content must exist and be a valid Instagram URL / التحقق من صحة الرابط
    if (!content?.trim() || !isIGUrl(content)) {
      return sendMessageWithQuote(
        sock,
        remoteJid,
        message,
        `_⚠️ Format Usage:_ \n\n_💬 Example:_ _*${prefix + command} https://www.instagram.com/xxx*_`
      );
    }

    // Show loading reaction / إرسال رد فعل 😎 أثناء المعالجة
    await sock.sendMessage(remoteJid, {
      react: { text: "😎", key: message.key },
    });

    // Call igdl API to get media / استدعاء دالة igdl للحصول على الوسائط
    const response = await igdl(content);

    if (!response || response.length === 0) {
      throw new Error("No media found at the provided URL."); 
      // لا توجد وسائط في الرابط المرسل
    }

    // Get first media item / أخذ أول وسائط من الاستجابة
    const firstMedia = response[0];
    const urlMedia = firstMedia.url;

    // Download file to buffer / تحميل الصورة إلى buffer
    const audioBuffer = await downloadToBuffer(urlMedia, "mp4");

    // Send the image with caption / إرسال الصورة مع رسالة نجاح
    await sock.sendMessage(
      remoteJid,
      { image: audioBuffer, caption: mess.general.success },
      { quoted: message }
    );
  } catch (error) {
    console.error("Error processing Instagram:", error);
    logCustom("info", content, `ERROR-COMMAND-${command}.txt`);

    // Send descriptive error message / إرسال رسالة خطأ واضحة
    const errorMessage = `Sorry, an error occurred while processing your request. Please try again later.\n\n*Error Details:* ${error.message || "Unknown error"}`;
    await sendMessageWithQuote(sock, remoteJid, message, errorMessage);
  }
}

module.exports = {
  handle,
  Commands: ["igfoto", "instagramfoto"], // Supported commands / الأوامر المدعومة
  OnlyPremium: false,                      // Not limited to premium users / غير مقيد بالمستخدمين المميزين
  OnlyOwner: false,                        // Not limited to owner / غير مقيد بالمالك
  limitDeduction: 1,                       // Amount to deduct from user limit / مقدار الخصم من حد استخدام المستخدم
};