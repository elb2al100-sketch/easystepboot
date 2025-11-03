const ApiAutoresbot = require("api-autoresbot"); 
// Import autoresbot API client / استيراد عميل API لأوتوريسبوت
const config = require("@config"); 
// Import configuration / استيراد إعدادات التكوين
const { isURL } = require("@lib/utils"); 
// Utility function to validate URL / دالة للتحقق من صحة الرابط
const mess = require("@mess"); 
// Import general messages / استيراد الرسائل الجاهزة
const { logCustom } = require("@lib/logger"); 
// Custom logger / مسجل مخصص
const { downloadToBuffer } = require("@lib/utils"); 
// Utility function to download file to buffer / دالة لتحويل الملف إلى buffer

// Function to send message quoting original message / دالة لإرسال رسالة مقتبسة
async function sendMessageWithQuote(sock, remoteJid, message, text, options = {}) {
  await sock.sendMessage(remoteJid, { text }, { quoted: message, ...options });
}

async function handle(sock, messageInfo) {
  const { remoteJid, message, content, prefix, command } = messageInfo;
  // Destructure message information / فك خصائص الرسالة

  try {
    // Validate input / التحقق من صحة الرابط
    if (!content.trim() || content.trim() == "") {
      return sendMessageWithQuote(
        sock,
        remoteJid,
        message,
        `_⚠️ Format Usage:_ \n\n_💬 Example:_ _*${prefix + command} https://www.facebook.com/xxx*_`
      );
    }

    if (!isURL(content)) {
      return sendMessageWithQuote(sock, remoteJid, message, `_⚠️ Invalid link_`);
    }

    // Show loading reaction / إرسال رد فعل 🔊 أثناء المعالجة
    await sock.sendMessage(remoteJid, {
      react: { text: "🔊", key: message.key },
    });

    // Initialize API / تهيئة API
    const api = new ApiAutoresbot(config.APIKEY);

    // Call API with parameters / استدعاء API مع المعلمات
    const response = await api.get("/api/downloader/facebook", { url: content });

    // Download file to buffer / تحميل الفيديو إلى buffer
    const audioBuffer = await downloadToBuffer(response.data[0], "mp4");

    // Handle API response / التعامل مع استجابة API
    if (response.code === 200 && response.data) {
      await sock.sendMessage(
        remoteJid,
        {
          video: { url: audioBuffer },
          mimetype: "video/mp4",
          caption: mess.general.success,
        },
        { quoted: message }
      );
    } else {
      logCustom("info", content, `ERROR-COMMAND-${command}.txt`);

      // Handle empty or invalid response / التعامل مع الرد الفارغ أو غير صالح
      const errorMessage =
        response?.message || "Sorry, no response from the server. Please try again later.";
      await sendMessageWithQuote(sock, remoteJid, message, errorMessage);
    }
  } catch (error) {
    console.error("Error calling Autoresbot API:", error);

    logCustom("info", content, `ERROR-COMMAND-${command}.txt`);

    // Handle error and notify user / التعامل مع الأخطاء وإرسال إشعار للمستخدم
    const errorMessage = `Sorry, an error occurred while processing your request. Please try again later.\n\nError Details: ${error.message || error}`;
    await sendMessageWithQuote(sock, remoteJid, message, errorMessage);
  }
}

module.exports = {
  handle,
  Commands: ["fb", "facebook"], // Supported commands / الأوامر المدعومة
  OnlyPremium: false,            // Not limited to premium users / غير مقيد بالمستخدمين المميزين
  OnlyOwner: false,              // Not limited to owner / غير مقيد بالمالك
  limitDeduction: 1,             // Amount to deduct from user limit / مقدار الخصم من حد استخدام المستخدم
};