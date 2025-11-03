const { downloadQuotedMedia, downloadMedia } = require("@lib/utils");
const fs = require("fs");
const mess = require('@mess');
const path = require("path");
const ApiAutoresbot = require("api-autoresbot");
const config = require("@config");

async function handle(sock, messageInfo) {
    const { remoteJid, message, type, isQuoted, content, prefix, command } = messageInfo;

    try {
        // Determine the media type (quoted or direct)
        // تحديد نوع الوسائط (رد أو مباشر)
        const mediaType = isQuoted ? isQuoted.type : type;

        if (mediaType === "sticker") {
            // Send "processing" reaction
            // إرسال رمز تعبيري "جارٍ المعالجة"
            await sock.sendMessage(remoteJid, { react: { text: "🤌🏻", key: message.key } });
       
            // Download the sticker
            // تنزيل الملصق
            const media = isQuoted
                ? await downloadQuotedMedia(message)
                : await downloadMedia(message);

            const mediaPath = path.join("tmp", media);
            if (!fs.existsSync(mediaPath)) {
                throw new Error("Media file not found after download. / ملف الوسائط غير موجود بعد التنزيل.");
            }

            // Upload sticker to API
            // رفع الملصق إلى API
            const api = new ApiAutoresbot(config.APIKEY);
            const response = await api.tmpUpload(mediaPath);

            if (!response || response.code !== 200) {
                throw new Error("Upload failed or no URL returned. / فشل التحميل أو لم يتم إرجاع رابط.");
            }

            const url = response.data.url;

            // Convert GIF/sticker to image
            // تحويل الملصق إلى صورة
            const buffer = await api.getBuffer("/api/convert/giftoimage", { url });

            // Send converted image to user
            // إرسال الصورة المحوّلة للمستخدم
            await sock.sendMessage(
                remoteJid,
                {
                    image: buffer,
                    caption: mess.general.success, // Success message / رسالة النجاح
                },
                { quoted: message }
            );
        } else {
            // If not a sticker, send usage warning
            // إذا لم يكن الملصق، إرسال تحذير الاستخدام
            return await sock.sendMessage(
                remoteJid,
                { text:`⚠️ _Send/Reply to a sticker with caption *${prefix + command}*_ \n⚠️ أرسل/رد على ملصق مع كتابة *${prefix + command}*` },
                { quoted: message }
            );
        }
    } catch (error) {
        console.log(error);

        // Send error message
        // إرسال رسالة خطأ
        await sock.sendMessage(
            remoteJid,
            { text: "⚠️ Sorry, an error occurred. Please try again later! / عذراً، حدث خطأ. حاول مرة أخرى لاحقاً!" },
            { quoted: message }
        );
    }
}

module.exports = {
    handle,
    Commands        : ["toimg"], // Command to convert sticker to image / أمر لتحويل الملصق إلى صورة
    OnlyPremium     : false,     // Available to all users / متاح لجميع المستخدمين
    OnlyOwner       : false,
    limitDeduction  : 1          // Number of usage limits to deduct / عدد الحدود التي سيتم خصمها
};