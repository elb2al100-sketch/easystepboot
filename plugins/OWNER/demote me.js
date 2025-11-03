// DEMOTEME: Demote owner to member if bot is already admin
// DEMOTEME: تحويل المالك إلى عضو إذا كان البوت مسؤول بالفعل

const mess = require("@mess");

async function handle(sock, messageInfo) {
    const { remoteJid, message, sender, isGroup } = messageInfo;

    try {
        // Check if the chat is a group / التحقق إذا كانت المحادثة مجموعة
        if(!isGroup) {
            return await sock.sendMessage(
                remoteJid,
                { text: mess.general.isGroup }, // e.g., "_This command can only be used in groups_" / "_هذا الأمر يمكن استخدامه فقط في المجموعات_"
                { quoted: message }
            );
        }

        // Demote the sender / عملية تخفيض رتبة المرسل
        await sock.groupParticipantsUpdate(remoteJid, [sender], 'demote');
    
        // Send success message / إرسال رسالة النجاح
        await sock.sendMessage(
            remoteJid,
            { text: '✅ _Successfully demoted to member_' },
            // ✅ _تم تحويلك بنجاح إلى عضو_
            { quoted: message }
        );

    } catch (error) {
        console.error("Error in demoteme command:", error);

        // Send error message / إرسال رسالة الخطأ
        await sock.sendMessage(
            remoteJid,
            { text: '⚠️ _An error occurred while trying to demote to member. Make sure the bot is already an admin._' }
            // ⚠️ _حدث خطأ أثناء محاولة تخفيض الرتبة إلى عضو. تأكد أن البوت مسؤول بالفعل._
            ,
            { quoted: message }
        );
    }
}

// Export module info / تصدير بيانات الموديول
module.exports = {
    handle,
    Commands    : ['demoteme'], // command name / اسم الأمر
    OnlyPremium : false,        // only premium? / للمميزين فقط؟ لا
    OnlyOwner   : true          // only owner? / للمالك فقط؟ نعم
};