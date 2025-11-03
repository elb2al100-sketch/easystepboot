const { downloadQuotedMedia, downloadMedia } = require("@lib/utils");
const { sendImageAsSticker } = require("@lib/exif");
const config = require("@config");
const fs = require("fs");
const path = require("path");

async function handle(sock, messageInfo) {
    const { remoteJid, message, type, isQuoted, prefix, command } = messageInfo;

    try {
        const mediaType = isQuoted ? isQuoted.type : type;

        // 🖼️ Check if media is image or video / تحقق مما إذا كانت الوسائط صورة أو فيديو
        if (mediaType === "image" || mediaType === "video") {
            // 📥 Download media / تنزيل الوسائط
            const media = isQuoted
                ? await downloadQuotedMedia(message)
                : await downloadMedia(message);

            const mediaPath = path.join("tmp", media);

            if (!fs.existsSync(mediaPath)) {
                throw new Error("Media file not found after download / لم يتم العثور على ملف الوسائط بعد التنزيل.");
            }

            // 📂 Read the downloaded file / قراءة الملف الذي تم تنزيله
            const buffer = fs.readFileSync(mediaPath);

            const options = {
                packname: config.sticker_packname, // اسم حزمة الملصق / Sticker pack name
                author: config.sticker_author,     // اسم المؤلف / Author name
            };

            // 📤 Send the sticker / إرسال الملصق
            await sendImageAsSticker(sock, remoteJid, buffer, options, message);

            // 🧹 Delete temporary file / حذف الملف المؤقت
            fs.unlinkSync(mediaPath);
        } else {
            // ⚠️ If not image or video / إذا لم تكن الوسائط صورة أو فيديو
            await sock.sendMessage(
                remoteJid,
                {
                    text: `⚠️ Send or reply to an image/video with caption *${prefix + command}* 
                    ⚠️ أرسل أو رد على صورة أو فيديو مع كتابة *${prefix + command}*`,
                },
                { quoted: message }
            );
        }
    } catch (error) {
        console.error("❌ Error while processing sticker / خطأ أثناء معالجة الملصق:", error);
        await sock.sendMessage(
            remoteJid,
            {
                text: "❌ Sorry, an error occurred. Please try again later! / عذرًا، حدث خطأ. يرجى المحاولة لاحقًا!",
            },
            { quoted: message }
        );
    }
}

module.exports = {
    handle,
    Commands    : ["sticker", "stiker", "s"], // أسماء الأوامر / Command names
    OnlyPremium : false, // غير مخصص للمستخدمين المميزين فقط / Not premium-only
    OnlyOwner   : false  // ليس للمالك فقط / Not owner-only
};