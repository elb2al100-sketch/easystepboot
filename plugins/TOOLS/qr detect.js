const { downloadQuotedMedia, downloadMedia } = require("@lib/utils");
const { reply } = require("@lib/utils");
const fs = require("fs");
const path = require("path");
const Jimp = require("jimp");
const QrCode = require("qrcode-reader");

async function handle(sock, messageInfo) {
    const { m, remoteJid, message, prefix, command, content, isQuoted, type } = messageInfo;

    try {
        // Send reaction emoji 🤌🏻 to indicate processing
        // إرسال رمز تعبيري 🤌🏻 كإشارة إلى المعالجة
        await sock.sendMessage(remoteJid, { react: { text: "🤌🏻", key: message.key } });

        // Determine media type (image required)
        // تحديد نوع الوسائط (الصورة مطلوبة)
        const mediaType = isQuoted ? isQuoted.type : type;
        if (mediaType !== 'image') {
            return await reply(m, `⚠️ _Send/Reply to an image with caption *${prefix + command}*_ \n⚠️ _أرسل/رد على صورة مع التعليق *${prefix + command}*_`);
        }

        // Download the image
        // تنزيل الصورة
        const media = isQuoted ? await downloadQuotedMedia(message) : await downloadMedia(message);
        const mediaPath = path.join("tmp", media);
        
        if (!fs.existsSync(mediaPath)) {
            throw new Error("Media file not found after download. / لم يتم العثور على ملف الوسائط بعد التنزيل.");
        }

        // Read the image using Jimp
        // قراءة الصورة باستخدام Jimp
        const img = await Jimp.read(mediaPath);
        const qr = new QrCode();

        // Decode QR code from the image
        // فك شفرة رمز الاستجابة السريعة (QR) من الصورة
        const qrResult = await new Promise((resolve, reject) => {
            qr.callback = (err, value) => {
                if (err) return reject("❌ QR Code not detected in the image. / لم يتم اكتشاف رمز QR في الصورة.");
                resolve(value.result);
            };
            qr.decode(img.bitmap);
        });

        // Send detected QR code result
        // إرسال نتيجة رمز QR المكتشف
        await reply(m, `✅ QR Code Detected / تم اكتشاف رمز QR:\n${qrResult}`);

        // Optional: delete the media file if no longer needed
        // اختياري: حذف ملف الوسائط إذا لم يعد مطلوبًا
        fs.unlinkSync(mediaPath);

    } catch (error) {
        console.error("Error in handle function:", error);

        const errorMessage = error.message || "An unknown error occurred. / حدث خطأ غير معروف.";
        return await sock.sendMessage(
            remoteJid,
            { text: `_Error: ${errorMessage}_` },
            { quoted: message }
        );
    }
}

module.exports = {
    handle,
    Commands: ["detectqr"], // Command to detect QR code / الأمر لاكتشاف رمز QR
    OnlyPremium: false,
    OnlyOwner: false,
    limitDeduction: 1, // Number of limit deductions / عدد الخصم من الحد
};