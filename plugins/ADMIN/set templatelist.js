// SETTEMPLATE LIST: Set a specific template list number for the group
// تعيين قائمة القوالب: تعيين رقم محدد لقائمة القوالب في المجموعة

const { setTemplateList } = require("@lib/participants");
// Import function to set the template list
// استدعاء دالة لتعيين قائمة القوالب

const { getGroupMetadata } = require("@lib/cache");
// Import function to get group metadata
// استدعاء دالة للحصول على بيانات المجموعة

const mess = require("@mess");
// Import general messages (error/notification)
// استدعاء رسائل عامة (مثل رسائل الخطأ والإشعارات)

async function handle(sock, messageInfo) {
    const { remoteJid, isGroup, message, content, sender, command, prefix } = messageInfo;

    // Check if message is from a group
    // التحقق مما إذا كانت الرسالة من مجموعة
    if (!isGroup) return;

    // Get metadata of the group
    // الحصول على بيانات المجموعة
    const groupMetadata = await getGroupMetadata(sock, remoteJid);
    const participants = groupMetadata.participants;

    // Check if sender is an admin
    // التحقق مما إذا كان المرسل مشرفًا
    const isAdmin = participants.some(participant => participant.id === sender && participant.admin);
    if (!isAdmin) {
        await sock.sendMessage(remoteJid, { text: mess.general.isAdmin }, { quoted: message });
        return;
    }

    // Validate empty input
    // التحقق من النص الفارغ
    if (!content || !content.trim()) {
        const usageMessage = `⚠️ *Format Usage / صيغة الاستخدام:*

💬 *Example / مثال:* 
_${prefix}${command} 1_

_Only numbers from *1 to 9* are allowed / مسموح فقط بالأرقام من 1 إلى 9_`;

        await sock.sendMessage(remoteJid, { text: usageMessage }, { quoted: message });
        return;
    }

    // Validate input must be number 1-9
    // التحقق من أن المدخلات رقم من 1 إلى 9
    const validNumbers = /^[1-9]$/; // Regex for numbers 1-9
    if (!validNumbers.test(content.trim())) {
        const invalidMessage = `⚠️ _Invalid input! / مدخلات غير صالحة!_

_Only numbers from *1* to *9* are allowed / مسموح فقط بالأرقام من 1 إلى 9_`;
        await sock.sendMessage(remoteJid, { text: invalidMessage }, { quoted: message });
        return;
    }

    // Set the template list
    // تعيين قائمة القوالب
    await setTemplateList(remoteJid, content);

    // Send success message
    // إرسال رسالة نجاح
    const successMessage = `✅ _Template List successfully set / تم تعيين قائمة القوالب بنجاح_

_Type *.list* to view the list / اكتب *.list* لرؤية القائمة_`;

    await sock.sendMessage(remoteJid, { text: successMessage }, { quoted: message });
}

module.exports = {
    handle,
    Commands: ["settemplatelist", "templatelist"], 
    // Command names
    // أسماء الأوامر
    OnlyPremium: false,          
    // Not restricted to premium users
    // غير مقيد للمستخدمين المميزين
    OnlyOwner: false,            
    // Not restricted to owner
    // غير مقيد للمالك فقط
};