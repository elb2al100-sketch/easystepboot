const { downloadQuotedMedia, downloadMedia, reply } = require("@lib/utils");
const fs = require("fs");
const path = require("path");
const mess = require("@mess");
const ApiAutoresbot = require("api-autoresbot");
const config = require("@config");

/**
 * Handle the wanted poster command
 * معالجة أمر تحويل الصورة إلى ملصق Wanted
 */
async function handle(sock, messageInfo) {
  const { m, remoteJid, message, content, prefix, command, type, isQuoted } =
    messageInfo;

  try {
    // Determine media type (image or not)
    // تحديد نوع الوسائط (صورة أو غير ذلك)
    const mediaType = isQuoted ? isQuoted.type : type;
    if (mediaType !== "image") {
      return await reply(
        m,
        `⚠️ _Send/Reply an image with caption *${prefix + command}*_`
        // ⚠️ _أرسل/رد على صورة مع التعليق *${prefix + command}*_
      );
    }

    // Show "Loading" reaction
    // إظهار رد فعل "جارٍ التحميل"
    await sock.sendMessage(remoteJid, {
      react: { text: "😇", key: message.key },
    });

    // Download media
    // تحميل الصورة
    const media = isQuoted
      ? await downloadQuotedMedia(message)
      : await downloadMedia(message);
    const mediaPath = path.join("tmp", media);

    if (!fs.existsSync(mediaPath)) {
      throw new Error("Media file not found after download.");
      // لم يتم العثور على ملف الوسائط بعد التحميل
    }

    // Initialize API
    // تهيئة واجهة API
    const api = new ApiAutoresbot(config.APIKEY);

    // Upload the image temporarily
    // رفع الصورة مؤقتًا إلى API
    const response = await api.tmpUpload(mediaPath);

    if (!response || response.code !== 200) {
      throw new Error("File upload failed or no URL returned.");
      // فشل رفع الملف أو لم يتم إرجاع رابط
    }

    const url = response.data.url;

    // Get the "wanted poster" image as Buffer
    // الحصول على الصورة المعدلة كـ Buffer
    const MediaBuffer = await api.getBuffer("/api/maker/wanted", { url });

    if (!Buffer.isBuffer(MediaBuffer)) {
      throw new Error("Invalid response: Expected Buffer.");
      // استجابة غير صالحة: كان متوقع Buffer
    }

    // Send the processed image
    // إرسال الصورة الناتجة
    await sock.sendMessage(
      remoteJid,
      {
        image: MediaBuffer,
        caption: mess.general.success, // رسالة نجاح عامة
      },
      { quoted: message }
    );
  } catch (error) {
    console.error("Error processing wanted poster command:", error);

    // Send informative error message
    // إرسال رسالة خطأ واضحة للمستخدم
    const errorMessage = `_An error occurred while processing the image._`;
    // _حدث خطأ أثناء معالجة الصورة_
    await reply(m, errorMessage);
  }
}

module.exports = {
  handle,
  Commands: ["wanted"], // Command handled by this module
  // الأمر الذي يعالجه هذا الموديول
  OnlyPremium: false,
  OnlyOwner: false,
  limitDeduction: 1, // Number of limit to be deducted / عدد الحدود المخصومة
};