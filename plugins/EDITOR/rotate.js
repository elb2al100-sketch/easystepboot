const fs = require("fs");
const sharp = require("sharp");
const mess = require('@mess');
const { downloadQuotedMedia, downloadMedia } = require("@lib/utils");

/**
 * Handle the rotate command
 * معالجة أمر تدوير الصورة
 */
async function handle(sock, messageInfo) {
    const { remoteJid, message, content, isQuoted, type, prefix, command } = messageInfo;

    // Determine media type
    // تحديد نوع الوسائط
    const mediaType = isQuoted ? `${isQuoted.type}Message` : `${type}Message`;

    // Validate media type
    // التحقق من نوع الوسائط
    if (mediaType !== 'imageMessage') {
        await sock.sendMessage(
            remoteJid,
            { text: `⚠️ _Send/Reply an image with caption *${prefix + command}*_`
            // ⚠️ _أرسل/رد على صورة مع التعليق *${prefix + command}*_
            },
            { quoted: message }
        );
        return;
    }

    // Validate rotation input
    // التحقق من صحة زاوية التدوير
    const rotationAngle = parseInt(content, 10);
    if (isNaN(rotationAngle) || rotationAngle < 1 || rotationAngle > 360) {
        await sock.sendMessage(
            remoteJid,
            { text: '⚠️ _Enter rotation angle between 1 - 360_'
            // ⚠️ _أدخل زاوية التدوير بين 1 و360_
            },
            { quoted: message }
        );
        return;
    }

    try {
        // Download media
        // تحميل الصورة
        const media = isQuoted ? await downloadQuotedMedia(message) : await downloadMedia(message);
        const mediaPath = `tmp/${media}`;

        // Ensure file exists before processing
        // التأكد من وجود الملف قبل المعالجة
        if (!fs.existsSync(mediaPath)) {
            await sock.sendMessage(
                remoteJid,
                { text: '⚠️ _Image file not found._'
                // ⚠️ _لم يتم العثور على ملف الصورة_
                },
                { quoted: message }
            );
            return;
        }

        // Show "Loading" reaction
        // إظهار رد فعل "جارٍ التحميل"
        await sock.sendMessage(remoteJid, { react: { text: "😇", key: message.key } });

        // Rotate the image
        // تدوير الصورة
        const outputImagePath = `tmp/tmp_rotate_${Date.now()}.jpg`;
        await sharp(mediaPath).rotate(rotationAngle).toFile(outputImagePath);

        // Send the rotated image
        // إرسال الصورة بعد التدوير
        await sock.sendMessage(
            remoteJid,
            {
                image: { url: outputImagePath },
                caption: mess.general.success, // رسالة نجاح عامة
            },
            { quoted: message }
        );
    
    } catch (error) {
        console.error("Error processing image:", error);
        await sock.sendMessage(
            remoteJid,
            { text: '_An error occurred while processing the image._'
            // _حدث خطأ أثناء معالجة الصورة_
            },
            { quoted: message }
        );
    }
}

module.exports = {
    handle,
    Commands        : ['rotate'],
    OnlyPremium     : false,
    OnlyOwner       : false,
    limitDeduction  : 1
};