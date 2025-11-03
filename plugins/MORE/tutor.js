// Import API helper / استيراد مكتبة API
const ApiAutoresbot = require('api-autoresbot');
const config        = require("@config");

async function handle(sock, messageInfo) {
    const remoteJid = messageInfo.remoteJid; // User chat ID / معرف المحادثة
    const message   = messageInfo.message;   // Original message / الرسالة الأصلية

    // Initialize API with key / تهيئة API باستخدام المفتاح
    const api = new ApiAutoresbot(config.APIKEY);
    const response = await api.get('/api/database/tutorial'); // Fetch tutorial list / جلب قائمة الدروس

    if (response && response.data) {
        let messageText = "╭「 Tutorial Seputar Bot 」\n\n"; // Header / العنوان
        response.data.forEach((item, index) => {
            messageText += `◧ *${item.title}*\n`; // Tutorial title / عنوان الدرس
            messageText += `◧ ${item.link}\n\n`;   // Tutorial link / رابط الدرس
        });
        messageText += `╰─────◧`; // Footer / النهاية
        await sock.sendMessage(remoteJid, { text: messageText }, { quoted: message }); // Send message / إرسال الرسالة
    }
}

module.exports = {
    handle,
    Commands    : ['tutor','tutorial'], // Command triggers / أسماء الأوامر
    OnlyPremium : false, 
    OnlyOwner   : false
};