const ApiAutoresbot     = require('api-autoresbot');
// Autoresbot API / مكتبة API الخاصة بـ Autoresbot
const config            = require("@config");
// Configuration / الإعدادات
const mess              = require("@mess");
// Predefined messages / رسائل جاهزة
const { extractLink }   = require('@lib/utils');
// Extract URL from text / استخراج الرابط من النص
const { logCustom }     = require("@lib/logger");
// Logger for errors / مسجل الأخطاء

/**
 * Send a message quoting the original message / إرسال رسالة مقتبسة
 */
async function sendMessageWithQuote(sock, remoteJid, message, text) {
    await sock.sendMessage(remoteJid, { text }, { quoted: message });
}

/**
 * Main handler for Twitter downloader command / الدالة الرئيسية لمعالجة أمر تنزيل فيديو من Twitter
 */
async function handle(sock, messageInfo) {
    const { remoteJid, message, content, prefix, command } = messageInfo;
    
    try {
        const validLink = extractLink(content);

        // Validate input / التحقق من صحة المدخلات
        if (!content.trim() || content.trim() == '') {
            return sendMessageWithQuote(
                sock,
                remoteJid,
                message,
                `_⚠️ Format Usage:_ \n\n_💬 Example:_ _*${prefix + command} https://twitter.com/gofoodindonesia/status/1229369819511709697*_`
            );
        }
        
        // Show "Loading" reaction / عرض رد فعل أثناء التحميل
        await sock.sendMessage(remoteJid, { react: { text: "😎", key: message.key } });

        // Initialize API / تهيئة API
        const api = new ApiAutoresbot(config.APIKEY);

        // Call API with parameters / استدعاء API مع المعطيات
        const response = await api.get('/api/downloader/twitter', { url: validLink });

        // Handle API response / التعامل مع الاستجابة
        if (response?.data?.media) {
            const urlDownload = response.data.media[0].url;

            await sock.sendMessage(remoteJid, {
                video: { url: urlDownload },
                caption: mess.general.success,
                mimetype: 'video/mp4'
            });

        } else {
            logCustom('info', content, `ERROR-COMMAND-${command}.txt`);
            // Message if response is empty / رسالة إذا كانت الاستجابة فارغة
            await sendMessageWithQuote(
                sock,
                remoteJid,
                message,
                "Sorry, no response from the server. Please try again later. / عذراً، لا يوجد استجابة من الخادم، حاول لاحقاً."
            );
        }
    } catch (error) {
        console.error("Error calling Autoresbot API:", error);
        logCustom('info', content, `ERROR-COMMAND-${command}.txt`);

        // Handle errors and send message to user / معالجة الأخطاء وإرسال رسالة للمستخدم
        const errorMessage = `Sorry, an error occurred while processing your request. Please try again later.\n\n*Error Details:* ${error.message || error}`;
        await sendMessageWithQuote(sock, remoteJid, message, errorMessage);
    }
}

module.exports = {
    handle,
    Commands    : ['tw','twitter'], // Supported commands / الأوامر المدعومة
    OnlyPremium : false, 
    OnlyOwner   : false,
    limitDeduction  : 1, // Daily limit deduction / الخصم من الحد اليومي
};