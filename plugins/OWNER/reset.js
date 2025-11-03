const { reset }        = require('@lib/utils');
const { updateSocket } = require('@lib/scheduled');
const { clearCache }   = require('@lib/globalCache');
const { resetUsers, resetOwners } = require('@lib/users');
const { resetGroup }   = require('@lib/group');
const { resetAllTotalChat } = require("@lib/totalchat");

async function handle(sock, messageInfo) {
    const { remoteJid, message, content, prefix, command } = messageInfo;

    // Check if user confirmed the reset with "-y"
    // التحقق من تأكيد المستخدم باستخدام "-y"
    if (!content.trim().toLowerCase().endsWith('-y')) {
        await sock.sendMessage(
            remoteJid,
            {
                text: `⚠️ _This command will delete all databases stored in the bot._ / هذا الأمر سيحذف جميع قواعد البيانات المخزنة في البوت.\n\nPlease type *${prefix + command} -y* to continue / الرجاء كتابة *${prefix + command} -y* للمتابعة.`,
            },
            { quoted: message }
        );
        return;
    }

    try {
        // Send temporary reaction while processing
        // إرسال رد فعل مؤقت أثناء المعالجة
        await sock.sendMessage(remoteJid, { react: { text: "🤌🏻", key: message.key } });

        // Reset all relevant data
        // إعادة ضبط جميع البيانات ذات الصلة
        resetUsers();          // Reset users / إعادة ضبط المستخدمين
        resetOwners();         // Reset owners / إعادة ضبط المالكين
        resetGroup();          // Reset groups / إعادة ضبط المجموعات
        resetAllTotalChat();   // Reset chat statistics / إعادة ضبط إحصائيات الدردشة

        clearCache();          // Clear global cache / مسح الكاش العام

        await reset();         // General bot reset / إعادة ضبط البوت

        await updateSocket(sock); // Update bot connection / تحديث اتصال البوت

        // Send success message
        // إرسال رسالة نجاح
        await sock.sendMessage(
            remoteJid,
            { text: '✅ _All databases have been reset / تم إعادة ضبط جميع قواعد البيانات_' },
            { quoted: message }
        );

    } catch (error) {
        console.error('Error during database reset:', error);

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
    Commands    : ['reset'],
    OnlyPremium : false,
    OnlyOwner   : true
};