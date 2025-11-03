const fs = require("fs");
const sharp = require("sharp");
const mess = require('@mess');
const { downloadQuotedMedia, downloadMedia } = require("@lib/utils");

/**
 * Handle the flipx command
 * معالجة أمر قلب الصورة أفقيًا (Flip X)
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
    
    try {
        // Download media
        // تحميل الصورة
        const media = isQuoted ? await downloadQuotedMedia(message) : await downloadMedia(message);
        const mediaPath = `tmp/${media}`;

        // Ensure the file exists before processing
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

        const outputImagePath = `tmp/tmp_flipx${Date.now()}.jpg`;

        // Apply horizontal flip (mirror effect)
        // تطبيق قلب الصورة أفقيًا (تأثير المرآة)
        await sharp(mediaPath).flip().toFile(outputImagePath);

        // Ensure processed file exists and send it
        // التأكد من وجود الملف الناتج وإرساله
        if (fs.existsSync(outputImagePath)) {
            await sock.sendMessage(
                remoteJid,
                {
                    image: { url: outputImagePath },
                    caption: mess.general.success, // رسالة نجاح عامة
                },
                { quoted: message }
            );
        } else {
            throw new Error("Flipped file not found.");
        }
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
    Commands        : ['flipx'],
    OnlyPremium     : false,
    OnlyOwner       : false,
    limitDeduction  : 1
};