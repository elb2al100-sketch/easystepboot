const ApiAutoresbot = require("api-autoresbot");
// Autoresbot API library / مكتبة Autoresbot
const config = require("@config");
// Configuration / الإعدادات
const mess = require("@mess");
// General messages / الرسائل العامة
const { extractLink } = require("@lib/utils");
// Utility to extract URL from text / أداة لاستخراج الرابط من النص
const { logCustom } = require("@lib/logger");
// Logger / مسجل الأخطاء
const { downloadToBuffer } = require("@lib/utils");
// Utility to download file to Buffer / أداة لتحويل الملف إلى Buffer

/**
 * Send a message quoting the original message
 * إرسال رسالة مقتبسة
 * @param {object} sock - WhatsApp connection instance / كائن الاتصال بـ WhatsApp
 * @param {string} remoteJid - Recipient's ID / معرف المستلم
 * @param {object} message - Original message to quote / الرسالة الأصلية للاقتباس
 * @param {string} text - Text to send / النص المراد إرساله
 */
async function sendMessageWithQuote(sock, remoteJid, message, text) {
  await sock.sendMessage(remoteJid, { text }, { quoted: message });
}

/**
 * Main handler for YT MP4 downloader command
 * الدالة الرئيسية لمعالجة أمر تنزيل فيديو YouTube بصيغة MP4
 */
async function handle(sock, messageInfo) {
  const { remoteJid, message, content, prefix, command } = messageInfo;

  try {
    // Extract URL from user input / استخراج الرابط من النص
    const validLink = extractLink(content);

    // Validate input / التحقق من صحة المدخلات
    if (!content.trim() || content.trim() === "") {
      return sendMessageWithQuote(
        sock,
        remoteJid,
        message,
        `_⚠️ Format Usage / صيغة الاستخدام:_ \n\n_💬 Example / مثال:_ _*${prefix + command} https://www.youtube.com/watch?v=xxxxx*_`
      );
    }

    // Show "Processing" reaction / عرض رد فعل أثناء المعالجة
    await sock.sendMessage(remoteJid, {
      react: { text: "😎", key: message.key },
    });

    // Initialize API / تهيئة API
    const api = new ApiAutoresbot(config.APIKEY);

    // Call API to download video / استدعاء API لتنزيل الفيديو
    const response = await api.get("/api/downloader/ytmp4", { url: validLink });

    // Validate API response / التحقق من استجابة API
    if (response.status) {
      const url_media = response.data.url;

      // Download video to buffer / تحميل الفيديو إلى Buffer
      const videoBuffer = await downloadToBuffer(url_media, "mp4");

      // Send video / إرسال الفيديو
      await sock.sendMessage(
        remoteJid,
        {
          video: videoBuffer,
          caption: mess.general.success,
        },
        { quoted: message }
      );
    } else {
      // Log if API response failed / تسجيل الخطأ إذا فشلت استجابة API
      logCustom("info", content, `ERROR-COMMAND-${command}.txt`);

      // Notify user if no video URL / إعلام المستخدم إذا لم يتم العثور على رابط الفيديو
      await sendMessageWithQuote(
        sock,
        remoteJid,
        message,
        "Maaf, tidak dapat menemukan audio/video dari URL yang Anda berikan. / عذراً، لم يمكن العثور على فيديو من الرابط المرسل."
      );
    }
  } catch (error) {
    // Handle errors and log / معالجة الأخطاء وتسجيلها
    console.error("Error calling Autoresbot API / خطأ عند استدعاء API Autoresbot:", error);
    logCustom("info", content, `ERROR-COMMAND-${command}.txt`);

    // Send informative error message / إرسال رسالة خطأ مفصلة
    const errorMessage = `Maaf, terjadi kesalahan saat memproses permintaan Anda. Mohon coba lagi nanti. / عذراً، حدث خطأ أثناء معالجة طلبك. يرجى المحاولة لاحقاً.\n\nDetail Error / تفاصيل الخطأ: ${error.message || error}`;
    await sendMessageWithQuote(sock, remoteJid, message, errorMessage);
  }
}

module.exports = {
  handle,
  Commands: ["ytmp4"], // Command processed by this handler / الأمر الذي يعالجه هذا الهاندلر
  OnlyPremium: false,
  OnlyOwner: false,
  limitDeduction: 1, // Number of limits to deduct / عدد الخصومات من الحد اليومي
};