// SET TEMPLATE WELCOME: Set the welcome template for the group
// تعيين قالب الترحيب: تعيين قالب الترحيب للمجموعة

const { setTemplateWelcome } = require("@lib/participants");
// Import function to set welcome template
// استدعاء دالة لتعيين قالب الترحيب

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
    const participants = groupMetadata.participants;

    // Check if the sender is an admin
    // التحقق مما إذا كان المرسل مشرفًا
    const isAdmin = participants.some(participant => participant.id === sender && participant.admin);
    if (!isAdmin) {
        await sock.sendMessage(remoteJid, { text: mess.general.isAdmin }, { quoted: message });
        return;
    }

    // Validate empty input
    // التحقق من النص الفارغ
    if (!content || !content.trim()) {
        const usageMessage = `⚠️ *Usage Format / صيغة الاستخدام:*

💬 *Example / مثال:* 
_${prefix}${command} 2_

_Only numbers from *1 to 7* are available / مسموح فقط بالأرقام من 1 إلى 7_
_or type *text* / أو كتابة كلمة "text"_

_To view the welcome image type *.teswelcome* / لرؤية صورة الترحيب اكتب *.teswelcome*`;

        await sock.sendMessage(remoteJid, { text: usageMessage }, { quoted: message });
        return;
    }

    // If content is 'text', set welcome template as text
    // إذا كان المحتوى هو "text"، يتم تعيين قالب الترحيب كنص
    if(content == 'text') {
        await setTemplateWelcome(remoteJid, content);

        // Send success message
        // إرسال رسالة نجاح
        const successMessage = `✅ _Welcome Template successfully set / تم تعيين قالب الترحيب بنجاح_`;
        await sock.sendMessage(remoteJid, { text: successMessage }, { quoted: message });
        return;
    }

    // Validate input must be a number 1-7
    // التحقق من أن المدخلات رقم من 1 إلى 7
    const validNumbers = /^[1-7]$/; // Regex for numbers 1-7
    if (!validNumbers.test(content.trim())) {
        const invalidMessage = `⚠️ _Invalid input! / مدخلات غير صالحة!_

_Only numbers from *1* to *7* are allowed / مسموح فقط بالأرقام من 1 إلى 7_`;
        await sock.sendMessage(remoteJid, { text: invalidMessage }, { quoted: message });
        return;
    }

    // Set the welcome template
    // تعيين قالب الترحيب
    await setTemplateWelcome(remoteJid, content);

    // Send success message
    // إرسال رسالة نجاح
    const successMessage = `✅ _Welcome Template successfully set / تم تعيين قالب الترحيب بنجاح_`;
    await sock.sendMessage(remoteJid, { text: successMessage }, { quoted: message });
}

module.exports = {
    handle,
    Commands: ["settemplatewelcome", "templatewelcome"], 
    // Command names
    // أسماء الأوامر
    OnlyPremium: false,          
    // Not restricted to premium users
    // غير مقيد للمستخدمين المميزين
    OnlyOwner: false,            
    // Not restricted to owner
    // غير مقيد للمالك فقط
};