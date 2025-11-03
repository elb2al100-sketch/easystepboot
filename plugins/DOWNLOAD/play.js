const yts = require("yt-search");
// Library to search YouTube / مكتبة للبحث في YouTube
const ApiAutoresbot = require("api-autoresbot");
// API client for Autoresbot / عميل API الخاص بـ Autoresbot
const config = require("@config");
// Configuration / إعدادات
const { logCustom } = require("@lib/logger");
// Logger / مسجل للأخطاء
const { downloadToBuffer } = require("@lib/utils");
// Utility to download media to buffer / دالة لتحميل الملفات إلى Buffer

/**
 * Send a message quoting the original message / إرسال رسالة مقتبسة
 */
async function sendMessageWithQuote(sock, remoteJid, message, text) {
  return sock.sendMessage(remoteJid, { text }, { quoted: message });
}

/**
 * Send reaction to a message / إرسال رد فعل على الرسالة
 */
async function sendReaction(sock, message, reaction) {
  return sock.sendMessage(message.key.remoteJid, {
    react: { text: reaction, key: message.key },
  });
}

/**
 * Search YouTube for the first matching video / البحث عن أول فيديو مطابق على YouTube
 */
async function searchYouTube(query) {
  const searchResults = await yts(query);
  return (
    searchResults.all.find((item) => item.type === "video") ||
    searchResults.all[0]
  );
}

/**
 * Main handler to download YouTube audio / الدالة الرئيسية لتحميل صوتيات YouTube
 */
async function handle(sock, messageInfo) {
  const { remoteJid, message, content, prefix, command } = messageInfo;

  try {
    const query = content.trim();

    // Validate input / التحقق من النص المرسل
    if (!query) {
      return sendMessageWithQuote(
        sock,
        remoteJid,
        message,
        `_⚠️ Format Usage:_ \n\n_💬 Example:_ _*${prefix + command} matahariku*_`
      );
    }

    // Show "Loading" reaction / إرسال رد فعل "جارٍ التحميل" 🎶
    await sendReaction(sock, message, "🎶");

    // Search YouTube / البحث في YouTube
    const video = await searchYouTube(query);

    if (!video || !video.url) {
      return sendMessageWithQuote(
        sock,
        remoteJid,
        message,
        "⛔ _Cannot find a matching video_ / لا يمكن العثور على الفيديو المطلوب"
      );
    }

    // Check if video is too long / التحقق من طول الفيديو
    if (video.seconds > 3600) {
      return sendMessageWithQuote(
        sock,
        remoteJid,
        message,
        "_Sorry, the video is too long to send via WhatsApp_ / الفيديو طويل جدًا للإرسال عبر واتساب"
      );
    }

    // Video info caption / وصف معلومات الفيديو
    const caption = `*YOUTUBE DOWNLOADER*\n\n◧ Title: ${video.title}\n◧ Duration: ${video.timestamp}\n◧ Uploaded: ${video.ago}\n◧ Views: ${video.views}\n◧ Description: ${video.description}`;

    // Initialize API / تهيئة API
    const api = new ApiAutoresbot(config.APIKEY);

    // Get audio link / جلب رابط الصوت
    const response = await api.get("/api/downloader/ytplay", {
      url: video.url,
      format: "m4a",
    });

    if (response && response.status) {
      const url_media = response.data.url;

      // Send thumbnail image / إرسال صورة الغلاف
      await sock.sendMessage(
        remoteJid,
        { image: { url: video.thumbnail }, caption },
        { quoted: message }
      );

      // Download audio file to buffer / تحميل الملف الصوتي إلى Buffer
      const audioBuffer = await downloadToBuffer(url_media, "mp3");

      // Send audio / إرسال الملف الصوتي
      await sock.sendMessage(
        remoteJid,
        {
          audio: audioBuffer,
          fileName: `yt.mp3`,
          mimetype: "audio/mp4",
        },
        { quoted: message }
      );
    } else {
      // React with error if API fails / رد فعل عند فشل API
      await sendReaction(sock, message, "❗");
    }
  } catch (error) {
    console.error("Error while handling command:", error);
    logCustom("info", content, `ERROR-COMMAND-${command}.txt`);

    const errorMessage = `⚠️ Sorry, an error occurred while processing your request. Please try again later.\n\n💡 Details: ${error.message || error}`;
    await sendMessageWithQuote(sock, remoteJid, message, errorMessage);
  }
}

module.exports = {
  handle,
  Commands: ["play"], // Command name / اسم الأمر
  OnlyPremium: false, // Not restricted to premium users / غير مقيد بالمميزين
  OnlyOwner: false,   // Not restricted to owner / غير مقيد بالمالك
  limitDeduction: 1,  // Amount deducted from user's limit / مقدار الخصم من الحد اليومي
};