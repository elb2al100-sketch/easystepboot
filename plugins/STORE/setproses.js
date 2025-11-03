const { getGroupMetadata } = require("@lib/cache"); // Function to get group metadata / دالة للحصول على بيانات المجموعة
const { downloadQuotedMedia, downloadMedia } = require("@lib/utils"); // Functions to download media / دوال لتحميل الوسائط
const mess = require("@mess"); // Predefined messages / رسائل جاهزة
const fs = require("fs");
const path = require("path");
const { setProses, deleteMessage } = require("@lib/participants"); // Functions to set or reset 'process' template / دوال لتعيين أو إعادة ضبط قالب "process"

async function handle(sock, messageInfo) {
    const { remoteJid, isGroup, message, content, sender, command, prefix, isQuoted, type } = messageInfo;

    // Check if message is from a group / التحقق إذا كانت الرسالة من مجموعة
    if (!isGroup) return;

    // Get group metadata / الحصول على بيانات المجموعة
    const groupMetadata = await getGroupMetadata(sock, remoteJid);
    const participants = groupMetadata.participants;

    // Check if sender is admin / التحقق من أن المرسل مشرف
    const isAdmin = participants.some(participant => participant.id === sender && participant.admin);
    if (!isAdmin) {
        await sock.sendMessage(remoteJid, { text: mess.general.isAdmin }, { quoted: message });
        // ⚠️ Only admin can use this command / ⚠️ فقط المشرف يمكنه استخدام هذا الأمر
        return;
    }

    const mediaType = isQuoted ? isQuoted.type : type;

    // Handle sticker media / التعامل مع الملصقات
    if(mediaType === 'sticker'){
        const media = isQuoted ? await downloadQuotedMedia(message,true) : await downloadMedia(message, true);
        const mediaPath = path.join("database", "media", media);

        if (!fs.existsSync(mediaPath)) {
            throw new Error("Media file not found after download / ملف الوسائط غير موجود بعد التنزيل.");
        }
        await setProses(remoteJid, mediaPath);

        // Send success message / إرسال رسالة نجاح
        const successMessage = `✅ _Process template has been successfully set / تم تعيين قالب العملية بنجاح_

_Type .setproses reset to revert to default / اكتب .setproses reset للعودة إلى الإعداد الافتراضي_`;
        await sock.sendMessage(remoteJid, { text: successMessage }, { quoted: message });
        return;
    }

    // Validate input content / التحقق من محتوى الرسالة
    if (!content || !content.trim()) {
        const usageMessage = `⚠️ *Usage Format / صيغة الاستخدام:*

💬 *Example / مثال:* 
_${prefix}${command} PROCESS_

Time : @time
Date : @tanggal
Group : @grub
Note : @catatan

@sender Your order is being processed / طلبك قيد المعالجة
`;
        await sock.sendMessage(remoteJid, { text: usageMessage }, { quoted: message });
        return;
    }

    // Set 'process' template / تعيين قالب "process"
    await setProses(remoteJid, content);

    // Reset template if user types 'reset' / إعادة ضبط القالب إذا كتب المستخدم "reset"
    if(content.toLowerCase() === 'reset') {
        await deleteMessage(remoteJid, 'setproses');
        await sock.sendMessage(remoteJid, { text: '_✅ Successfully reset process template / تم إعادة ضبط قالب العملية بنجاح_' }, { quoted: message });
        return;
    }

    // Send success message / إرسال رسالة نجاح
    const successMessage = `✅ _Process template has been successfully set / تم تعيين قالب العملية بنجاح_

_Type .setproses reset to revert to default / اكتب .setproses reset للعودة إلى الإعداد الافتراضي_`;
    await sock.sendMessage(remoteJid, { text: successMessage }, { quoted: message });
}

module.exports = {
    handle,
    Commands: ["setproses"],
    OnlyPremium: false,
    OnlyOwner: false,
};