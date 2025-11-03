const { reply } = require('@lib/utils');
const ApiAutoresbot = require('api-autoresbot');

async function handle(sock, messageInfo) {
    const { m, remoteJid, message, prefix, command, content } = messageInfo;

    try {
        // 🧾 التحقق من إدخال المستخدم
        // 🧾 Check if user provided input
        if (!content)
            return await reply(
                m,
                `_⚠️ Format الاستخدام / Usage Format:_ \n\n_💬 مثال / Example:_ _*${prefix + command} YOUR_APIKEY*_`
            );

        // 🔄 إرسال تفاعل تحميل
        // 🔄 Send a loading reaction
        await sock.sendMessage(remoteJid, { react: { text: "🤌🏻", key: message.key } });

        // 🔑 إنشاء اتصال بـ API باستخدام المفتاح الذي أدخله المستخدم
        // 🔑 Initialize API connection using user-provided API key
        const api = new ApiAutoresbot(content);

        // 🌐 استدعاء API للتحقق من حالة المفتاح
        // 🌐 Call API to check API key status
        const response = await api.get('/check_apikey');

        // ✅ إذا كان المفتاح صالحاً
        // ✅ If the API key is valid
        if (response && response.limit_key) {
            const activeDate = new Date(response.limit_key * 1000);

            // 📅 أسماء الأشهر بالإنجليزية والعربية
            // 📅 Month names in English and Arabic
            const months = [
                "January / يناير", "February / فبراير", "March / مارس", "April / أبريل",
                "May / مايو", "June / يونيو", "July / يوليو", "August / أغسطس",
                "September / سبتمبر", "October / أكتوبر", "November / نوفمبر", "December / ديسمبر"
            ];

            const formattedDate = `${activeDate.getDate()} ${months[activeDate.getMonth()]} ${activeDate.getFullYear()}`;

            // 📢 إرسال تفاصيل المفتاح للمستخدم
            // 📢 Send API key details to user
            await reply(
                m,
`✅ _🔓 مفتاح الـ API صالح / API Key is Active_

◧ _⏰ صالح حتى / Valid Until:_ *${formattedDate}*
◧ _📊 الحد المسموح / Limit:_ *${response.limit_apikey}*`
            );
        } else {
            // ❌ إذا كان المفتاح غير صالح أو منتهي الصلاحية
            // ❌ If the API key is invalid or expired
            await reply(m, `⛔ _❗ مفتاح الـ API غير مسجل أو منتهي / API Key not registered or expired_`);
        }
    } catch (error) {
        // ⚠️ معالجة الأخطاء أثناء الاتصال أو التنفيذ
        // ⚠️ Handle any unexpected errors
        await sock.sendMessage(
            remoteJid,
            { text: `❗ حدث خطأ أثناء التحقق من المفتاح / An error occurred while checking the API key.\n\nError: ${error.message}` },
            { quoted: message }
        );
    }
}

// ⚙️ إعدادات الأمر
// ⚙️ Command configuration
module.exports = {
    handle,
    Commands: ['cekapikey', 'checkapikey'], // 🧩 أوامر الأمر باللغتين / Command aliases
    OnlyPremium: false, // 🌍 متاح للجميع / Available to everyone
    OnlyOwner: false // 👑 ليس مخصصاً للمالك فقط / Not owner-only
};