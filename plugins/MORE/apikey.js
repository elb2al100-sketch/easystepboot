const { reply } = require('@lib/utils');
const ApiAutoresbot = require('api-autoresbot');
const config = require("@config");

async function handle(sock, messageInfo) {
    const { m, remoteJid, message, prefix, command, content } = messageInfo;

    try {
        // 🔄 إرسال تفاعل تحميل للمستخدم
        // 🔄 Send a loading reaction to the user
        await sock.sendMessage(remoteJid, { react: { text: "🤌🏻", key: message.key } });

        const api = new ApiAutoresbot(config.APIKEY);

        // 🌐 استدعاء API للتحقق من حالة المفتاح
        // 🌐 Call API to check the API key status
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

            // 📢 إرسال تفاصيل صلاحية المفتاح للمستخدم
            // 📢 Send API key details to the user
            await reply(m, 
`✅ _🔓 مفتاح الـ API صالح / API Key is Active_

◧ _⏰ تاريخ انتهاء الصلاحية (Expiry Date):_ *${formattedDate}*
◧ _📊 الحد المسموح (Limit):_ *${response.limit_apikey}*`
            );

        } else {
            // ❌ إذا لم يتم العثور على المفتاح أو انتهت صلاحيته
            // ❌ If the key is not found or expired
            await reply(m, `⛔ _❗ مفتاح الـ API غير مسجل أو منتهي الصلاحية / API Key not registered or expired_`);
        }

    } catch (error) {
        // ⚠️ إذا حدث خطأ أثناء التنفيذ
        // ⚠️ Handle any unexpected errors
        await sock.sendMessage(remoteJid, { 
            text: `❗ حدث خطأ أثناء فحص المفتاح / An error occurred while checking the API key.\n\nError: ${error.message}` 
        }, { quoted: message });
    }
}

// ⚙️ إعدادات الأمر
// ⚙️ Command configuration
module.exports = {
    handle,
    Commands    : ['apikey'],   // 🔑 اسم الأمر / Command name
    OnlyPremium : false,        // 🌍 متاح للجميع / Available to everyone
    OnlyOwner   : false         // 👑 لا يقتصر على المالك فقط / Not owner-only
};