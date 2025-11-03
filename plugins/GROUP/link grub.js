const mess = require('@mess');
const { getGroupMetadata } = require("@lib/cache");

async function handle(sock, messageInfo) {
    const { remoteJid, message, sender, isGroup } = messageInfo;

    try {
        // English: Check if the command is executed in a group
        // العربية: التحقق ما إذا كان الأمر في مجموعة
        if (!isGroup) {
            return await sock.sendMessage(
                remoteJid,
                { text: mess.general.isGroup }, // Pesan "Hanya untuk grup"
                { quoted: message }
            );
        }

        // English: Get group metadata (name, id)
        // العربية: الحصول على بيانات المجموعة (الاسم، المعرف)
        const groupMetadata = await getGroupMetadata(sock, remoteJid);

        // English: Get group invite code
        // العربية: الحصول على كود دعوة المجموعة
        const groupInviteCode = await sock.groupInviteCode(remoteJid);

        // English & Arabic: Prepare response text with invite link
        const text = `https://chat.whatsapp.com/${groupInviteCode}`;

        // English: Send response message
        // العربية: إرسال رابط الدعوة
        return await sock.sendMessage(
            remoteJid,
            { text },
            { quoted: message }
        );

    } catch (error) {
        console.error('Error getting group link:', error);

        // English & Arabic: Send error message if something went wrong
        await sock.sendMessage(
            remoteJid,
            { text: '⚠️ _Failed to display group link._ \n\n_Make sure the Bot is an admin._ \n\n⚠️ _فشل في عرض رابط المجموعة._ \n\n_تأكد أن البوت مسؤول في المجموعة._' },
            { quoted: message }
        );
    }
}

module.exports = {
    handle,
    Commands    : ['linkgrup', 'linkgroup', 'linkgc', 'linkgrub', 'linkgroub'], // Command aliases | أسماء الأوامر
    OnlyPremium : false,
    OnlyOwner   : false
};