// RESETLINKGC: Reset group invite link
// إعادة_رابط_المجموعة: إعادة تعيين رابط دعوة المجموعة

const { getGroupMetadata } = require("@lib/cache");
const mess = require("@mess");

async function handle(sock, messageInfo) {
    const { remoteJid, isGroup, message, sender } = messageInfo;

    if (!isGroup) return; // Only group messages
    // الرسائل من المجموعات فقط

    try {
        // Get group metadata
        // الحصول على بيانات المجموعة
        const groupMetadata = await getGroupMetadata(sock, remoteJid);
        const participants  = groupMetadata.participants;

        // Check if sender is admin
        // التحقق إذا كان المرسل مشرف
        const isAdmin = participants.some(
            participant => participant.id === sender && participant.admin
        );

        if(!isAdmin) {
            await sock.sendMessage(
                remoteJid, 
                { text: mess.general.isAdmin }, // "You must be admin"
                { quoted: message }
            );
            return;
        }

        // Revoke group invite link
        // إعادة تعيين رابط الدعوة للمجموعة
        await sock.groupRevokeInvite(remoteJid);

        // Send success message
        // إرسال رسالة نجاح
        await sock.sendMessage(
            remoteJid, 
            { text: mess.action.resetgc }, // "Group link has been reset"
            { quoted: message }
        );

    } catch (error) {
        console.error("Error in resetlinkgc command:", error);

        // Send error message
        // إرسال رسالة خطأ
        await sock.sendMessage(
            remoteJid,
            { text: '⚠️ An error occurred while resetting the group link. Make sure the bot is admin.\n⚠️ حدث خطأ أثناء إعادة تعيين رابط المجموعة. تأكد من أن البوت مشرف.' },
            { quoted: message }
        );
    }
}

module.exports = {
    handle,
    Commands    : ['resetlinkgc','resetlinkgrup','resetlinkgroup','resetlinkgrub','resetlinkgroub'], // Command triggers
    OnlyPremium : false,
    OnlyOwner   : false,
};