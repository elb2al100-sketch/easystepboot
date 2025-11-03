const fs = require("fs");
const sharp = require("sharp");
const mess = require('@mess');
const { downloadQuotedMedia, downloadMedia } = require("@lib/utils");

/**
 * Handle the sharpen command
 * معالجة أمر توضيح الصورة (Sharpen)
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

    // Validate sharpness input
    // التحقق من صحة قيمة التوضيح
    const sharpnessLevel = parseFloat(content);
    if (isNaN(sharpnessLevel) || sharpnessLevel < 1 || sharpnessLevel > 100) {
        await sock.sendMessage(
            remoteJid,
            { text: '⚠️ _Enter sharpness value between 1 - 100_'
            // ⚠️ _أدخل قيمة التوضيح بين 1 و100_
            },
            { quoted: message }
        );
        return;
    }

    // Normalize sharpness to sharp's sigma range 0.1 - 10
    // تحويل القيمة إلى نطاق مكتبة sharp
    const sigma = (sharpnessLevel / 100) * 9.9 + 0.1;

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
                { text: '_Image file not found._'
                // _لم يتم العثور على ملف الصورة_
                },
                { quoted: message }
            );
            return;
        }

        // Show "Loading" reaction
        // إظهار رد فعل "جارٍ التحميل"
        await sock.sendMessage(remoteJid, { react: { text: "😇", key: message.key } });

        // Apply sharpen effect
        // تطبيق تأثير التوضيح
        const outputImagePath = `tmp/tmp_sharpen_${Date.now()}.jpg`;
        await sharp(mediaPath).sharpen({ sigma }).toFile(outputImagePath);

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
            throw new Error("Sharpened file not found.");
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
    Commands        : ['tajam'],
    OnlyPremium     : false,
    OnlyOwner       : false,
    limitDeduction  : 1
};