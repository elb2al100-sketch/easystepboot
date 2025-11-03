const ApiAutoresbot = require('api-autoresbot');
const config = require("@config");

async function handle(sock, messageInfo) {
    const { remoteJid, message, content } = messageInfo;

    // 🔑 إنشاء اتصال مع واجهة API باستخدام مفتاح الـ API من الإعدادات
    // 🔑 Create API connection using API key from configuration
    const api = new ApiAutoresbot(config.APIKEY);

    // 🌐 طلب البيانات من مسار قاعدة البيانات الخاص بمجموعات البوت
    // 🌐 Request data from the bot group database endpoint
    const response = await api.get('/api/database/grubbot');

    // ✅ التحقق من وجود بيانات في الاستجابة
    // ✅ Check if the API response contains data
    if (response && response.data) {

        // 🧾 إنشاء نص الرسالة لعرض قائمة المجموعات
        // 🧾 Create message text to display the list of bot groups
        let messageText = "╭「 📜 قائمة مجموعات البوت / BOT GROUP LIST 」\n\n";

        // 🔁 تكرار العناصر وإضافتها إلى النص
        // 🔁 Loop through the group data and append each to the message
        response.data.forEach((item, index) => {
            messageText += `◧ *${item.title}*  (اسم المجموعة / Group Name)\n`;
            messageText += `◧ ${item.link}  (رابط الدعوة / Invite Link)\n\n`;
        });

        messageText += `╰─────◧`;

        // 📤 إرسال القائمة إلى المستخدم
        // 📤 Send the list to the user
        await sock.sendMessage(remoteJid, { text: messageText }, { quoted: message });
    }
}

// ⚙️ إعدادات الأمر
// ⚙️ Command configuration
module.exports = {
    handle,
    Commands: ['grubbot'],     // 🧩 اسم الأمر المستخدم / Command name
    OnlyPremium: false,        // 🌍 متاح للجميع / Available for everyone
    OnlyOwner: false           // 👑 ليس خاصاً بالمالك فقط / Not restricted to owner
};