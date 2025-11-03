// SLR: Set Slow Response Message for Admins
// SLR: ضبط رسالة الاستجابة البطيئة للمشرفين

const mess                  = require('@mess');
// Import general messages
// استدعاء الرسائل العامة

const { addSlr }            = require("@lib/slr");
// Import function to set slow response feature
// استدعاء دالة لتعيين ميزة الاستجابة البطيئة

const { getGroupMetadata }  = require("@lib/cache");
// Import function to get group metadata
// استدعاء دالة للحصول على بيانات المجموعة

async function handle(sock, messageInfo) {
    const { remoteJid, isGroup, message, sender, isQuoted, content, prefix, command, mentionedJid } = messageInfo;

    // Only allow messages from groups
    // يسمح فقط برسائل المجموعات
    if (!isGroup) return;

    // Get group metadata
    // الحصول على بيانات المجموعة
    const groupMetadata = await getGroupMetadata(sock, remoteJid);
    const participants  = groupMetadata.participants;

    // Check if sender is an admin
    // التحقق مما إذا كان المرسل مشرفًا
    const isAdmin = participants.some(participant => participant.id === sender && participant.admin);
    if (!isAdmin) {
        await sock.sendMessage(remoteJid, { text: mess.general.isAdmin }, { quoted: message });
        return;
    }

    // Validate if content is empty
    // التحقق من أن المحتوى غير فارغ
    if (!content) {
        return await sock.sendMessage(
            remoteJid,
            { text: `_⚠️ Usage Format:_ \n\n_💬 Example:_ _*${prefix + command} admin is currently slow response*_ \n\n_To disable this feature type *.slr off*_ / \n_لإيقاف هذه الميزة اكتب *.slr off*_` },
            { quoted: message }
        );
    }

    // If content is 'off', disable SLR
    // إذا كان المحتوى "off"، يتم تعطيل ميزة الاستجابة البطيئة
    if (content.toLowerCase() == 'off') {
        await addSlr(remoteJid, false, '');
        return await sock.sendMessage(
            remoteJid,
            { text: `✅ _SLR has been successfully turned off / تم إيقاف SLR بنجاح_` },
            { quoted: message }
        );
    } else {
        // Otherwise, set the slow response message
        // وإلا، يتم تعيين رسالة الاستجابة البطيئة
        await addSlr(remoteJid, true, content.trim());
        return await sock.sendMessage(
            remoteJid,
            { text: `✅ _SLR has been successfully set / تم تعيين SLR بنجاح_` },
            { quoted: message }
        );
    }

}

module.exports = {
    handle,
    Commands    : ['slr'],
    OnlyPremium : false,
    OnlyOwner   : false,
};