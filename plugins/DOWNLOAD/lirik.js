const ApiAutoresbot = require('api-autoresbot');
// API client / عميل API
const config        = require("@config");
// Configuration file / ملف الإعدادات
const { logCustom } = require("@lib/logger");
// Custom logger / مسجل مخصص

/**
 * Send message quoting the original message / إرسال رسالة مقتبسة
 */
async function sendMessageWithQuote(sock, remoteJid, message, text, options = {}) {
    await sock.sendMessage(remoteJid, { text }, { quoted: message, ...options });
}

/**
 * Main handler to search song lyrics / الدالة الرئيسية للبحث عن كلمات الأغاني
 */
async function handle(sock, messageInfo) {
    const { remoteJid, message, content, prefix, command} = messageInfo;

    try {
        // Validate input: ensure text exists / التحقق من النص المرسل
        if (!content.trim() || content.trim() == '') {
            return sendMessageWithQuote(sock, remoteJid, message, 
                `_⚠️ Format Usage:_ \n\n_💬 Example:_ _*${prefix + command} matahariku*_`
            );
        }

        // Show loading reaction / إرسال رد فعل 😎 أثناء المعالجة
        await sock.sendMessage(remoteJid, { react: { text: "😎", key: message.key } });

        // Initialize API / تهيئة API
        const api = new ApiAutoresbot(config.APIKEY);

        // Call API with text parameter / استدعاء API مع النص
        const response = await api.get('/api/search/lyrics', { text: content });

        // Handle API response / معالجة استجابة API
        if (response.code === 200 && response.data) {
            const { artist, title, lyrics, image } = response.data;
            const lirikData = `_*Artist:*_ *${artist}*\n\n_*Title:*_ *${title}*\n\n${lyrics}`;

            // Send image and lyrics / إرسال صورة الأغنية وكلماتها
            await sock.sendMessage(remoteJid, { image: { url: image }, caption: lirikData }, { quoted: message });
        } else {
            logCustom('info', content, `ERROR-COMMAND-${command}.txt`);
            // Handle empty or invalid response / التعامل مع الاستجابة الفارغة أو الخاطئة
            const errorMessage = response?.message || 
                "Sorry, no response from the server. Please try again later.";
            await sendMessageWithQuote(sock, remoteJid, message, errorMessage);
        }
    } catch (error) {
        console.error("Error calling ApiAutoresbot API:", error);
        logCustom('info', content, `ERROR-COMMAND-${command}.txt`);
        // Handle unexpected errors / التعامل مع الأخطاء غير المتوقعة
        const errorMessage = `Sorry, an error occurred while processing your request. Please try again later.\n\nError Details: ${error.message || error}`;
        await sendMessageWithQuote(sock, remoteJid, message, errorMessage);
    }
}

module.exports = {
    handle,
    Commands    : ['lirik'], // Command to trigger lyrics search / الأمر لتفعيل البحث عن كلمات الأغاني
    OnlyPremium : false,     // Not restricted to premium users / غير مقيد بالمستخدمين المميزين
    OnlyOwner   : false,     // Not restricted to owner / غير مقيد بالمالك
    limitDeduction  : 1,     // Amount deducted from user limit / مقدار الخصم من حد الاستخدام
};