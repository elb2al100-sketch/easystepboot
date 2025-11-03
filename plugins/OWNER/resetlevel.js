const { resetLevel } = require('@lib/users');

async function handle(sock, messageInfo) {
    const { remoteJid, message } = messageInfo;

    try {
        // Send temporary reaction while processing
        // إرسال رد فعل مؤقت أثناء المعالجة
        await sock.sendMessage(remoteJid, { react: { text: "🤌🏻", key: message.key } });

        // Reset all user levels
        // إعادة ضبط جميع مستويات المستخدمين
        await resetLevel();
    
        // Send success message
        // إرسال رسالة نجاح
        await sock.sendMessage(
            remoteJid,
            { text: '✅ _All user levels have been reset / تم إعادة ضبط جميع مستويات المستخدمين_' },
            { quoted: message }
        );

    } catch (error) {
        console.error('Error during level reset:', error);

        // Send error message
        // إرسال رسالة خطأ
        await sock.sendMessage(
            remoteJid,
            { text: '❌ _Sorry, an error occurred while resetting data / عذرًا، حدث خطأ أثناء إعادة ضبط البيانات_' },
            { quoted: message }
        );
    }
}

module.exports = {
    handle,
    Commands    : ['resetlevel'],
    OnlyPremium : false,
    OnlyOwner   : true
};