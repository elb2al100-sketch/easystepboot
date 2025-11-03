const ApiAutoresbot = require('api-autoresbot');
const config        = require("@config");

async function handle(sock, messageInfo) {
    const { remoteJid, message, prefix, command, content } = messageInfo;

    try {

        // English: Validate empty input
        // العربية: التحقق من إدخال فارغ
        if (!content.trim()) {
            return await sock.sendMessage(
                remoteJid, 
                { text: `_⚠️ Usage Format | صيغة الاستخدام:_ \n\n_💬 Example | مثال:_ _*${prefix + command} hantu*_` }, 
                { quoted: message }
            );
        }
    
        // English: Send loading reaction
        // العربية: إرسال رد فعل التحميل
        await sock.sendMessage(remoteJid, { react: { text: "😎", key: message.key } });

        const api = new ApiAutoresbot(config.APIKEY);

        // English: Call API to interpret dream with error handling
        // العربية: استدعاء API لتفسير الحلم مع معالجة الأخطاء
        const response = await api.get('/api/primbon/tafsirmimpi', { text: content });
        
        if (response && response.data) {
            // English: Send response data if available
            // العربية: إرسال البيانات المستلمة إذا كانت موجودة
            await sock.sendMessage(remoteJid, { text: response.data }, { quoted: message });
        } else {
            // English: Send default message if no response data
            // العربية: إرسال رسالة افتراضية إذا لم توجد بيانات
            await sock.sendMessage(remoteJid, { text: "Sorry, no response from the server | عذرًا، لم يتم استلام رد من الخادم." }, { quoted: message });
        }
    } catch (error) {
        // English: Notify user if any error occurs
        // العربية: إعلام المستخدم في حالة حدوث خطأ
        await sock.sendMessage(
            remoteJid, 
            { text: `Sorry, an error occurred while processing your request | حدث خطأ أثناء معالجة طلبك. Try again later.\n\n${error}` }, 
            { quoted: message }
        );
    }
}

module.exports = {
    handle,
    Commands        : ['artimimpi'],
    OnlyPremium     : false, 
    OnlyOwner       : false,
    limitDeduction  : 1 // English: Each use deducts 1 limit
                         // العربية: كل استخدام يخصم 1 من الحد اليومي
};