const ApiAutoresbot = require('api-autoresbot');
// API client for Autoresbot / عميل API الخاص بـ Autoresbot
const config = require("@config");
// Configuration / إعدادات
const { logCustom } = require("@lib/logger");
// Logger / مسجل للأخطاء

/**
 * Send a message quoting the original message / إرسال رسالة مقتبسة
 */
async function sendMessageWithQuote(sock, remoteJid, message, text) {
    await sock.sendMessage(remoteJid, { text }, { quoted: message });
}

/**
 * Main handler to search Spotify / الدالة الرئيسية للبحث في Spotify
 */
async function handle(sock, messageInfo) {
    const { remoteJid, message, content, prefix, command } = messageInfo;

    try {
        // Validate input / التحقق من النص المرسل
        const query = content.trim();
        if (!query) {
            return sendMessageWithQuote(
                sock,
                remoteJid,
                message,
                `_⚠️ Format Usage:_\n\n_💬 Example:_ _*${prefix + command} matahariku*_`
            );
        }

        // Show "Loading" reaction / إرسال رد فعل 😎 أثناء المعالجة
        await sock.sendMessage(remoteJid, { react: { text: "😎", key: message.key } });

        // Initialize API / تهيئة API
        const api = new ApiAutoresbot(config.APIKEY);

        // Call API with parameter / استدعاء API مع المعلمات
        const response = await api.get('/api/search/spotify', { text: query });

        // Handle API response / التعامل مع الاستجابة من API
        const results = response?.data;
        if (Array.isArray(results) && results.length > 0) {
            let reply = `🔍 *Spotify Search Results for "${query}":*\n\n / نتائج البحث على Spotify لـ "${query}":\n\n`;
            results.forEach((item, index) => {
                const { title, artist, url, duration, popularity, preview } = item;

                reply += `*${index + 1}. ${title}*\n / العنوان: ${title}\n`;
                reply += `   🎤 *Artist:* ${artist} / الفنان: ${artist}\n`;
                reply += `   ⏱️ *Duration:* ${(duration / 1000).toFixed(0)} sec / المدة: ${(duration / 1000).toFixed(0)} ثانية\n`;
                reply += `   🌟 *Popularity:* ${popularity} / الشعبية: ${popularity}\n`;
                reply += `   🔗 ${url}\n`;
                if (preview) {
                    reply += `   🎵 Preview: ${preview} / معاينة: ${preview}\n`;
                }
                reply += `\n`;
            });

            // Send search results / إرسال نتائج البحث
            await sendMessageWithQuote(sock, remoteJid, message, reply.trim());
        } else {
            // Message if no data found / رسالة إذا لم توجد نتائج
            await sendMessageWithQuote(
                sock,
                remoteJid,
                message,
                "⚠️ Sorry, no results found for your search / لا توجد نتائج للبحث الخاص بك"
            );
        }
    } catch (error) {
        // Log error / تسجيل الخطأ
        logCustom('info', content, `ERROR-COMMAND-${command}.txt`);
        
        // Handle error and notify user / التعامل مع الخطأ وإعلام المستخدم
        await sock.sendMessage(
            remoteJid,
            {
                text: `❌ Sorry, an error occurred while processing your request. Please try again later.\n\n*Error:* ${error.message}`,
            },
            { quoted: message }
        );
    }
}

module.exports = {
    handle,
    Commands: ['spotify'], // Command name / اسم الأمر
    OnlyPremium: false,     // Not restricted to premium users / غير مقيد بالمميزين
    OnlyOwner: false,       // Not restricted to owner / غير مقيد بالمالك
    limitDeduction: 1,      // Limit deduction / مقدار الخصم من الحد اليومي
};