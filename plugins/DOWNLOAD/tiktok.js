const { tiktok } = require('@scrape/tiktok');
// TikTok scraper API / مكتبة لجلب بيانات الفيديوهات من TikTok
const { extractLink, downloadToBuffer } = require('@lib/utils');
// Utilities / الأدوات المساعدة
const { logCustom } = require("@lib/logger");
// Logger / مسجل للأخطاء

/**
 * Send a message quoting the original message / إرسال رسالة مقتبسة
 */
async function sendMessageWithQuote(sock, remoteJid, message, text) {
    await sock.sendMessage(remoteJid, { text }, { quoted: message });
}

/**
 * Validate if a URL is a valid TikTok URL / التحقق من صحة رابط TikTok
 */
function isTikTokUrl(url) {
    return /tiktok\.com/i.test(url);
}

/**
 * Main handler for TikTok command / الدالة الرئيسية لمعالجة أمر TikTok
 */
async function handle(sock, messageInfo) {
    const { remoteJid, message, content, prefix, command } = messageInfo;

    // Extract the link from the message / استخراج الرابط من النص
    const validLink = extractLink(content);

    try {
        // Validate input / التحقق من النص المرسل
        if (!content.trim() || content.trim() == '') {
            return sendMessageWithQuote(
                sock,
                remoteJid,
                message,
                `_⚠️ Format Usage:_ \n\n_💬 Example:_ _*${prefix + command} linknya*_`
            );
        }

        // Validate TikTok URL / التحقق من صحة رابط TikTok
        if (!isTikTokUrl(validLink)) {
            return sendMessageWithQuote(
                sock,
                remoteJid,
                message,
                'The URL you entered is invalid. Make sure it is from TikTok. / الرابط غير صالح، تأكد أنه من TikTok.'
            );
        }

        // Show "Loading" reaction / إرسال رد فعل 😎 أثناء المعالجة
        await sock.sendMessage(remoteJid, { react: { text: "😎", key: message.key } });

        // Call TikTok API to get video data / استدعاء API لجلب بيانات الفيديو
        const response = await tiktok(validLink);

        // Download video to buffer / تحميل الفيديو إلى Buffer
        const videoBuffer = await downloadToBuffer(response.no_watermark, 'mp4');

        // Send video without watermark and caption / إرسال الفيديو بدون العلامة المائية مع العنوان
        await sock.sendMessage(remoteJid, {
            video: videoBuffer,
            caption: response.title
        }, { quoted: message });

    } catch (error) {
        console.error("Error processing TikTok command:", error);
        logCustom('info', content, `ERROR-COMMAND-${command}.txt`);

        // Send detailed error message / إرسال رسالة خطأ مفصلة
        const errorMessage = `Sorry, an error occurred while processing your request. Please try again later.\n\n*Error Details:* ${error.message || error}`;
        await sendMessageWithQuote(sock, remoteJid, message, errorMessage);
    }
}

module.exports = {
    handle,
    Commands: ['tt', 'tiktok'], // Commands handled by this module / الأوامر المدعومة
    OnlyPremium: false, 
    OnlyOwner: false,
    limitDeduction: 1, // Limit deduction / مقدار الخصم من الحد اليومي
};