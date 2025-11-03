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
            { text: `⚠️ _Send/Reply an image with caption *${prefix + command}*_`
            // ⚠️ _أرسل/رد على صورة مع التعليق *${prefix + command}*_
            },
            { quoted: message }
        );
        return false;
    }
    return true;
}

/**
 * Validate the input size for resizing
 * التحقق من صحة أبعاد الصورة لتغيير الحجم
 */
async function validateSizeInput(content, sock, remoteJid, message) {
    const [width, height] = content.split(' ').map(Number);

    // Check for invalid or missing input
    // التحقق من أن القيم صالحة وليست فارغة
    if (isNaN(width) || isNaN(height) || width < 1 || height < 1) {
        await sock.sendMessage(
            remoteJid,
            { text: '⚠️ _Enter valid dimensions. Example: .resize 100 200_'
            // ⚠️ _أدخل أبعاد صحيحة. مثال: .resize 100 200_
            },
            { quoted: message }
        );
        return false;
    }

    return { width, height };
}

/**
 * Resize the image to the specified width and height
 * تغيير حجم الصورة إلى الأبعاد المحددة
 */
async function processImage(mediaPath, width, height) {
    const outputImagePath = `tmp/tmp_resize_${Date.now()}.jpg`;
    await sharp(mediaPath).resize({ width, height }).toFile(outputImagePath);
    return outputImagePath;
}

/**
 * Main handler for the resize command
 * المعالج الرئيسي لأمر تغيير حجم الصورة
 */
async function handle(sock, messageInfo) {
    const { remoteJid, message, content, isQuoted, type, prefix, command } = messageInfo;

    const mediaType = isQuoted ? `${isQuoted.type}Message` : `${type}Message`;

    // Validate media type
    // التحقق من نوع الوسائط
    if (!await validateMediaType(sock, remoteJid, message, mediaType, prefix, command)) return;

    // Validate and extract resize dimensions
    // التحقق من الأبعاد واستخراجها
    const size = await validateSizeInput(content, sock, remoteJid, message);
    if (!size) return;
    const { width, height } = size;

    try {
        // Download media
        // تحميل الصورة
        const media = isQuoted ? await downloadQuotedMedia(message) : await downloadMedia(message);
        const mediaPath = `tmp/${media}`;

        // Check if the file exists before processing
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

        // Process the image
        // معالجة الصورة
        const outputImagePath = await processImage(mediaPath, width, height);

        // Send the processed image back
        // إرسال الصورة بعد المعالجة
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
    Commands        : ['resize'],
    OnlyPremium     : false,
    OnlyOwner       : false,
    limitDeduction  : 1
};