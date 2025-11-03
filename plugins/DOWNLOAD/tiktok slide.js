const limit = 4; // Number of images to send / عدد الصور التي سيتم إرسالها

const ApiAutoresbot = require("api-autoresbot");
// API client / مكتبة للتعامل مع API
const config = require("@config");
// Config file / ملف إعدادات
const { extractLink } = require("@lib/utils");
// Utility to extract link / أداة لاستخراج الرابط
const { logCustom } = require("@lib/logger");
// Logger / مسجل الأخطاء

/**
 * Check if the URL is a valid TikTok URL / التحقق إذا كان الرابط صحيح من TikTok
 */
function isTikTokUrl(url) {
  return /tiktok\.com/i.test(url);
}

/**
 * Send a message quoting the original message / إرسال رسالة مقتبسة
 */
async function sendMessageWithQuote(sock, remoteJid, message, text) {
  await sock.sendMessage(remoteJid, { text }, { quoted: message });
}

/**
 * Main handler for TikTok Slide command / الدالة الرئيسية لمعالجة أمر تنزيل صور TikTok Slide
 */
async function handle(sock, messageInfo) {
  const { remoteJid, message, content, prefix, command } = messageInfo;

  try {
    const validLink = extractLink(content);

    // Validate input / التحقق من النص المدخل
    if (!content?.trim() || !isTikTokUrl(content)) {
      return sendMessageWithQuote(
        sock,
        remoteJid,
        message,
        `_⚠️ Format Usage:_ \n\n_💬 Example:_ _*${prefix + command} https://vt.tiktok.com/ZSjqUj8cc/*_`
      );
    }

    // Show "Loading" reaction / إرسال رد فعل أثناء التحميل
    await sock.sendMessage(remoteJid, {
      react: { text: "⏳", key: message.key },
    });

    // Initialize API with APIKEY / تهيئة API باستخدام APIKEY من الإعدادات
    const api = new ApiAutoresbot(config.APIKEY);

    // Call API to download TikTok Slide images / استدعاء API لتحميل صور TikTok Slide
    const response = await api.get("/api/downloader/tiktok-slide", {
      url: validLink,
    });

    // Validate response / التحقق من صحة البيانات المسترجعة
    if (!response || !response.data || response.data.length === 0) {
      throw new Error("No images found at the provided URL.");
    }

    // Send images according to limit / إرسال الصور حسب الحد المسموح
    const imagesToSend = response.data.slice(0, limit);
    for (const imageUrl of imagesToSend) {
      await sock.sendMessage(remoteJid, {
        image: { url: imageUrl },
        caption: ``,
      });
    }
  } catch (error) {
    console.error("Error processing TikTok Slide command:", error);
    logCustom("info", content, `ERROR-COMMAND-${command}.txt`);

    // Send descriptive error message / إرسال رسالة خطأ واضحة
    const errorMessage = `Sorry, an error occurred while processing your request. Please try again later.\n\n*Error Details:* ${
      error.message || "Unknown error"
    }`;
    await sendMessageWithQuote(sock, remoteJid, message, errorMessage);
  }
}

module.exports = {
  handle,
  Commands: ["ttslide", "tiktokslide"], // Supported commands / الأوامر المدعومة
  OnlyPremium: false,
  OnlyOwner: false,
  limitDeduction: 1, // Daily limit deduction / مقدار الخصم من الحد اليومي
};