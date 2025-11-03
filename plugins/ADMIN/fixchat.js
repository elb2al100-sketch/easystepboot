const mess = require('@mess');
// Message templates / قوالب الرسائل
const { getGroupMetadata } = require("@lib/cache");
// Function to get group metadata / دالة للحصول على بيانات المجموعة

async function handle(sock, messageInfo) {
    const { remoteJid, isGroup, message, sender } = messageInfo;

    if (!isGroup) { // Only for groups / مخصص للمجموعات فقط
        await sock.sendMessage(remoteJid, { text: mess.general.isGroup }, { quoted: message }); 
        return;
    }

    // Get group metadata / الحصول على بيانات المجموعة
    const groupMetadata = await getGroupMetadata(sock, remoteJid);
    const participants = groupMetadata.participants;

    // Check if sender is admin / التحقق مما إذا كان المرسل مسؤول
    const isAdmin = participants.some(p => p.id === sender && p.admin);
    if (!isAdmin) {
        await sock.sendMessage(remoteJid, { text: mess.general.isAdmin }, { quoted: message });
        return;
    }

    try {
        const participantIds = participants.map(p => p.id);

        // Send success message mentioning all participants / إرسال رسالة تأكيد مع ذكر جميع الأعضاء
        await sock.sendMessage(remoteJid, { 
            text: `✅ Group *${groupMetadata.subject}* has been fixed!\nParticipants: ${participantIds.length} members.\n✅ تم إصلاح مجموعة *${groupMetadata.subject}*!\nالمشاركين: ${participantIds.length} عضو.`, 
            mentions: participantIds 
        });

        // If you want to clear a specific message / إذا أردت مسح رسالة معينة
        if (message && message.key && message.key.id) {
            await sock.chatModify(
                { clear: { messages: [{ id: message.key.id, fromMe: message.key.fromMe }] } },
                remoteJid
            );
        }

        // Confirmation message / رسالة تأكيد
        await sock.sendMessage(remoteJid, { text: '✔️ Chat fix successful!\n✔️ تم إصلاح الدردشة بنجاح!' }, { quoted: message });

    } catch (err) {
        console.error('Error fixing chat / خطأ أثناء إصلاح الدردشة:', err);
        await sock.sendMessage(remoteJid, { text: '❌ Failed to fix chat!\n❌ فشل في إصلاح الدردشة!' }, { quoted: message });
    }
}

module.exports = {
    handle,
    Commands    : ['fixchat'],
    OnlyPremium : false, // Available for all users / متاح لجميع المستخدمين
    OnlyOwner   : false, // Not restricted to owner / ليس مقتصرًا على المالك
};