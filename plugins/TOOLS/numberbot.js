const { reply } = require("@lib/utils");

async function handle(sock, messageInfo) {
    const { m, remoteJid, message, content } = messageInfo;

    try {
        // Send bot number / إرسال رقم البوت
        return reply(m, `_BOT NUMBER :_ *${global.phone_number_bot}*`);
        
    } catch (error) {
        console.error(
            "Error processing group / خطأ أثناء معالجة المجموعة:", 
            error
        );

        // Send error message / إرسال رسالة خطأ
        await sock.sendMessage(
            remoteJid,
            { text: '⚠️ An error occurred / حدث خطأ' },
            { quoted: message }
        );
    }
}

module.exports = {
    handle,
    Commands    : ['numberbot'], 
    // Command to show bot number / أمر لعرض رقم البوت
    OnlyPremium : false,
    OnlyOwner   : false,
};