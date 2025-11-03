const ApiAutoresbot = require('api-autoresbot');
// API client for Autoresbot / عميل API الخاص بـ Autoresbot
const config        = require("@config");
// Configuration file / ملف الإعدادات
const {getBuffer}   = require("@lib/utils");
// Utility function to get buffer from URL / دالة لتحويل رابط إلى Buffer
const mess          = require('@mess');
// General messages / رسائل جاهزة
const { logCustom } = require("@lib/logger");
// Custom logger / مسجل مخصص

/**
 * Send a message quoting the original message / إرسال رسالة مقتبسة
 * @param {object} sock - WebSocket connection / كائن اتصال WebSocket
 * @param {string} remoteJid - Target user ID / معرف المستخدم الهدف
 * @param {object} message - Original message / الرسالة الأصلية
 * @param {string} text - Text to send / نص الرسالة
 * @param {object} options - Additional options / خيارات إضافية
 */
async function sendMessageWithQuote(sock, remoteJid, message, text, options = {}) {
    await sock.sendMessage(remoteJid, { text }, { quoted: message, ...options });
}

/**
 * Main handler to search Pinterest images / الدالة الرئيسية للبحث عن الصور في Pinterest
 */
async function handle(sock, messageInfo) {
    const { remoteJid, message, content, prefix, command } = messageInfo;

    try {
        // Validate input: ensure text exists / التحقق من النص المرسل
        if (!content.trim() || content.trim() == '') {
            return sendMessageWithQuote(
                sock,
                remoteJid,
                message,
                `_⚠️ Format Usage:_ \n\n_💬 Example:_ _*${prefix + command} kucing*_`
            );
        }

        // Show loading reaction / إرسال رد فعل 😎 أثناء المعالجة
        await sock.sendMessage(remoteJid, { react: { text: "😎", key: message.key } });

        // Initialize API / تهيئة API
        const api = new ApiAutoresbot(config.APIKEY);

        // Call API with text parameter / استدعاء API مع النص
        const response = await api.get('/api/search/pinterest', { text: content });
    
        // Handle API response / معالجة استجابة API
        if (response.code === 200 && response.data) {
            // Download image to buffer / تحميل الصورة إلى Buffer
            const buffer = await getBuffer(response.data);
            // Send image with success caption / إرسال الصورة مع رسالة نجاح
            return await sock.sendMessage(remoteJid, { image: buffer, caption: mess.general.success }, { quoted: message });

        } else {
            logCustom('info', content, `ERROR-COMMAND-${command}.txt`);
            // Handle empty or invalid response / التعامل مع الاستجابة الفارغة أو الخاطئة
            const errorMessage = response?.message || 
                "Sorry, no response from the server. Please try again later.";
            return await sendMessageWithQuote(sock, remoteJid, message, errorMessage);
        }

    } catch (error) {
        console.error("Error calling Autoresbot API:", error);
        logCustom('info', content, `ERROR-COMMAND-${command}.txt`);
        // Handle unexpected errors / التعامل مع الأخطاء غير المتوقعة
        const errorMessage = `Sorry, an error occurred while processing your request. Please try again later.\n\nError Details: ${error.message || error}`;
        await sendMessageWithQuote(sock, remoteJid, message, errorMessage);
    }
}

module.exports = {
    handle,
    Commands    : ['pin','pinterest'], // Supported commands / الأوامر المدعومة
    OnlyPremium : false,               // Not restricted to premium users / غير مقيد بالمستخدمين المميزين
    OnlyOwner   : false,               // Not restricted to owner / غير مقيد بالمالك
    limitDeduction  : 1,               // Amount deducted from user limit / مقدار الخصم من حد الاستخدام
};