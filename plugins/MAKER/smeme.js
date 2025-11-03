const { downloadQuotedMedia, downloadMedia, uploadTmpFile } = require("@lib/utils");
const { sendImageAsSticker } = require("@lib/exif");
const sharp = require("sharp");
const fs = require("fs");
const path = require("path");
const ApiAutoresbot = require("api-autoresbot");
const config = require("@config");

async function handle(sock, messageInfo) {

    const { remoteJid, message, type, isQuoted, content, prefix, command } = messageInfo;
    try {
        // ⚠️ Check if there is no text or content / تحقق إذا لم يُرسل المستخدم نصًا أو محتوى
        if (!content) {
            return sock.sendMessage(
                remoteJid,
                {
                    text: `_⚠️ Usage Format / تنسيق الاستخدام:_ \n\n_💬 Example / مثال:_ _*${prefix + command} resbot*_`,
                },
                { quoted: message }
            );
        }

        // ⏳ Send reaction to show it's processing / إرسال رد فعل لإظهار أنه يتم المعالجة
        await sock.sendMessage(remoteJid, { react: { text: "🤌🏻", key: message.key } });

        const mediaType = isQuoted ? isQuoted.type : type;

        // 🖼️ Process only image or sticker / معالجة الصور أو الملصقات فقط
        if (mediaType !== "image" && mediaType !== "sticker") {
            return sock.sendMessage(
                remoteJid,
                { text: `⚠️ Send or reply to an image with caption *${prefix + command}* / ⚠️ أرسل أو رد على صورة مع كتابة *${prefix + command}*` },
                { quoted: message }
            );
        }

        // ✍️ Split meme text (upper | lower) / تقسيم النص إلى جزأين (أعلى | أسفل)
        const [smemeText1 = '', smemeText2 = ''] = (content || '').split('|');

        // 📥 Download media / تنزيل الوسائط
        const media = isQuoted
            ? await downloadQuotedMedia(message)
            : await downloadMedia(message);

        const mediaPath = path.join("tmp", media);
        if (!fs.existsSync(mediaPath)) {
            throw new Error("Media file not found after download / لم يتم العثور على ملف الوسائط بعد التنزيل.");
        }

        // 🔑 Initialize API with key / تهيئة واجهة الـ API باستخدام المفتاح
        const api = new ApiAutoresbot(config.APIKEY);
        const upload = await uploadTmpFile(mediaPath);

        if (upload.status) {
            const url = upload.fileUrl;

            // 🧩 Generate meme using API / إنشاء ميم باستخدام الـ API
            const buffer = await api.getBuffer("/api/maker/smeme", {
                text: smemeText1,     // النص الأول (أعلى)
                text2: smemeText2,    // النص الثاني (أسفل)
                pp: url,              // رابط الصورة
                width: 500,
                height: 500,
            });

            // 🔄 Convert to webp for sticker / تحويل إلى WebP لاستخدامه كملصق
            const webpBuffer = await sharp(buffer).webp().toBuffer();

            const options = {
                packname: config.sticker_packname,
                author: config.sticker_author,
            };

            // 📤 Send as sticker / إرسال النتيجة كملصق
            await sendImageAsSticker(sock, remoteJid, webpBuffer, options, message);
        }

    } catch (error) {
        console.error(error);
        // ❌ Send error message / إرسال رسالة خطأ عند حدوث مشكلة
        await sock.sendMessage(
            remoteJid,
            { text: "❌ Sorry, an error occurred. Please try again later! / عذرًا، حدث خطأ. يرجى المحاولة لاحقًا!" },
            { quoted: message }
        );
    }
}

module.exports = {
    handle,
    Commands: ["smeme"],          // اسم الأمر / Command name
    OnlyPremium: false,           // لا يقتصر على المستخدمين المميزين / Not for premium only
    OnlyOwner: false,             // ليس للمالك فقط / Not owner-only
    limitDeduction: 1,            // خصم نقطة واحدة من الحد اليومي / Deduct 1 from user limit
};