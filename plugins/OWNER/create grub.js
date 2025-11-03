const mess = require('@mess');

async function handle(sock, messageInfo) {
    const { remoteJid, message, content, prefix, command } = messageInfo;

    try {
        // Input validation | التحقق من إدخال المستخدم
        if (!content || content.trim() === '') {
            const tex = `_⚠️ Usage Format | صيغة الاستخدام:_ \n\n_💬 Example | مثال:_ _*${prefix + command} group name*_`;
            return await sock.sendMessage(remoteJid, { text: tex }, { quoted: message });
        }

        // Create group | إنشاء مجموعة
        const creategc = await sock.groupCreate(content, []);

        // Lock group settings to admins only | قفل إعدادات المجموعة للمسؤولين فقط
        await sock.groupSettingUpdate(creategc.id, 'locked')
            .then(() => console.log('Now *Only Admins Can Edit Group Settings | الآن *المسؤولون فقط يمكنهم تعديل إعدادات المجموعة*'))
            .catch(err => console.error('Error updating group settings | خطأ عند تعديل إعدادات المجموعة:', err));

        // Get group invite link | الحصول على رابط الدعوة للمجموعة
        const response_creategc = await sock.groupInviteCode(creategc.id);

        // Send reply | إرسال الرد
        const replyText = `「 *Create Group | إنشاء مجموعة* 」\n\n_▸ Link | الرابط : https://chat.whatsapp.com/${response_creategc}_`;
        return await sock.sendMessage(remoteJid, { text: replyText }, { quoted: message });

    } catch (error) {
        console.error('Error creating group | خطأ عند إنشاء المجموعة:', error);
        return await sock.sendMessage(
            remoteJid,
            { text: '⚠️ _An error occurred while creating the group | حدث خطأ أثناء إنشاء المجموعة._' },
            { quoted: message }
        );
    }
}

module.exports = {
    handle,
    Commands    : ['creategrup', 'creategroup', 'creategc', 'creategrub', 'creategroub'],
    OnlyPremium : false,
    OnlyOwner   : true
};