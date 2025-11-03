// Import required modules / استيراد المكتبات المطلوبة
const { getGroupMetadata } = require("@lib/cache");
const { downloadQuotedMedia, downloadMedia } = require("@lib/utils");
const fs = require("fs");
const path = require("path");

// Main handler function / الدالة الرئيسية لمعالجة الأمر
async function handle(sock, messageInfo) {
    const { remoteJid, message, content, prefix, command, isQuoted, type } = messageInfo;

    try {
        // Validate empty input or incorrect format / التحقق من الإدخال الفارغ أو الصيغة الخاطئة
        if (!content || content.trim() === '') {
            return sendErrorMessage(sock, remoteJid, message, prefix, command);
        }

        // Split group ID and message from content / فصل معرف المجموعة والرسالة من المحتوى
        const [groupId, groupMessage] = content.trim().split('|').map(part => part.trim());

        if (!groupId || !groupMessage) {
            return sendErrorMessage(sock, remoteJid, message, prefix, command);
        }

        // Send temporary reaction while processing / إرسال رمز انتظار أثناء المعالجة
        await sock.sendMessage(remoteJid, { react: { text: "🤌🏻", key: message.key } });

        // Get group metadata / الحصول على بيانات المجموعة
        const groupMetadata = await getGroupMetadata(sock, groupId).catch(() => null);
        if (!groupMetadata) {
            return await sock.sendMessage(
                remoteJid,
                { text: `⚠️ Invalid group ID or group not found.` }
                // ⚠️ معرف المجموعة غير صالح أو لم يتم العثور على المجموعة
                ,
                { quoted: message }
            );
        }

        const participants = groupMetadata.participants;

        // Determine message type / تحديد نوع الرسالة
        const mediaType = isQuoted ? `${isQuoted.type}Message` : `${type}Message`;

        // Send message with media if it's an image / إرسال الرسالة مع الوسائط إذا كانت صورة
        if (mediaType === 'imageMessage') {
            const media = isQuoted ? await downloadQuotedMedia(message) : await downloadMedia(message);
            const mediaPath = path.join("tmp", media);

            if (!fs.existsSync(mediaPath)) {
                throw new Error("Media file not found after download.");
                // الملف الوسيط غير موجود بعد التحميل
            }

            const buffer = fs.readFileSync(mediaPath);
            await sock.sendMessage(
                groupId,
                {
                    image: buffer,
                    caption: groupMessage,
                    mentions: participants.map(p => p.id) // Mention all participants / منشن لجميع المشاركين
                }
            );
            return;

        } else {
            // Send as text message / إرسال كرسالة نصية
            await sock.sendMessage(
                groupId,
                {
                    text: groupMessage,
                    mentions: participants.map(p => p.id), // Mention all participants / منشن لجميع المشاركين
                }
            );
        }
    } catch (error) {
        console.error('An error occurred:', error);
        // Send error message / إرسال رسالة خطأ
        await sock.sendMessage(
            remoteJid,
            { text: `⚠️ An error occurred while processing the command.` }
            // ⚠️ حدث خطأ أثناء معالجة الأمر
            ,
            { quoted: message }
        );
    }
}

// Function to send error message with correct format / دالة لإرسال رسالة خطأ مع التنسيق الصحيح
function sendErrorMessage(sock, remoteJid, message, prefix, command) {
    return sock.sendMessage(
        remoteJid,
        {
            text: `Please enter a valid group ID in the correct format.

Example:
${prefix + command} 1234567889@g.us | Message you want to send`
            // الرجاء إدخال معرف المجموعة بصيغة صحيحة
            // مثال:
            // ${prefix + command} 1234567889@g.us | الرسالة التي تريد إرسالها
        },
        { quoted: message }
    );
}

// Export module info / تصدير بيانات الموديول
module.exports = {
    handle,
    Commands    : ['gctag'], // Command name / اسم الأمر
    OnlyPremium : false,     // Only premium users? / للمميزين فقط؟ لا
    OnlyOwner   : true       // Only owner? / للمالك فقط؟ نعم
};