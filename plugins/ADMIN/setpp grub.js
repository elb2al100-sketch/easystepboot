// SET GROUP PROFILE PICTURE: Change the group profile picture
// تعيين صورة ملف تعريف المجموعة: تغيير صورة ملف تعريف المجموعة

const { downloadQuotedMedia, downloadMedia } = require("@lib/utils");
// Import utility functions to download media from messages
// استدعاء دوال مساعدة لتحميل الوسائط من الرسائل

const { getGroupMetadata } = require("@lib/cache");
// Import function to get group metadata
// استدعاء دالة للحصول على بيانات المجموعة

const path = require("path");
// Import path module
// استدعاء مكتبة المسارات

const mess = require("@mess");
// Import general messages
// استدعاء الرسائل العامة

const mainDir = path.dirname(require.main.filename);
// Get the main directory of the project
// الحصول على المجلد الرئيسي للمشروع

async function handle(sock, messageInfo) {
    const { remoteJid, isGroup, message, type, isQuoted, prefix, command, sender } = messageInfo;

    // Only allow messages from groups
    // يسمح فقط برسائل المجموعات
    if (!isGroup) return;

    try {
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

        // React to the message with a clock emoji
        // الرد على الرسالة برمز ساعة
        await sock.sendMessage(remoteJid, { react: { text: "🫡", key: message.key } });
 
        // Download media (image) and determine media type
        // تحميل الوسائط (صورة) وتحديد نوع الوسائط
        const media = isQuoted
            ? await downloadQuotedMedia(message)
            : await downloadMedia(message);
        const mediaType = isQuoted
            ? `${isQuoted.type}Message`
            : `${type}Message`;

        // If the media is an image, update the group profile picture
        // إذا كانت الوسائط صورة، تحديث صورة ملف تعريف المجموعة
        if (media && mediaType === "imageMessage") {
            const groupId = groupMetadata.id;
            const mediaPath = path.join(mainDir, "./tmp/", media);

            // Update bot's profile picture
            // تحديث صورة ملف تعريف البوت
            await sock.updateProfilePicture(groupId, { url: mediaPath });

            // Send confirmation message
            // إرسال رسالة تأكيد
            return await sock.sendMessage(
                remoteJid,
                { text: `_Success, Group Profile Picture Has Been Updated / تم التحديث بنجاح، تم تغيير صورة ملف تعريف المجموعة_` },
                { quoted: message }
            );
        }

        // If media is invalid, send instruction message
        // إذا كانت الوسائط غير صالحة، إرسال رسالة تعليمات
        return await sock.sendMessage(
            remoteJid,
            { text: `⚠️ _Send/Reply to an image with caption *${prefix + command}* / أرسل/رد على صورة مع كتابة *${prefix + command}*_` },
            { quoted: message }
        );
    } catch (error) {
        console.error("Error processing message:", error);

        // Send error message
        // إرسال رسالة خطأ
        await sock.sendMessage(remoteJid, {
            text: "⚠️ _Error changing Group Profile Picture. Make sure the bot is admin / حدث خطأ أثناء تغيير صورة المجموعة. تأكد أن البوت مشرف_",
        });
    }
}

module.exports = {
    handle,
    Commands    : ["setppgc","setppgroub","setppgrub","setppgroup","setppgrup"],
    OnlyPremium : false,
    OnlyOwner   : false
};