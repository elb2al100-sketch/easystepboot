const fs = require('fs');
const path = require('path');
const { downloadQuotedMedia, downloadMedia, reply, convertAudioToCompatibleFormat } = require('@lib/utils');

async function handle(sock, messageInfo) {
    const { remoteJid, message, isQuoted, prefix, command } = messageInfo;

    // Determine the type of media (quoted or direct)
    // تحديد نوع الوسائط (رد أو مباشر)
    const mediaType = isQuoted ? isQuoted.type : type;
    if (mediaType !== 'audio') {
        // If not audio, reply with usage message
        // إذا لم يكن الصوت، الرد برسالة الاستخدام
        return await reply(m, `⚠️ _Reply to an Audio with caption *${prefix + command}*_ \n⚠️ الرد على الصوت مع كتابة *${prefix + command}*`);
    }

    // Send "processing" reaction
    // إرسال رمز تعبيري "جارٍ المعالجة"
    await sock.sendMessage(remoteJid, { react: { text: "🤌🏻", key: message.key } });

    // Download the audio file
    // تنزيل ملف الصوت
    const media = isQuoted
        ? await downloadQuotedMedia(message)
        : await downloadMedia(message);

    const mediaPath = path.join('tmp', media);
    if (!fs.existsSync(mediaPath)) {
        throw new Error('Media file not found after download. / ملف الوسائط غير موجود بعد التنزيل.');
    }

    const baseDir = process.cwd(); // Current working directory / الدليل الحالي
    const inputPath = path.join(baseDir, mediaPath); // Original file / الملف الأصلي

    try {
        // Ensure tmp folder exists
        // التأكد من وجود مجلد tmp
        if (!fs.existsSync(path.join(baseDir, 'tmp'))) {
            fs.mkdirSync(path.join(baseDir, 'tmp'), { recursive: true });
        }

        // Convert audio to compatible M4A format
        // تحويل الصوت إلى صيغة M4A متوافقة
        const output = await convertAudioToCompatibleFormat(inputPath);

        // Send converted audio to user
        // إرسال الصوت المحوّل للمستخدم
        await sock.sendMessage(
            remoteJid,
            {
                audio: { url: output },
                mimetype: 'audio/mp4', // Keep as audio/mp4 for M4A / الحفاظ على audio/mp4 لصيغة M4A
            },
            { quoted: message }
        );

    } catch (error) {
        console.error('Error while sending audio:', error);

        // Send detailed error message to user
        // إرسال رسالة خطأ مفصلة للمستخدم
        const errorMessage = `⚠️ Sorry, an error occurred while processing your request. Please try again later. / عذراً، حدث خطأ أثناء معالجة طلبك. حاول مرة أخرى لاحقاً.\n\nError Details / تفاصيل الخطأ: ${error.message || error}`;
        await sendMessageWithQuote(sock, remoteJid, message, errorMessage);
    }
}

// Helper function to send message quoting original message
// دالة مساعدة لإرسال الرسالة مع اقتباس الرسالة الأصلية
async function sendMessageWithQuote(sock, remoteJid, message, text) {
    await sock.sendMessage(remoteJid, { text }, { quoted: message });
}

module.exports = {
    handle,
    Commands    : ['tom4a'], // Command to convert audio to M4A / أمر لتحويل الصوت إلى M4A
    OnlyPremium : false,      // Available to all users / متاح لجميع المستخدمين
    OnlyOwner   : false,
    limitDeduction  : 1,      // Number of usage limits to deduct / عدد الحدود التي سيتم خصمها
};