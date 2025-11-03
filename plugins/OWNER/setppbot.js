const { downloadQuotedMedia, downloadMedia } = require("@lib/utils");
const config = require("@config");
const path = require("path");
const mainDir = path.dirname(require.main.filename);

async function handle(sock, messageInfo) {
    const { remoteJid, message, type, isQuoted, prefix, command } = messageInfo;

    try {
        // Download media (image) and determine media type
        // تنزيل الوسائط (صورة) وتحديد نوعها
        const media = isQuoted
            ? await downloadQuotedMedia(message)
            : await downloadMedia(message);
        const mediaType = isQuoted
            ? `${isQuoted.type}Message`
            : `${type}Message`;

        if (media && mediaType === "imageMessage") {
            const botJid = `${config.phone_number_bot}@s.whatsapp.net`;
            const mediaPath = path.join(mainDir, "./tmp/", media);

            // Update bot profile picture
            // تحديث صورة بروفايل البوت
            await sock.updateProfilePicture(botJid, { url: mediaPath });

            // Send success message
            // إرسال رسالة نجاح
            return await sock.sendMessage(
                remoteJid,
                { text: `_✅ Successfully updated Bot Profile Picture_\n\n_✅ تم تغيير صورة البوت بنجاح_` },
                { quoted: message }
            );
        }

        // If media is invalid, send instruction
        // إذا كانت الوسائط غير صالحة، أرسل تعليمات للمستخدم
        return await sock.sendMessage(
            remoteJid,
            { text: `⚠️ _Please send/reply to an image with caption *${prefix + command}*_ \n\n⚠️ الرجاء إرسال/الرد على صورة مع الكابتشن *${prefix + command}*_` },
            { quoted: message }
        );
    } catch (error) {
        console.error("Error processing message:", error);

        // Send error message
        // إرسال رسالة خطأ
        await sock.sendMessage(remoteJid, {
            text: "⚠️ An error occurred while processing the message.\n\n⚠️ حدث خطأ أثناء معالجة الرسالة."
        });
    }
}

module.exports = {
    handle,
    Commands    : ["setppbot"],
    OnlyPremium : false,
    OnlyOwner   : true
};