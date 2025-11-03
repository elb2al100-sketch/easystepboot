const { downloadQuotedMedia, downloadMedia, reply } = require('@lib/utils');
const fs = require("fs-extra");
const path = require("path");
const ffmpeg = require("fluent-ffmpeg");
const { v4: uuidv4 } = require('uuid');  // To generate a unique UUID / لإنشاء معرف فريد

async function handle(sock, messageInfo) {
    const { m, remoteJid, message, isQuoted, type, content, prefix, command } = messageInfo;
    try {

        // Check if the media type is audio or video
        // التحقق من أن نوع الوسائط صوت أو فيديو
        const mediaType = isQuoted ? isQuoted.type : type;
        if (mediaType !== 'audio' && mediaType !== 'video') {
            return await reply(
                m, 
                `⚠️ _Send/Reply to an Audio/Video with caption *${prefix + command}*_ \n⚠️ أرسل/رد على ملف صوت/فيديو مع كتابة *${prefix + command}*`
            );
        }

        // Send "Processing" reaction
        // إرسال رمز تعبيري "جارٍ المعالجة"
        await sock.sendMessage(remoteJid, { react: { text: "🤌🏻", key: message.key } });

        // Download media
        // تنزيل الوسائط
        const media = isQuoted
            ? await downloadQuotedMedia(message)
            : await downloadMedia(message);

        const mediaPath = path.join('tmp', media);
        if (!fs.existsSync(mediaPath)) {
            throw new Error('Media file not found after download. / ملف الوسائط غير موجود بعد التنزيل.');
        }

        // Use UUID to generate unique file names
        // استخدام UUID لإنشاء أسماء ملفات فريدة
        const inputPath = path.join(__dirname, `${uuidv4()}.mp4`);
        const outputPath = path.join(__dirname, `${uuidv4()}.mp3`);

        // Read the media file into buffer and save with unique name
        // قراءة الملف إلى buffer وحفظه باسم فريد
        const mediaBuffer = fs.readFileSync(mediaPath);
        await fs.writeFile(inputPath, mediaBuffer);

        // Convert video/audio to MP3
        // تحويل الفيديو/الصوت إلى MP3
        await new Promise((resolve, reject) => {
            ffmpeg(inputPath)
                .toFormat('mp3')
                .on('end', resolve)
                .on('error', reject)
                .save(outputPath);
        });

        // Read the output MP3 file
        // قراءة ملف MP3 الناتج
        const outputBuffer = await fs.readFile(outputPath);

        // Send the converted MP3 to the user
        // إرسال ملف MP3 المحول للمستخدم
        await sock.sendMessage(remoteJid, { 
            audio: { url: outputPath },
            mimetype: 'audio/mp4', 
            ptt: true 
        }, { quoted : message });

        // Delete temporary files
        // حذف الملفات المؤقتة
        await fs.unlink(inputPath);
        await fs.unlink(outputPath);

    } catch (error) {
        console.error("Error in handler:", error);

        // Send error message to user
        // إرسال رسالة خطأ للمستخدم
        await sock.sendMessage(
            remoteJid,
            { text: "⚠️ Sorry, an error occurred. Please try again later! / عذراً، حدث خطأ. حاول مرة أخرى لاحقاً!" },
            { quoted: message }
        );
    }
}

module.exports = {
    handle,
    Commands    : ["tovn"],         // Command to convert audio/video to voice note / أمر لتحويل الصوت/الفيديو إلى ملاحظة صوتية
    OnlyPremium : false,             // Available to all users / متاح لجميع المستخدمين
    OnlyOwner   : false,
    limitDeduction  : 1,             // Number of limits to deduct / عدد الحدود التي سيتم خصمها
};