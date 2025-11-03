const { downloadQuotedMedia, downloadMedia } = require("@lib/utils");
const mess = require('@mess');
const fs = require("fs");
const path = require("path");
const ApiAutoresbot = require("api-autoresbot");
const config = require("@config");

async function handle(sock, messageInfo) {
    const { remoteJid, message, type, isQuoted, content, prefix, command } = messageInfo;

    try {

        // Determine media type (must be image)
        // تحديد نوع الوسائط (يجب أن تكون صورة)
        const mediaType = isQuoted ? isQuoted.type : type;
        if (mediaType === "image") {

            // Send "loading" reaction
            // إرسال رمز تعبيري "جارٍ المعالجة"
            await sock.sendMessage(remoteJid, { react: { text: "🤌🏻", key: message.key } });

            // Download the image
            // تنزيل الصورة
            const media = isQuoted
                ? await downloadQuotedMedia(message)
                : await downloadMedia(message);

            const mediaPath = path.join("tmp", media);
            if (!fs.existsSync(mediaPath)) {
                throw new Error("Media file not found after download. / لم يتم العثور على ملف الوسائط بعد التنزيل.");
            }

            // Upload image to API temporarily
            // رفع الصورة مؤقتًا إلى واجهة API
            const api = new ApiAutoresbot(config.APIKEY);
            const response = await api.tmpUpload(mediaPath);

            if (!response || response.code !== 200) {
                throw new Error("File upload failed or no URL returned. / فشل رفع الملف أو لم يتم إرجاع رابط.");
            }
            const url = response.data.url;

            // Remove background from the image using API
            // إزالة خلفية الصورة باستخدام واجهة API
            const buffer = await api.getBuffer("/api/tools/removebg", { url });

            // Send processed image back to chat
            // إرسال الصورة بعد إزالة الخلفية إلى المحادثة
            await sock.sendMessage(
                remoteJid,
                {
                    image: buffer,
                    caption: mess.general.success,
                },
                { quoted: message }
            );
        } else {
            // If media is not image, send error message
            // إذا لم تكن الوسائط صورة، إرسال رسالة خطأ
            return await sock.sendMessage(
                remoteJid,
                { text: `⚠️ _Send/Reply to an image with caption *${prefix + command}*_ \n⚠️ _أرسل/رد على صورة مع التعليق *${prefix + command}*_` },
                { quoted: message }
            );
        }
    } catch (error) {
        // Send generic error message
        // إرسال رسالة خطأ عامة
        await sock.sendMessage(
            remoteJid,
            { text: "❌ Sorry, an error occurred. Please try again later. / عذرًا، حدث خطأ. حاول مرة أخرى لاحقًا!" },
            { quoted: message }
        );
    }
}

module.exports = {
    handle,
    Commands    : ["rmbg","removebg","nobg"], // Commands for removing background / الأوامر لإزالة الخلفية
    OnlyPremium : false,
    OnlyOwner   : false,
    limitDeduction  : 1, // Number of limit deductions / عدد الخصم من الحد
};