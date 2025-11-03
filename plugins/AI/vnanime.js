const ApiAutoresbot = require("api-autoresbot"); 
// Import autoresbot API client / استيراد عميل API لأوتوريسبوت
const config = require("@config"); 
// Import configuration / استيراد إعدادات التكوين
const { downloadToBuffer } = require("@lib/utils"); 
// Utility function to download file to buffer / دالة مساعدة لتحويل التحميل إلى buffer
const { logCustom } = require("@lib/logger"); 
// Custom logger / مسجل مخصص

async function handle(sock, messageInfo) {
  const { remoteJid, message, content, prefix, command, isQuoted } = messageInfo;
  // Destructure message information / فك خصائص الرسالة

  // Get text from message or quoted message / الحصول على النص من الرسالة أو الرسالة المقتبسة
  const text = content?.trim() || isQuoted?.text?.trim() || null;

  // Validate input / التحقق من صحة النص
  if (!text || text.length < 1) {
    return sock.sendMessage(
      remoteJid,
      {
        text: `_⚠️ Format Usage:_ \n\n_💬 Example:_ _*${prefix}${command} halo google*_`,
      },
      { quoted: message }
    );
  }

  try {
    // Send waiting reaction / إرسال رمز الانتظار🤔 
    await sock.sendMessage(remoteJid, {
      react: { text: "🤔", key: message.key },
    });

    // Call the API / استدعاء API
    const api = new ApiAutoresbot(config.APIKEY);
    const response = await api.get("/api/sound/textanime", { text });

    if (response?.data) {
      // Download API result to buffer / تحميل نتيجة الـ API إلى buffer
      const audioBuffer = await downloadToBuffer(response.data, "mp4");

      // Send as PTT audio / إرسال الصوت كرسالة صوتية
      await sock.sendMessage(
        remoteJid,
        {
          audio: audioBuffer,
          mimetype: "audio/mp4",
          ptt: true,
        },
        { quoted: message }
      );
    } else {
      throw new Error("API response is empty or invalid."); 
      // الرد من الـ API فارغ أو غير صالح
    }
  } catch (error) {
    // Log error / تسجيل الخطأ
    logCustom("error", text, `ERROR-COMMAND-${command}.txt`);
    console.error("⚠️ Error occurred:", error);

    // Notify user of error / إخطار المستخدم بوجود خطأ
    await sock.sendMessage(
      remoteJid,
      {
        text: `Sorry, an error occurred while processing your request. Please try again later.\n\n_${error.message}_`,
      },
      { quoted: message }
    );
  }
}

module.exports = {
  handle,
  Commands: ["vnanime"],     // Command trigger / اسم الأمر
  OnlyPremium: false,         // Not limited to premium users / غير مقيد بالمستخدمين المميزين
  OnlyOwner: false,           // Not limited to owner / غير مقيد بالمالك
};