const { getGroupMetadata } = require("@lib/cache");

async function handle(sock, messageInfo) {
    const { remoteJid, message, content, sender, prefix, command } = messageInfo;
    
    try {
        // Validate initial input
        // التحقق من صحة المدخلات الأولية
        if (!content || !content.includes('chat.whatsapp.com')) {
            return await sock.sendMessage(
                remoteJid,
                {
                    text: `_⚠️ Usage Format:_\n\n💬 Example:_ *${prefix + command} https://chat.whatsapp.com/xxxx 628xxxxxxxx*`
                },
                { quoted: message }
            );
        }

        // Send reaction to indicate processing
        // إرسال رد فعل للإشارة إلى بدء المعالجة
        await sock.sendMessage(remoteJid, { react: { text: "🤌🏻", key: message.key } });

        // Extract link and target number
        // استخراج رابط المجموعة والرقم المستهدف
        const parts = content.trim().split(/\s+/);
        const link = parts[0];
        const number = parts[1];

        const groupId = link.split('chat.whatsapp.com/')[1];
        if (!groupId || !number) {
            return await sock.sendMessage(
                remoteJid,
                { text: `⚠️ Invalid format. Make sure to include the group link and number.` },
                { quoted: message }
            );
        }
        
        let groupJid;
        try {
            // Attempt to join the group
            // محاولة الانضمام للمجموعة
            groupJid = await sock.groupAcceptInvite(groupId);
        } catch (e) {
            if (e.message.includes('conflict')) {
                groupJid = `${groupId}@g.us`; // Already joined
            } else {
                return await sock.sendMessage(
                    remoteJid,
                    { text: `⚠️ Failed to join group: ${e.message}` },
                    { quoted: message }
                );
            }
        }

        // Get group metadata
        // الحصول على بيانات المجموعة
        const groupMetadata = await getGroupMetadata(sock, groupJid);
        const participants = groupMetadata.participants;

        const targetJid = number.includes('@s.whatsapp.net') ? number : number.replace(/\D/g, '') + '@s.whatsapp.net';

        const isInGroup = participants.find(p => p.id === targetJid);

        if (!isInGroup) {
            return await sock.sendMessage(
                remoteJid,
                { text: `⚠️ Number is not in the group.` },
                { quoted: message }
            );
        }

        // Promote the member to admin
        // ترقية العضو إلى مشرف
        await sock.groupParticipantsUpdate(groupJid, [targetJid], 'promote');

        return await sock.sendMessage(
            remoteJid,
            { text: `✅ Number ${number} has been promoted to admin in the group.` },
            { quoted: message }
        );

    } catch (error) {
        console.error('An error occurred:', error);
        return await sock.sendMessage(
            remoteJid,
            { text: `⚠️ An error occurred. Make sure the bot has admin rights to manage the group. ${error.message}` },
            { quoted: message }
        );
    }
}

module.exports = {
    handle,
    Commands: ['toadmin'],
    OnlyPremium: false,
    OnlyOwner: true,
};