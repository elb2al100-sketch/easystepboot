const mess = require("@mess");
// Import general messages
// استدعاء الرسائل العامة

const { getGroupMetadata } = require("@lib/cache");
// Import function to get group metadata
// استدعاء دالة للحصول على بيانات المجموعة

// Helper function to send text messages
// دالة مساعدة لإرسال الرسائل النصية
async function sendTextMessage(sock, remoteJid, text, quoted) {
    return await sock.sendMessage(remoteJid, { text }, { quoted });
}

async function handle(sock, messageInfo) {
    const { remoteJid, message, sender, content, isQuoted } = messageInfo;

    try {
        // Get group metadata
        // الحصول على بيانات المجموعة
        const groupMetadata = await getGroupMetadata(sock, remoteJid);
        const participants  = groupMetadata.participants;

        // Check if sender is an admin
        // التحقق مما إذا كان المرسل مشرفًا
        const isAdmin = participants.some(participant => participant.id === sender && participant.admin);
        if(!isAdmin) {
            await sock.sendMessage(remoteJid, { text: mess.general.isAdmin }, { quoted: message });
            return;
        }

        // Default message if no content provided
        // الرسالة الافتراضية إذا لم يتم تقديم محتوى
        const messageContent = content?.trim() || "empty / فارغ";

        // Build text with mentions for all members
        // إنشاء نص مع الإشارة لجميع الأعضاء
        let teks = `══✪〘 *👥 Tag All* 〙✪══\n➲ *Message / رسالة: ${messageContent}*\n\n`;
        const mentions = participants.map((member) => {
            teks += `⭔ @${member.id.split("@")[0]}\n`;
            return member.id;
        });

        // Send message with mentions
        // إرسال الرسالة مع الإشارات
        await sock.sendMessage(
            remoteJid,
            { text: teks, mentions },
            { quoted: message }
        );
    } catch (error) {
        console.error("Error:", error);
        // Handle error by sending a message to the user
        // التعامل مع الخطأ عن طريق إرسال رسالة للمستخدم
        await sendTextMessage(sock, remoteJid, `⚠️ An error occurred / حدث خطأ: ${error.message}`, message);
    }
}

module.exports = {
    handle,
    Commands    : ["tagall"],
    OnlyPremium : false,
    OnlyOwner   : false
};