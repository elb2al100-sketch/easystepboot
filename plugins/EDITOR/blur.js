const fs = require("fs");
const sharp = require("sharp");
const mess = require('@mess');
const { downloadQuotedMedia, downloadMedia } = require("@lib/utils");

/**
 * Validate if the message contains an image
 * التحقق مما إذا كانت الرسالة تحتوي على صورة
 */
async function validateMediaType(sock, remoteJid, message, mediaType, prefix, command) {
    if (mediaType !== 'imageMessage') {
        await sock.sendMessage(
            remoteJid,
            { 
                text: `⚠️ _Send/Reply an image with caption *${prefix + command}*_` 
                // ⚠️ _أرسل/رد على صورة مع التعليق *${prefix + command}*_
            },
            { quoted: message }
        );
        return false;
    }
    return true;
}

/**
 * Validate blur level input and normalize it for sharp
 * التحقق من مستوى التمويه وتحويله لقيمة مناسبة لمكتبة sharp
 */
async function validateBlurLevel(content, sock, remoteJid, message) {
    const blurLevel = parseFloat(content);

    // Validate blur level between 1 and 100
    // التحقق من أن قيمة التمويه بين 1 و 100
    if (isNaN(blurLevel) || blurLevel < 1 || blurLevel > 100) {
        await sock.sendMessage(
            remoteJid,
            { text: '⚠️ _Enter a blur value between 1 - 100_' 
            // ⚠️ _أدخل قيمة تمويه بين 1 - 100_
            },
            { quoted: message }
        );
        return false;
    }

    // Normalize blur for sharp (0.1 – 10)
    // تحويل القيمة لتناسب مكتبة sharp
    const sigma = (blurLevel / 100) * 9.9 + 0.1;
    return sigma;
}

/**
 * Apply blur effect to image
 * تطبيق تأثير التمويه على الصورة
 */
async function processImage(mediaPath, sigma) {
    const outputImagePath = `tmp/tmp_blurred_${Date.now()}.jpg`;
    await sharp(mediaPath).blur(sigma).toFile(outputImagePath);
    return outputImagePath;
}

/**
 * Main handler for the blur command
 * المعالج الرئيسي لأمر التمويه
 */
async function handle(sock, messageInfo) {
    const { remoteJid, message, content, isQuoted, type, prefix, command } = messageInfo;

    const mediaType = isQuoted ? `${isQuoted.type}Message` : `${type}Message`;

    // Validate media type
    // التحقق من نوع الوسائط
    if (!await validateMediaType(sock, remoteJid, message, mediaType, prefix, command)) return;

    // Validate and normalize blur level
    // التحقق من مستوى التمويه وتحويله
    const sigma = await validateBlurLevel(content, sock, remoteJid, message);
    if (!sigma) return;

    try {
        // Download media
        // تحميل الوسائط
        const media = isQuoted ? await downloadQuotedMedia(message) : await downloadMedia(message);
        const mediaPath = `tmp/${media}`;

        // Ensure the file exists
        // التأكد من وجود الملف
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

        // Process the image with blur
        // معالجة الصورة بالتمويه
        const outputImagePath = await processImage(mediaPath, sigma);

        // Send processed image if exists
        // إرسال الصورة بعد التمويه إذا كانت موجودة
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
            throw new Error("Blurred file not found.");
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
    Commands        : ['blur'],
    OnlyPremium     : false,
    OnlyOwner       : false,
    limitDeduction  : 1
};