const { getGroupMetadata } = require("@lib/cache");
const { downloadQuotedMedia, downloadMedia } = require("@lib/utils");
const fs = require("fs");

/**
 * Delay function in seconds / دالة تأخير بالثواني
 * @param {number} duration
 * @returns {Promise<void>}
 */
async function delay(duration) {
    return new Promise(resolve => setTimeout(resolve, duration * 1000));
}

/**
 * Send usage error message / إرسال رسالة خطأ في الصيغة
 */
function sendErrorMessage(sock, remoteJid, message, prefix, command) {
    return sock.sendMessage(
        remoteJid,
        {
            text: `_⚠️ Usage Format / صيغة الاستخدام:_ \n\n_💬 Example / مثال:_ _*${prefix + command} 123xxx@g.us | Text to send / النص المراد إرساله*_`
        },
        { quoted: message }
    );
}

async function handle(sock, messageInfo) {
    const { remoteJid, message, content, isQuoted, type } = messageInfo;
    const delaySeconds = 5; // Delay time in seconds / وقت التأخير بالثواني

    try {
        // Validate empty or incorrect input / تحقق من إدخال فارغ أو غير صالح
        if (!content || !content.trim()) {
            return sendErrorMessage(sock, remoteJid, message, messageInfo.prefix, messageInfo.command);
        }

        const [groupId, text] = content.split('|').map(item => item.trim());

        // Validate group and text / تحقق من صحة المجموعة والنص
        if (!groupId || !text || !groupId.includes('@g.us')) {
            return sendErrorMessage(sock, remoteJid, message, messageInfo.prefix, messageInfo.command);
        }

        // Send reaction to indicate processing / إرسال رد فعل لإظهار أن العملية جارية
        await sock.sendMessage(remoteJid, { react: { text: "🤌🏻", key: message.key } });

        // Fetch group metadata / جلب بيانات المجموعة
        const metadata = await getGroupMetadata(sock, groupId);
        if (!metadata) {
            return await sock.sendMessage(
                remoteJid,
                { text: '❌ Group not found / لم يتم العثور على المجموعة.' },
                { quoted: message }
            );
        }

        // Filter participants ending with '.net' / تصفية الأعضاء الذين تنتهي أرقامهم بـ '.net'
        const allUsers = metadata.participants
            .filter(v => v.id.endsWith('.net'))
            .map(v => v.id);

        if (allUsers.length === 0) {
            return await sock.sendMessage(
                remoteJid,
                { text: '⚠️ _No contacts matched the filter / لا يوجد جهات اتصال مطابقة للفلتر._' },
                { quoted: message }
            );
        }

        // Download media if needed / تحميل الوسائط إذا لزم الأمر
        let buffer = null;
        const mediaType = isQuoted ? `${isQuoted.type}Message` : `${type}Message`;
        if (mediaType === 'imageMessage') {
            const mediaPath = isQuoted
                ? await downloadQuotedMedia(message)
                : await downloadMedia(message);

            if (mediaPath && fs.existsSync(mediaPath)) {
                buffer = fs.readFileSync(mediaPath);
            } else {
                throw new Error("❌ Media file not found after download / الملف غير موجود بعد التحميل.");
            }
        }

        const messageContent = buffer
            ? { image: buffer, caption: text }
            : { text };

        // Send message to all users with delay / إرسال الرسالة لجميع الأعضاء مع التأخير
        for (const user of allUsers) {
            await sock.sendMessage(user, messageContent);
            console.log(`Message sent to / تم إرسال الرسالة إلى ${user}`);
            await delay(delaySeconds);
        }

        // Send success confirmation / إرسال رسالة تأكيد النجاح
        await sock.sendMessage(
            remoteJid,
            { text: `✅ _Message successfully sent to ${allUsers.length} contacts / تم إرسال الرسالة بنجاح إلى ${allUsers.length} جهة اتصال._` },
            { quoted: message }
        );

    } catch (error) {
        console.error('Error occurred / حدث خطأ:', error);
        await sock.sendMessage(
            remoteJid,
            { text: '⚠️ _An error occurred while processing the command / حدث خطأ أثناء معالجة الأمر._' },
            { quoted: message }
        );
    }
}

module.exports = {
    handle,
    Commands    : ['pushkontak'],
    OnlyPremium : false,
    OnlyOwner   : true
};