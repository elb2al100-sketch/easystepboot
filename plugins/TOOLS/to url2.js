const { downloadQuotedMedia, downloadMedia, reply } = require('@lib/utils');
const path = require("path");
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');

// Function to upload file to Catbox.moe temporary storage
// دالة لرفع الملفات على خدمة Catbox.moe المؤقتة
async function uploadToCatbox(filePath) {
    try {
        const form = new FormData();
        form.append('reqtype', 'fileupload');
        form.append('fileToUpload', fs.createReadStream(filePath));

        const response = await axios.post('https://catbox.moe/user/api.php', form, {
            headers: {
                ...form.getHeaders()
            }
        });
        return response.data;
    } catch (error) {
        console.error('Upload failed:', error.response ? error.response.data : error.message);
        throw new Error('Upload to Catbox failed. / فشل الرفع إلى Catbox.');
    }
}

async function handle(sock, messageInfo) {
    const { m, remoteJid, message, isQuoted, type, prefix, command } = messageInfo;
    try {
        // Check media type (image, sticker, video, audio, document)
        // التحقق من نوع الوسائط (صورة، ملصق، فيديو، صوت، مستند)
        const mediaType = isQuoted ? isQuoted.type : type;
        if (!['image', 'sticker','video','audio','document'].includes(mediaType)) {
            return await reply(
                m, 
                `⚠️ _Send/Reply to a document/media with caption *${prefix + command}*_ \n⚠️ أرسل/رد على ملف/وسائط مع كتابة *${prefix + command}*`
            );
        }

        // Send "Processing" reaction
        // إرسال رمز تعبيري "جارٍ المعالجة"
        await sock.sendMessage(remoteJid, { react: { text: "🤌🏻", key: message.key } });

        // Download media
        // تنزيل الوسائط
        const media = isQuoted ? await downloadQuotedMedia(message) : await downloadMedia(message);
        const mediaPath = path.join('tmp', media);

        if (!fs.existsSync(mediaPath)) {
            throw new Error('Media file not found after download. / ملف الوسائط غير موجود بعد التنزيل.');
        }

        // Upload to Catbox
        // رفع الملف إلى Catbox
        const result = await uploadToCatbox(mediaPath);

        // Send link to user
        // إرسال الرابط للمستخدم
        await reply(
            m, 
            `_✅ Upload successful! / تم الرفع بنجاح!_\n📎 *Link / الرابط*: ${result}`
        );

        // Delete temporary file
        // حذف الملف المؤقت بعد الرفع
        fs.unlinkSync(mediaPath);
    } catch (error) {
        console.error("Error in handle function:", error);

        // Send error message to user
        // إرسال رسالة خطأ للمستخدم
        await sock.sendMessage(
            remoteJid, 
            { text: "⚠️ Sorry, an error occurred during upload. Please try again later! / عذراً، حدث خطأ أثناء الرفع. حاول مرة أخرى لاحقاً!" }, 
            { quoted: message }
        );
    }
}

module.exports = {
    handle,
    Commands: ["tourl2"],       // Command to upload media and get a Catbox link / أمر لرفع الوسائط والحصول على رابط Catbox
    OnlyPremium: false,          // Available to all users / متاح لجميع المستخدمين
    OnlyOwner: false,
    limitDeduction: 1,           // Number of usage limits to deduct / عدد الحدود التي سيتم خصمها
};