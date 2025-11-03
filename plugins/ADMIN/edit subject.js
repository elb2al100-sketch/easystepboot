// Edit Subject: Change Group Title
// تعديل عنوان المجموعة

const mess = require("@mess");
// Message templates / قوالب الرسائل
const { getGroupMetadata } = require("@lib/cache");
// Function to get group metadata / دالة للحصول على بيانات المجموعة

async function handle(sock, messageInfo) {
    const { remoteJid, isGroup, message, sender, content, prefix, command } = messageInfo;
    if (!isGroup) return; // Only for groups / مخصص للمجموعات فقط

    try {
        // Get group metadata / الحصول على بيانات المجموعة
        const groupMetadata = await getGroupMetadata(sock, remoteJid);
        const participants = groupMetadata.participants;

        // Check if sender is admin / التحقق مما إذا كان المرسل مسؤول
        const isAdmin = participants.some(participant => participant.id === sender && participant.admin);
        if (!isAdmin) {
            await sock.sendMessage(remoteJid, { text: mess.general.isAdmin }, { quoted: message });
            return;
        }
        
        // Validate input / التحقق من صحة المحتوى
        if (!content.trim() || content.trim() === '') {
            return await sock.sendMessage(
                remoteJid,
                { text: `_⚠️ Usage Format:_ \n\n_💬 Example:_ _*${prefix + command} new title*_ \n_⚠️ صيغة الاستخدام: *_${prefix + command} عنوان جديد_*` },
                { quoted: message }
            );
        }

        // Update group subject / تحديث اسم المجموعة
        await sock.groupUpdateSubject(remoteJid, content);

        // Send success message / إرسال رسالة نجاح
        await sock.sendMessage(
            remoteJid,
            { text: `✅ _Group name successfully updated!_\n✅ _تم تغيير اسم المجموعة بنجاح!_` },
            { quoted: message }
        );

    } catch (error) {
        console.error("Error in edit subject command:", error);

        // Send error message / إرسال رسالة خطأ
        await sock.sendMessage(
            remoteJid,
            { text: '⚠️ An error occurred while trying to change the group name. Make sure the format is correct and you have permission.\n⚠️ حدث خطأ أثناء محاولة تغيير اسم المجموعة. تأكد من صحة الصيغة وأن لديك الصلاحيات.' },
            { quoted: message }
        );
    }
}

module.exports = {
    handle,
    Commands    : ['editsubjek', 'editsubject','editsubjeck','editjudul'], // Command aliases / أسماء الأوامر
    OnlyPremium : false, // Available for all users / متاح لجميع المستخدمين
    OnlyOwner   : false, // Not restricted to owner / ليس مقتصرًا على المالك
};