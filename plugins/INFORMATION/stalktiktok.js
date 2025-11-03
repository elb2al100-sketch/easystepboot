const ApiAutoresbot = require('api-autoresbot');
const config = require('@config');
const { logCustom } = require("@lib/logger");

async function handle(sock, messageInfo) {
    const { remoteJid, message, prefix, command, content } = messageInfo;

    try {
        // English: Trim content and validate
        // العربية: إزالة المسافات والتحقق من المحتوى
        const trimmedContent = content.trim();

        if (!trimmedContent) {
            return await sendErrorMessage(
                sock,
                remoteJid,
                `_Enter TikTok Username | أدخل اسم المستخدم في TikTok_\n\nExample | مثال: _${prefix + command} kompascom_`,
                message
            );
        }

        const user_id = trimmedContent;

        // English: Send loading reaction
        // العربية: إرسال رد فعل التحميل
        await sock.sendMessage(remoteJid, { react: { text: '😎', key: message.key } });

        // English: Initialize API and call endpoint
        // العربية: تهيئة API واستدعاء Endpoint
        const api = new ApiAutoresbot(config.APIKEY);
        const response = await api.get('/api/stalker/tiktok', { username: user_id });

        // English: Validate API response
        // العربية: التحقق من استجابة الـ API
        if (response?.data) {
            const { nickname, desc, avatar, follower, following } = response.data;

            // English: Format TikTok data
            // العربية: تنسيق بيانات TikTok
            const resultTiktok = `
*STALKER TIKTOK*

◧ *Username | اسم المستخدم*: ${user_id || 'Unknown | غير معروف'}
◧ *Nickname | الاسم المستعار*: ${nickname || 'Unknown | غير معروف'}
◧ *Description | الوصف*: ${desc || 'Unknown | غير معروف'}
◧ *Follower | المتابعين*: ${follower || 'Unknown | غير معروف'}
◧ *Following | يتابعون*: ${following || 'Unknown | غير معروف'}
`;

            try {
                // English: Send image if avatar exists
                // العربية: إرسال الصورة إذا كانت موجودة
                if (Array.isArray(avatar) && avatar[0]) {
                    return await sock.sendMessage(
                        remoteJid,
                        { image: { url: avatar[0] }, caption: resultTiktok },
                        { quoted: message }
                    );
                }
            } catch (error) {
                console.warn('Failed to send avatar image | فشل إرسال صورة البروفايل:', error.message || error);
            }

            // English: Send text if avatar fails or unavailable
            // العربية: إرسال النص إذا لم تتوفر الصورة أو حدث خطأ
            return await sock.sendMessage(remoteJid, { text: resultTiktok }, { quoted: message });
        }

        logCustom('info', content, `ERROR-COMMAND-${command}.txt`);
        // English: If no data found
        // العربية: إذا لم يتم العثور على بيانات
        await sendErrorMessage(sock, remoteJid, 'Sorry, no TikTok user data found | عذرًا، لم يتم العثور على بيانات المستخدم في TikTok.', message);

    } catch (error) {
        console.error('Error | خطأ:', error);
        logCustom('info', content, `ERROR-COMMAND-${command}.txt`);

        // English: Handle error and notify user
        // العربية: معالجة الخطأ وإبلاغ المستخدم
        await sendErrorMessage(
            sock, 
            remoteJid, 
            `Sorry, an error occurred while processing your request | عذرًا، حدث خطأ أثناء معالجة طلبك.\n\n*Details | التفاصيل*: ${error.message || error}`, 
            message
        );
    }
}

// English: Utility function to send error messages
// العربية: دالة مساعدة لإرسال رسائل الأخطاء
async function sendErrorMessage(sock, remoteJid, text, quotedMessage) {
    await sock.sendMessage(remoteJid, { text }, { quoted: quotedMessage });
}

module.exports = {
    handle,
    Commands: ['stalktiktok'],
    OnlyPremium: false,
    OnlyOwner: false,
    limitDeduction: 1, // English: Deduct 1 limit per use | العربية: خصم 1 عند الاستخدام
};