// SET WELCOME MESSAGE: Set the welcome message for the group
// تعيين رسالة الترحيب: تعيين رسالة الترحيب للمجموعة

const { setWelcome } = require("@lib/participants");
// Import function to set welcome message
// استدعاء دالة لتعيين رسالة الترحيب

const { getGroupMetadata } = require("@lib/cache");
// Import function to get group metadata
// استدعاء دالة للحصول على بيانات المجموعة

const mess = require("@mess");
// Import general messages (error/notification)
// استدعاء رسائل عامة (مثل رسائل الخطأ والإشعارات)

async function handle(sock, messageInfo) {
    const { remoteJid, isGroup, message, content, sender, command, prefix } = messageInfo;

    // Check if the message is from a group
    // التحقق مما إذا كانت الرسالة من مجموعة
    if (!isGroup) return;

    // Get metadata of the group
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

    // Validate empty input
    // التحقق من النص الفارغ
    if (!content || !content.trim()) {
        const MSG = `_⚠️ Usage Format / صيغة الاستخدام:_ \n\n_💬 Example / مثال:_ _*${prefix + command} Welcome @name*__
        
_*List of Variables / قائمة المتغيرات*_

${global.group.variable}`;
        return await sock.sendMessage(
            remoteJid,
            { text: MSG },
            { quoted: message }
        );
    }

    // Set the welcome message
    // تعيين رسالة الترحيب
    await setWelcome(remoteJid, content);

    // Send success message
    // إرسال رسالة نجاح
    return await sock.sendMessage(
        remoteJid,
        {
            text: `✅ _Welcome message successfully set / تم تعيين رسالة الترحيب بنجاح_\n\n_Please make sure the feature is activated by typing *.on welcome*_ / تأكد من تفعيل الميزة بكتابة *.on welcome*_`,
        },
        { quoted: message }
    );
}

module.exports = {
    handle,
    Commands    : ["setwelcome"],
    // Command name / اسم الأمر
    OnlyPremium : false,
    // Not restricted to premium users / غير مقيد للمستخدمين المميزين
    OnlyOwner   : false,
    // Not restricted to owner / غير مقيد للمالك فقط
};