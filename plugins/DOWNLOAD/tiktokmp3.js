const { tiktok }            = require('@scrape/tiktok');
// API TikTok scraping / مكتبة سكراب TikTok
const { forceConvertToM4a } = require('@lib/utils');
// Convert audio to M4A / تحويل الصوت إلى صيغة M4A
const { extractLink }       = require('@lib/utils');
// Extract link from text / استخراج الرابط من النص
const { logCustom }         = require("@lib/logger");
// Logger / مسجل الأخطاء
const { downloadToBuffer } = require("@lib/utils");
// Download file into buffer / تحميل الملف في Buffer

/**
 * Send a message quoting the original message / إرسال رسالة مقتبسة
 */
async function sendMessageWithQuote(sock, remoteJid, message, text) {
    await sock.sendMessage(remoteJid, { text }, { quoted: message });
}

/**
 * Check if the URL is a valid TikTok URL / التحقق من صحة رابط TikTok
 */
function isTikTokUrl(url) {
    return /tiktok\.com/i.test(url);
}

/**
 * Main handler for TikTok MP3 command / الدالة الرئيسية لمعالجة أمر تنزيل الصوت من TikTok
 */
async function handle(sock, messageInfo) {
    const { remoteJid, message, content, prefix, command } = messageInfo;

    try {
        const validLink = extractLink(content);

        // Validate input: ensure content exists / التحقق من النص المدخل
        if (!content.trim()) {
            return sendMessageWithQuote(
                sock,
                remoteJid,
                message,
                `_⚠️ Format Usage:_ \n\n_💬 Example:_ _*${prefix + command} linknya*_`
            );
        }

        // Validate TikTok URL / التحقق من صحة الرابط
        if (!isTikTokUrl(content)) {
            return sendMessageWithQuote(
                sock,
                remoteJid,
                message,
                'The URL you provided is invalid. Make sure it is from TikTok. / الرابط غير صالح، تأكد أنه من TikTok.'
            );
        }

        // Show "Loading" reaction / إرسال رد فعل أثناء التحميل
        await sock.sendMessage(remoteJid, { react: { text: "😎", key: message.key } });

        // Call API to get TikTok video data / استدعاء API للحصول على بيانات الفيديو
        const response  = await tiktok(validLink);

        // Validate response.music / التحقق من وجود رابط الموسيقى
        if (!response || !response.music) {
            console.error("Error: No music URL found in response.");
            logCustom('info', content, `ERROR-COMMAND-${command}.txt`);
            return await sock.sendMessage(remoteJid, {
                text: "Failed to fetch audio from TikTok. Please try again later. / فشل في الحصول على الصوت من TikTok، حاول لاحقاً.",
            }, { quoted: message });
        }

        let outputUrl = response.music;

        try {
            // Try converting to M4A / محاولة التحويل إلى M4A
            outputUrl = await forceConvertToM4a({ url: response.music });
        } catch (error) {
            //console.warn("Warning: Failed to convert to M4A, using original URL.", error);
        }

        // Download audio into buffer / تحميل الصوت في Buffer
        const audioBuffer = await downloadToBuffer(outputUrl, 'mp3');

        // Send audio to user / إرسال الصوت للمستخدم
        await sock.sendMessage(remoteJid, {
            audio: audioBuffer,
            fileName: `tiktok.mp3`,
            mimetype: 'audio/mp4'
        }, { quoted: message });

    } catch (error) {
        console.error("Error processing TikTok command:", error);
        logCustom('info', content, `ERROR-COMMAND-${command}.txt`);

        // Send descriptive error message / إرسال رسالة خطأ واضحة
        const errorMessage = `Sorry, an error occurred while processing your request. Please try again later.\n\n*Error Details:* ${error.message || error}`;
        await sendMessageWithQuote(sock, remoteJid, message, errorMessage);
    }
}

module.exports = {
    handle,
    Commands    : ['tiktokmp3','ttmp3'], // Supported commands / الأوامر المدعومة
    OnlyPremium : false, 
    OnlyOwner   : false,
    limitDeduction  : 1, // Daily limit deduction / الخصم من الحد اليومي
};