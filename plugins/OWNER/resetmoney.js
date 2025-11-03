const { resetMoney } = require('@lib/users');

async function handle(sock, messageInfo) {
    const { remoteJid, message } = messageInfo;

    try {
        // Send temporary reaction while processing
        // إرسال رد فعل مؤقت أثناء المعالجة
        await sock.sendMessage(remoteJid, { react: { text: "🤌🏻", key: message.key } });

        // Reset all user money
        // إعادة ضبط رصيد المال لجميع المستخدمين
        await resetMoney();
    
        // Send success message
        // إرسال رسالة نجاح
        await sock.sendMessage(
            remoteJid,
            { text: '✅ _All user money has been reset / تم إعادة ضبط جميع أرصدة المستخدمين_' },
            { quoted: message }
        );

    } catch (error) {
        console.error('Error during money reset:', error);

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
    Commands    : ['resetmoney'],
    OnlyPremium : false,
    OnlyOwner   : true
};