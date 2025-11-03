const ApiAutoresbot = require('api-autoresbot');
const config = require('@config');
const { logCustom } = require("@lib/logger");

async function handle(sock, messageInfo) {
    const { remoteJid, message, prefix, command, content } = messageInfo;

    try {
        // Validate input / التحقق من الإدخال
        if (!content) {
            return await sock.sendMessage(
                remoteJid,
                { text: `_⚠️ Usage Format / صيغة الاستخدام:_\n💬 *Example / مثال:* ${prefix + command} autoresbot` },
                { quoted: message }
            );
        }

        // Send loading reaction / إرسال تفاعل تحميل
        await sock.sendMessage(remoteJid, { react: { text: "🤌🏻", key: message.key } });

        const api = new ApiAutoresbot(config.APIKEY);

        // Call API / استدعاء واجهة برمجة التطبيقات
        const response = await api.get('/api/search/bingsearch', { q: content });

        if (response?.data) {

            let messageText = "*Search Result / نتائج البحث:*\n\n";
            response.data.forEach((item, index) => {
                messageText += `◧ *${item.title}*\n`;
                messageText += `◧ URL / الرابط: ${item.url}\n`;
                messageText += `◧ Description / الوصف: ${item.description}\n\n`;
            });

            // Send the obtained data / إرسال البيانات المستلمة
            await sock.sendMessage(remoteJid, { text: messageText }, { quoted: message });

        } else {
            logCustom('info', content, `ERROR-COMMAND-${command}.txt`);
            // Empty response or no data / استجابة فارغة أو لا توجد بيانات
            await sock.sendMessage(remoteJid, { text: '❌ Sorry, no response from server / عذراً، لم يتم تلقي أي استجابة من الخادم.' }, { quoted: message });
        }

    } catch (error) {
        console.error('Error / خطأ:', error);
        logCustom('info', content, `ERROR-COMMAND-${command}.txt`);

        // Handle error with user message / معالجة الخطأ برسالة للمستخدم
        await sock.sendMessage(
            remoteJid,
            { text: `❌ Sorry, an error occurred while processing your request / عذراً، حدث خطأ أثناء معالجة طلبك.\n\nDetail / التفاصيل: ${error.message || error}` },
            { quoted: message }
        );
    }
}

module.exports = {
    handle,
    Commands    : ['google'],
    OnlyPremium : false,
    OnlyOwner   : false,
    limitDeduction: 1 // Number of limits to deduct / عدد الاستخدامات التي سيتم خصمها
};