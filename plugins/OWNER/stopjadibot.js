const fs = require('fs');
const path = require('path');
const { determineUser } = require('@lib/utils');
const { sessions }      = require('@lib/cache');

async function handle(sock, messageInfo) {
    const { remoteJid, message, content, sender, mentionedJid, isQuoted, prefix, command } = messageInfo;

    try {
        // Validate input
        // التحقق من وجود المحتوى
        if (!content) {
            await sock.sendMessage(remoteJid,
                {
                    text: `_⚠️ Usage Format:_\n\n💬 Example:_ _*${prefix + command} 6285246154386*_ \n\n⚠️ صيغة الاستخدام:\n\n💬 مثال:_ _*${prefix + command} 6285246154386*_`
                },{ quoted: message });
            return;
        }

        // Determine target user from mention, quoted message, or input
        // تحديد المستخدم المستهدف من mention أو رسالة مقتبسة أو المحتوى
        const userToAction = determineUser(mentionedJid, isQuoted, content);
        if (!userToAction) {
            return await sock.sendMessage(
                remoteJid,
                { text:  `_⚠️ Usage Format:_ \n\n💬 Example:_ _*${prefix + command} @NAME*_ \n\n⚠️ صيغة الاستخدام:\n\n💬 مثال:_ _*${prefix + command} @NAME*_` },
                { quoted: message }
            );
        }

        let targetNumber = userToAction.replace(/\D/g, ''); // Keep only digits
        // الاحتفاظ بالأرقام فقط

        if (targetNumber.length < 10 || targetNumber.length > 15) {
            await sock.sendMessage(
                remoteJid,
                { text: `⚠️ Invalid number. \n⚠️ رقم غير صحيح.` },
                { quoted: message }
            );
            return;
        }

        if (!targetNumber.endsWith('@s.whatsapp.net')) {
            targetNumber += '@s.whatsapp.net';
        }

        // Send loading reaction
        // إرسال إشعار تحميل
        await sock.sendMessage(remoteJid, { react: { text: "⏰", key: message.key } });

        // Ensure session folder exists
        // التحقق من وجود مجلد الجلسة
        const SESSION_PATH = './session/';
        const senderId = targetNumber.replace('@s.whatsapp.net', '');
        const sessionPath = path.join(SESSION_PATH, senderId);
        const sessionExists = fs.existsSync(sessionPath);

        // Remove active session if exists
        // إزالة الجلسة النشطة إذا كانت موجودة
        const sockSesi = sessions.get(`session/${senderId}`);
        if (sockSesi) {
            const { updateJadibot } = require('@lib/jadibot');
            await updateJadibot(senderId, 'stop');
            await sockSesi.ws.close(); // Close WebSocket
            // إغلاق WebSocket
            sessions.delete(`session/${senderId}`); // Remove from session list
            // حذف من قائمة الجلسات
        }

        if (sessionExists) {
            // Remove session folder
            // حذف مجلد الجلسة
            await sock.sendMessage(
                remoteJid,
                { text: `✅ _${senderId} has been successfully stopped_ \n✅ تم إيقاف ${senderId} بنجاح` },
                { quoted: message }
            );
            const { updateJadibot } = require('@lib/jadibot');
            await updateJadibot(senderId, 'stop');
        } else {
            await sock.sendMessage(
                remoteJid,
                { text: `⚠️ _Session folder for ${senderId} not found._ \n⚠️ لم يتم العثور على مجلد الجلسة لـ ${senderId}` },
                { quoted: message }
            );
        }

    } catch (error) {
        console.error('Error occurred:', error);
        await sock.sendMessage(
            remoteJid,
            { text: `⚠️ An error occurred while processing the command. \n⚠️ حدث خطأ أثناء معالجة الأمر.` },
            { quoted: message }
        );
    }
}

module.exports = {
    handle,
    Commands    : ['stopjadibot'],
    OnlyPremium : false,
    OnlyOwner   : true
};