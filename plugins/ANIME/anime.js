const ApiAutoresbot = require('api-autoresbot'); 
// Import autoresbot API client / استيراد عميل API لأوتوريسبوت
const mess          = require('@mess'); 
// Import messages / استيراد الرسائل الجاهزة
const config        = require("@config"); 
// Import configuration / استيراد إعدادات التكوين
const { getBuffer } = require('@lib/utils'); 
// Utility function to download file as buffer / دالة مساعدة لتحويل التحميل إلى buffer
const sharp         = require('sharp'); 
// Image processing library / مكتبة لمعالجة الصور
const { logCustom } = require("@lib/logger"); 
// Custom logger / مسجل مخصص

async function handle(sock, messageInfo) {
    const { remoteJid, message, command, content } = messageInfo;
    // Destructure message information / فك خصائص الرسالة

    try {
        // Send loading reaction / إرسال رد فعل 😎
        await sock.sendMessage(remoteJid, { react: { text: "😎", key: message.key } });

        // Call API / استدعاء API
        const api = new ApiAutoresbot(config.APIKEY);
        const response = await api.get('/api/anime', { method: command });

        // Check if response and data exist / التحقق من وجود البيانات
        if (response && response.data) {
            const buffer = await getBuffer(response.data);

            // Ensure buffer is an image / التأكد أن البيانات صورة
            let imageBuffer;
            const metadata = await sharp(buffer).metadata();

            if (metadata.format === 'gif') {
                // Convert GIF to static JPEG / تحويل GIF إلى JPEG ثابت
                imageBuffer = await sharp(buffer).toFormat('jpeg').toBuffer();
            } else if (['jpeg', 'png', 'webp'].includes(metadata.format)) {
                // Use original buffer / استخدام الصورة كما هي
                imageBuffer = buffer;
            } else {
                throw new Error('Received file is not a valid image.'); 
                // الملف المستلم ليس صورة صالحة
            }

            // Log the command / تسجيل الأمر
            logCustom('info', content, `ERROR-COMMAND-ANIME-${command}.txt`);

            // Send image with success caption / إرسال الصورة مع رسالة نجاح
            await sock.sendMessage(remoteJid, {
                image: imageBuffer,
                caption: mess.general.success
            }, { quoted: message });
        } else {
            // Log empty data / تسجيل البيانات الفارغة
            logCustom('info', content, `ERROR-COMMAND-${command}.txt`);

            // Notify user no data available / إعلام المستخدم بعدم وجود بيانات
            await sock.sendMessage(remoteJid, {
                text: "Sorry, no data available for this request."
            }, { quoted: message });
        }
    } catch (error) {
        // Log error / تسجيل الخطأ
        logCustom('info', content, `ERROR-COMMAND-${command}.txt`);

        // Notify user of error / إخطار المستخدم بوجود خطأ
        await sock.sendMessage(remoteJid, {
            text: `Sorry, an error occurred while processing your request. Please try again later.\n\n${error}`
        }, { quoted: message });
    }
}

module.exports = {
    handle,
    Commands: [
        'waifu', 'neko', 'shinobu', 'megumin', 'bully', 'cuddle', 'cry', 'hug', 'awoo',
        'kiss', 'lick', 'pat', 'smug', 'bonk', 'yeet', 'blush', 'smile', 'wave', 'highfive',
        'handhold', 'nom', 'bite', 'glomp', 'slap', 'kill', 'happy', 'wink', 'poke', 'dance', 'cringe'
    ],
    OnlyPremium     : false, // Not limited to premium users / غير مقيد بالمستخدمين المميزين
    OnlyOwner       : false, // Not limited to owner / غير مقيد بالمالك
    limitDeduction  : 1      // Amount to deduct from user limit / مقدار الخصم من حد استخدام المستخدم
};