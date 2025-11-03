// PROMOTE: Set the "Promote" message when a user is promoted to admin
// تَعْيِين رِسَالَة "ترقية": عند ترقية عضو إلى مشرف

const { setPromote } = require("@lib/participants");
// Import function to set promote message
// استدعاء دالة لتعيين رسالة الترقية

const { getGroupMetadata } = require("@lib/cache");
// Import function to get group metadata
// استدعاء دالة للحصول على بيانات المجموعة

const mess = require("@mess");
// Import general messages (error/notification)
// استدعاء رسائل عامة (مثل رسائل الخطأ والإشعارات)

async function handle(sock, messageInfo) {
    const { remoteJid, isGroup, message, content, sender, command, prefix } = messageInfo;

    if (!isGroup) return; 
    // Only for groups
    // الرسائل من المجموعات فقط

    // Get metadata of the group
    // الحصول على بيانات المجموعة
    const groupMetadata = await getGroupMetadata(sock, remoteJid);
    const participants = groupMetadata.participants;

    // Check if sender is an admin
    // التحقق مما إذا كان المرسل مشرفًا
    const isAdmin = participants.some(participant => participant.id === sender && participant.admin);
    if (!isAdmin) {
        // Send message if sender is not admin
        // إرسال رسالة إذا لم يكن المرسل مشرفًا
        await sock.sendMessage(remoteJid, { text: mess.general.isAdmin }, { quoted: message });
        return;
    }

    // Validate if content is empty
    // التحقق مما إذا كان النص المرسل فارغًا
    if (!content || !content.trim()) {
        // Send usage format message
        // إرسال رسالة بصيغة الاستخدام الصحيحة
        const MSG = `_⚠️ Format Usage:_ \n\n_💬 Example:_ _*${prefix + command} Congrats @name is now admin*_\n\n_*List Variables*_\n\n${global.group.variable}`;
        return await sock.sendMessage(
            remoteJid,
            { text: MSG },
            { quoted: message }
        );
    }

    // Set the "Promote" message using the provided content
    // تعيين رسالة "ترقية" باستخدام النص المرسل
    await setPromote(remoteJid, content);

    // Send success message
    // إرسال رسالة نجاح
    return await sock.sendMessage(
        remoteJid,
        {
            text: `✅ _Promote message successfully set_\n\n_Ensure the feature is enabled by typing *.on promote*_`
            // ✅ رسالة الترقية تم تعيينها بنجاح
            // تأكد من تفعيل الميزة عن طريق كتابة *.on promote*
        },
        { quoted: message }
    );
}

module.exports = {
    handle,
    Commands    : ["setpromote"], 
    // Command name
    // اسم الأمر
    OnlyPremium : false,          
    // Not restricted to premium users
    // غير مقيد للمستخدمين المميزين
    OnlyOwner   : false,          
    // Not restricted to owner
    // غير مقيد للمالك فقط
};