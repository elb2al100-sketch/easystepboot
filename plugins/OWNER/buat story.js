const { downloadQuotedMedia, downloadMedia } = require("@lib/utils");
const fs = require("fs");
const { readUsers } = require("@lib/users");

async function handle(sock, messageInfo) {
    const { remoteJid, message, content, type, isQuoted, prefix, command } = messageInfo;

    try {
        // Read user data
        // قراءة بيانات المستخدمين
        const pengguna = await readUsers();

        // Get all user IDs (jids)
        // الحصول على جميع معرفات المستخدمين
        const statusJidList = Object.keys(pengguna);

        const nomorTanpaBroadcast = statusJidList.filter(jid => jid !== 'status@broadcast');

        // Download media and determine media type
        // تحميل الوسائط وتحديد نوع الوسائط
        const media = isQuoted ? await downloadQuotedMedia(message) : await downloadMedia(message);
        const mediaType = isQuoted ? `${isQuoted.type}Message` : `${type}Message`;
        let mediaContent = content?.trim() ? content : isQuoted?.content?.caption || "";

        // Validate empty message
        // التحقق من الرسالة الفارغة
        if (!media && (!mediaContent || mediaContent.trim() === '')) {
            const tex = `_⚠️ Usage Format | صيغة الاستخدام:_ \n\n_💬 Example | مثال:_ _*${prefix + command} test*_`;
            return await sock.sendMessage(
                remoteJid,
                { text: tex },
                { quoted: message }
            );
        }

        if (media) {
            const mediaPath = `tmp/${media}`;

            // Check if file exists
            // التحقق من وجود الملف
            if (!fs.existsSync(mediaPath)) {
                throw new Error(`Media file not found | الملف غير موجود: ${mediaPath}`);
            }

            // Send media according to type
            // إرسال الوسائط حسب النوع
            await sendMedia(sock, 'status@broadcast', mediaType, mediaPath, mediaContent, nomorTanpaBroadcast);
        } else {
            await sock.sendMessage(
                'status@broadcast',
                { text: mediaContent },
                { statusJidList : nomorTanpaBroadcast }
            );
        }

        return await sock.sendMessage(
            remoteJid,
            { text: "✅ WhatsApp status successfully sent | تم إرسال الحالة بنجاح" },
            { quoted: message }
        );

    } catch (error) {
        console.error("Error processing message:", error);
        await sock.sendMessage(
            remoteJid,
            { text: "❌ An error occurred while processing the message | حدث خطأ أثناء معالجة الرسالة" }
        );
    }
}

// Function to send media
// دالة لإرسال الوسائط
async function sendMedia(sock, remoteJid, type, mediaPath, caption, statusJidList) {
    const mediaOptions = {
        audioMessage: { audio: fs.readFileSync(mediaPath) },
        imageMessage: { image: fs.readFileSync(mediaPath), caption },
        videoMessage: { video: fs.readFileSync(mediaPath), caption },
        documentMessage: { document: fs.readFileSync(mediaPath), caption },
    };

    if (mediaOptions[type]) {
        await sock.sendMessage(
            remoteJid,
            mediaOptions[type],
            { statusJidList }
        );
    } else {
        throw new Error(`Unsupported media type | نوع الوسائط غير مدعوم: ${type}`);
    }
}

module.exports = {
    handle,
    Commands    : ['buatstory', 'buatstori','upsw'],
    OnlyPremium : false,
    OnlyOwner   : true
};