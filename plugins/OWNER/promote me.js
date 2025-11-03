// PROMOTEME: Upgrade the sender to Admin if the bot is already an Admin
// PROMOTEME: ترقية المستخدم إلى مشرف إذا كان البوت مشرفًا بالفعل

const mess = require("@mess");

async function handle(sock, messageInfo) {
    const { remoteJid, message, sender, isGroup } = messageInfo;

    try {
        // Check if the message is from a group
        // تحقق أن الرسالة جاءت من مجموعة
        if (!isGroup) {
            return await sock.sendMessage(
                remoteJid,
                { 
                    text: mess.general.isGroup // General message from mess.js
                    // رسالة عامة من mess.js
                },
                { quoted: message }
            );
        }

        // Promote the user to admin
        // ترقية المستخدم إلى مشرف
        await sock.groupParticipantsUpdate(remoteJid, [sender], 'promote');

        // Send success message
        // إرسال رسالة نجاح
        await sock.sendMessage(
            remoteJid,
            { 
                text: '✅ _Success! You have been promoted to Admin / تم ترقية المستخدم إلى مشرف بنجاح_'
            },
            { quoted: message }
        );

    } catch (error) {
        console.error("Error in promoteme command:", error);

        // Send error message
        // إرسال رسالة خطأ
        await sock.sendMessage(
            remoteJid,
            { 
                text: '⚠️ _Failed to promote to Admin. Make sure the bot is already Admin / فشل الترقية إلى مشرف. تأكد أن البوت مشرف بالفعل_'
            },
            { quoted: message }
        );
    }
}

module.exports = {
    handle,
    Commands    : ['promoteme'], // Command name
    OnlyPremium : false,
    OnlyOwner   : true
};