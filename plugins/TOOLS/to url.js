const { downloadQuotedMedia, downloadMedia, reply } = require('@lib/utils');
const FormData = require("form-data");
const fs = require("fs-extra");
const path = require("path");
const axios = require('axios');

// Function to upload a file to autoresbot temporary server
// دالة لتحميل الملف على خادم Autoresbot المؤقت
async function upload(filePath) {
    try {
        const form = new FormData();
        form.append('expired', '6months'); // Options: 1minute, 1hour, 1day, 1month, 6months / خيارات: دقيقة واحدة، ساعة، يوم، شهر، 6 أشهر
        form.append('file', fs.createReadStream(filePath));

        const response = await axios.put(
            "https://autoresbot.com/tmp-files/upload",
            form,
            {
                headers: {
                    ...form.getHeaders(),
                    'Referer': 'https://autoresbot.com/',
                    'User-Agent': 'Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Mobile Safari/537.36 Edg/126.0.0.0'
                }
            }
        );
        return response.data;
    } catch (error) {
        console.log(error)
        return false;
    }
}

async function handle(sock, messageInfo) {
    const { m, remoteJid, message, isQuoted, type, content, prefix, command } = messageInfo;
    try {
        // Determine media type (image or sticker)
        // تحديد نوع الوسائط (صورة أو ملصق)
        const mediaType = isQuoted ? isQuoted.type : type;
        if (mediaType !== 'image' && mediaType !== 'sticker' ) {
            return await reply(
                m, 
                `⚠️ _Send/Reply to an image/sticker with the caption *${prefix + command}*_ \n⚠️ أرسل/رد على صورة/ملصق مع كتابة *${prefix + command}*`
            );
        }

        // Send "Processing" reaction
        // إرسال رمز تعبيري "جارٍ المعالجة"
        await sock.sendMessage(remoteJid, { react: { text: "🤌🏻", key: message.key } });

        // Download the media (quoted or direct)
        // تنزيل الوسائط (مقتبسة أو مباشرة)
        const media = isQuoted
            ? await downloadQuotedMedia(message)
            : await downloadMedia(message);
        const mediaPath = path.join('tmp', media);

        if (!fs.existsSync(mediaPath)) {
            throw new Error('Media file not found after download. / ملف الوسائط غير موجود بعد التنزيل.');
        }

        // Upload media and get the result
        // رفع الوسائط والحصول على الرابط الناتج
        const result = await upload(mediaPath);

        // Send the link and expiry info to the user
        // إرسال الرابط ومدة انتهاء صلاحيته للمستخدم
        await reply(
            m, 
            `_Link_  : ${result.fileUrl}\n\n_Expired_ : ${result.expired}\n_الرابط_ : ${result.fileUrl}\n_انتهاء الصلاحية_ : ${result.expired}`
        );

    } catch (error) {
        console.error("Error in handler:", error);

        // Send error message to the user
        // إرسال رسالة خطأ للمستخدم
        await sock.sendMessage(
            remoteJid,
            { text: "Sorry, an error occurred. Please try again later! / عذراً، حدث خطأ. حاول مرة أخرى لاحقاً!" },
            { quoted: message }
        );
    }
}

module.exports = {
    handle,
    Commands    : ["tourl"],           // Command to upload media and get a temporary URL / أمر لتحميل الوسائط والحصول على رابط مؤقت
    OnlyPremium : false,                // Available for all users / متاح لجميع المستخدمين
    OnlyOwner   : false,
    limitDeduction  : 1,                // Number of usage limits to deduct / عدد الحدود التي سيتم خصمها
};