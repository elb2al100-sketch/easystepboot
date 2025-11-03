const mess  = require('@mess'); 
// Message templates / قوالب الرسائل
const { getGroupMetadata } = require("@lib/cache"); 
// Function to get group metadata / دالة للحصول على بيانات المجموعة

async function handle(sock, messageInfo) {
    const { remoteJid, isGroup, message, isQuoted, sender } = messageInfo;

    if (!isGroup) return; // Only for groups / مخصص للمجموعات فقط

    try {
        // Get group metadata / الحصول على بيانات المجموعة
        const groupMetadata = await getGroupMetadata(sock, remoteJid);
        const participants  = groupMetadata.participants;

        // Check if sender is admin / التحقق مما إذا كان المرسل مسؤول
        const isAdmin = participants.some(participant => participant.id === sender && participant.admin);
        if(!isAdmin) {
            await sock.sendMessage(remoteJid, { text: mess.general.isAdmin }, { quoted: message });
            return;
        }

        // If there is a quoted message, delete that message
        // إذا كانت هناك رسالة مقتبسة، قم بحذفها
        if (isQuoted) {
            await sock.sendMessage(remoteJid, { 
                delete: { 
                    remoteJid, 
                    id: isQuoted.id, 
                    participant: isQuoted.sender 
                } 
            });
        } else {
            // If no quoted message, send warning / إذا لم يتم اقتباس رسالة، أرسل تحذيراً
            await sock.sendMessage(remoteJid,
                { text: '⚠️ _Reply to the message you want to delete_\n⚠️ رد على الرسالة المراد حذفها' },
                { quoted: message }
            );
        }
    } catch (error) {
        console.error("Error handling command:", error);
        // Error message / رسالة الخطأ
        await sock.sendMessage(remoteJid, { text: "⚠️ _An error occurred. Please try again._\n⚠️ حدث خطأ. حاول مرة أخرى." });
    }
}

module.exports = {
    handle,
    Commands    : ['del', 'delete'], // Command names / أسماء الأوامر
    OnlyPremium : false,             // Available for all users / متاح لجميع المستخدمين
    OnlyOwner   : false,             // Not restricted to owner / ليس مقتصرًا على المالك
};