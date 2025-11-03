const { downloadQuotedMedia, downloadMedia } = require("@lib/utils");
const { sendImageAsSticker } = require("@lib/exif");
const sharp = require("sharp");
const fs = require("fs");
const path = require("path");
const ApiAutoresbot = require("api-autoresbot");
const config = require("@config");

async function handle(sock, messageInfo) {
    const { remoteJid, message, type, isQuoted, content, prefix, command } = messageInfo;

    try {
        // 💬 Send loading reaction / إرسال رمز تعبيري أثناء المعالجة
        await sock.sendMessage(remoteJid, { react: { text: "🤌🏻", key: message.key } });

        const mediaType = isQuoted ? isQuoted.type : type;

        // 🖼️ Check if media is image or sticker / تحقق مما إذا كانت الوسائط صورة أو ملصق
        if (mediaType === "image" || mediaType === "sticker") {

            // 📥 Download media (quoted or direct) / تنزيل الوسائط سواء من رسالة مقتبسة أو عادية
            const media = isQuoted
                ? await downloadQuotedMedia(message)
                : await downloadMedia(message);

            const mediaPath = path.join("tmp", media);

            if (!fs.existsSync(mediaPath)) {
                throw new Error("Media file not found after download / لم يتم العثور على ملف الوسائط بعد التنزيل");
            }

            // 🌐 Upload the file to API server / رفع الملف إلى خادم API
            const api = new ApiAutoresbot(config.APIKEY);
            const response = await api.tmpUpload(mediaPath);

            if (!response || response.code !== 200) {
                throw new Error("File upload failed or URL not found / فشل رفع الملف أو لم يتم العثور على الرابط");
            }

            const url = response.data.url;

            // 🎞️ Convert WebP to Video using API / تحويل الملصق إلى فيديو عبر الـ API
            const buffer = await api.getBuffer("/api/convert/webptovideo", { url });

            // 🌀 If command is 'togif', send as looping GIF / إذا كان الأمر 'togif'، أرسل كـ GIF متكرر
            if (command === "togif") {
                await sock.sendMessage(remoteJid, { 
                    video: buffer,
                    gifPlayback: true, // Enable GIF mode / تشغيل وضع GIF
                    caption: ''
                });
                return;
            }

            // ▶️ Otherwise, send as normal video / وإلا، أرسله كفيديو عادي
            await sock.sendMessage(remoteJid, { 
                video: buffer,
                caption: ''
            });

        } else {
            // ⚠️ Invalid input: not media / إدخال غير صالح: ليست وسائط
            return await sock.sendMessage(
                remoteJid,
                { 
                    text: `⚠️ Send or reply with an image/sticker using caption *${prefix + command}* 
⚠️ أرسل أو رد على صورة أو ملصق مع كتابة *${prefix + command}*` 
                },
                { quoted: message }
            );
        }

    } catch (error) {
        console.log(error);
        // ❌ Error handling / معالجة الأخطاء
        await sock.sendMessage(
            remoteJid,
            { 
                text: "❌ Sorry, an error occurred. Please try again later! / عذرًا، حدث خطأ. يرجى المحاولة لاحقًا!" 
            },
            { quoted: message }
        );
    }
}

module.exports = {
    handle,
    Commands        : ["tovid", "togif"], // أوامر التحويل / Conversion commands
    OnlyPremium     : false,               // ليس للمستخدمين المميزين فقط / Not premium-only
    OnlyOwner       : false,               // ليس للمالك فقط / Not owner-only
    limitDeduction  : 1                    // خصم الحد / Usage cost
};