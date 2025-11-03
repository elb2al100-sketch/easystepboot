const mess = require('@mess'); 
// Template messages / قوالب الرسائل
const config = require("@config"); 
// Bot configuration / إعدادات البوت
const { getGroupMetadata } = require("@lib/cache"); 
// Get group metadata / جلب بيانات المجموعة
const { determineUser } = require('@lib/utils'); 
// Determine user from mention, quoted or text / تحديد المستخدم من الإشارة أو الرسالة المقتبسة أو النص

async function handle(sock, messageInfo) {
    const { remoteJid, isGroup, message, sender, mentionedJid, isQuoted, content, prefix, command } = messageInfo;
    
    if (!isGroup) return; // Only for groups / مخصص للمجموعات فقط

    try {
        // Get group metadata / الحصول على بيانات المجموعة
        const groupMetadata = await getGroupMetadata(sock, remoteJid);
        const participants = groupMetadata.participants;

        // Check if sender is admin / التحقق من أن المرسل مشرف
        const isAdmin = participants.some(participant => participant.id === sender && participant.admin);
        if (!isAdmin) {
            await sock.sendMessage(remoteJid, { text: mess.general.isAdmin }, { quoted: message });
            return;
        }

        // Determine which user to kick / تحديد المستخدم للطرد
        const userToAction = determineUser(mentionedJid, isQuoted, content);
        if (!userToAction) {
            return await sock.sendMessage(
                remoteJid,
                { text: `_⚠️ Usage Format:_ \n\n_💬 Example:_ _*${prefix + command} @NAME*_` },
                { quoted: message }
            );
        }

        // Prevent kicking the bot itself / منع طرد البوت نفسه
        if(`${config.phone_number_bot}@s.whatsapp.net` === userToAction) {
            return await sock.sendMessage(
                remoteJid,
                { text: `⚠️ _Cannot kick the bot itself_ / لا يمكن طرد البوت نفسه` },
                { quoted: message }
            );
        }

        // Kick the user from the group / طرد المستخدم من المجموعة
        const kickResult = await sock.groupParticipantsUpdate(remoteJid, [userToAction], 'remove');

        if (kickResult && mess.action.user_kick) {
            return await sock.sendMessage(
                remoteJid,
                { text: mess.action.user_kick }, // Success message / رسالة النجاح
                { quoted: message }
            );
        }
    } catch (error) {
        console.error('Error handling kick:', error);

        // Send error message / إرسال رسالة خطأ
        await sock.sendMessage(
            remoteJid,
            { text: '⚠️ An error occurred while trying to kick the user. Make sure the bot has permissions. / حدث خطأ أثناء محاولة طرد المستخدم. تأكد من أن البوت لديه الصلاحيات.' },
            { quoted: message }
        );
    }
}

module.exports = {
    handle,
    Commands    : ['kick'], // Command name / اسم الأمر
    OnlyPremium : false,    // Not restricted to premium users / ليس مقتصرًا على المستخدمين المميزين
    OnlyOwner   : false,    // Not restricted to owner / ليس مقتصرًا على المالك
};