const mess = require('@mess');
const { getGroupMetadata } = require("@lib/cache");

// Function to send a message safely
// دالة لإرسال رسالة بأمان
async function sendMessage(sock, remoteJid, text, message) {
    try {
        await sock.sendMessage(remoteJid, { text }, { quoted: message });
    } catch (error) {
        console.error(`Failed to send message: ${error.message} \nفشل في إرسال الرسالة: ${error.message}`);
    }
}

async function handle(sock, messageInfo) {
    const { remoteJid, isGroup, message, sender, command } = messageInfo;

    // Check if the chat is a group
    // التحقق مما إذا كانت المحادثة مجموعة
    if (!isGroup) {
        await sendMessage(sock, remoteJid, mess.general.isGroup, message);
        return;
    }

    try {
        // Get group metadata
        // الحصول على بيانات المجموعة
        const groupMetadata = await getGroupMetadata(sock, remoteJid);
        const isAdmin = groupMetadata.participants.some(
            participant => participant.id === sender && participant.admin
        );

        // Check if sender is admin
        // التحقق مما إذا كان المرسل مسؤولاً
        if (!isAdmin) {
            await sendMessage(sock, remoteJid, mess.general.isAdmin, message);
            return;
        }

        // Prepare the response message
        // تحضير رسالة الرد
        const responseText = `
_Mode ${command}_

*Ketik: .on ${command}*

_Noted!_
Antilink: delete message
Antilinkv2: delete message + kick member

Antilinkwa: delete message (WA link)
Antilinkwav2: delete message + kick (WA link)

_وضع ${command}_

*اكتب: .on ${command}*

تمت الملاحظة!
Antilink: حذف الرسالة
Antilinkv2: حذف الرسالة + طرد العضو

Antilinkwa: حذف الرسالة (رابط WA)
Antilinkwav2: حذف الرسالة + طرد (رابط WA)
`;
        await sendMessage(sock, remoteJid, responseText.trim(), message);
    } catch (error) {
        console.error(`Error in handle function: ${error.message} \nحدث خطأ في دالة المعالجة: ${error.message}`);
    }
}

module.exports = {
    handle,
    Commands: ['antilink'],
    OnlyPremium: false,
    OnlyOwner: false,
};