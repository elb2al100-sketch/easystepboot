const mess = require('@mess');
const { getProfilePictureUrl } = require("@lib/cache");

async function handle(sock, messageInfo) {
    const { remoteJid, message, sender, mentionedJid, content, isQuoted } = messageInfo;

    try {
        let target;

        // English: Send reaction when command is received
        // العربية: إرسال رد فعل عند استلام الأمر
        await sock.sendMessage(remoteJid, { react: { text: "🫣", key: message.key } });

        // English: Determine target user
        // العربية: تحديد المستخدم الهدف
        if (isQuoted) {
            target = isQuoted.sender; // English: If quoted message, use quoted sender | العربية: إذا كانت الرسالة مقتبسة، استخدم المرسل المقتبس
        } else if (content && /^[0-9]{10,15}$/.test(content)) {
            target = `${content}@s.whatsapp.net`; // English: If phone number, convert to JID | العربية: إذا كان رقم هاتف، حوّله إلى JID
        } else {
            target = (mentionedJid && mentionedJid.length > 0) ? mentionedJid[0] : sender; // English: If mentioned, use mentioned user | العربية: إذا تم منشن شخص، استخدمه
        }

        // English: Get profile picture URL
        // العربية: الحصول على رابط صورة البروفايل
        const profilePictureUrl = await getProfilePictureUrl(sock, target);

        // English: Send message with profile picture
        // العربية: إرسال رسالة مع صورة البروفايل
        await sock.sendMessage(
            remoteJid,
            {
                image: { url: profilePictureUrl },
                caption: mess.general.success, // English: Success message | العربية: رسالة نجاح
            },
            { quoted: message }
        );
    } catch (error) {
        console.error('Error handling profile picture request:', error.message);

        // English: Send error message if something goes wrong
        // العربية: إرسال رسالة خطأ إذا حدث أي خطأ
        await sock.sendMessage(
            remoteJid,
            {
                text: '⚠️ _An error occurred while displaying the profile picture_\n⚠️ _حدث خطأ أثناء عرض صورة البروفايل_',
            },
            { quoted: message }
        );
    }
}

module.exports = {
    handle,
    Commands    : ['getpic'], // English: Command to get profile picture | العربية: أمر للحصول على صورة البروفايل
    OnlyPremium : false,
    OnlyOwner   : false
};