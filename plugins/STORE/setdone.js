const { setDone, deleteMessage } = require("@lib/participants"); // Functions to set or reset done message / دوال لتعيين أو إعادة ضبط رسالة "تم الانتهاء"
const { getGroupMetadata } = require("@lib/cache"); // Get group metadata / الحصول على بيانات المجموعة
const { downloadQuotedMedia, downloadMedia } = require("@lib/utils"); // Download media from messages / تنزيل الوسائط من الرسائل
const mess = require("@mess"); // Predefined messages / رسائل جاهزة
const fs = require("fs");
const path = require("path");

async function handle(sock, messageInfo) {
    const { remoteJid, isGroup, message, content, sender, command, prefix, isQuoted, type } = messageInfo;

    // Check if message is from a group / التحقق إذا كانت الرسالة من مجموعة
    if (!isGroup) return;

    // Get group metadata / الحصول على بيانات المجموعة
    const groupMetadata = await getGroupMetadata(sock, remoteJid);
    const participants = groupMetadata.participants;

    // Check if sender is admin / التحقق من أن المرسل مشرف
    const isAdmin = participants.some(
        participant => participant.id === sender && participant.admin
    );
    if (!isAdmin) {
        await sock.sendMessage(remoteJid, { text: mess.general.isAdmin }, { quoted: message }); // ⚠️ Only admin can use this command / ⚠️ فقط المشرف يمكنه استخدام هذا الأمر
        return;
    }

    const mediaType = isQuoted ? isQuoted.type : type;

    // Handle sticker media / التعامل مع الملصقات
    if(mediaType === 'sticker'){
        const media = isQuoted ? await downloadQuotedMedia(message, true) : await downloadMedia(message, true);
        const mediaPath = path.join("database", "media", media);

        if (!fs.existsSync(mediaPath)) {
            throw new Error("Media file not found after download / ملف الوسائط غير موجود بعد التنزيل.");
        }

        await setDone(remoteJid, mediaPath);

        // Send success message / إرسال رسالة نجاح
        const successMessage = `✅ _Set done has been successfully configured / تم إعداد Set done بنجاح_

_Type .setdone reset to revert to default / اكتب .setdone reset للعودة إلى الإعداد الافتراضي_`;
        await sock.sendMessage(remoteJid, { text: successMessage }, { quoted: message });
        return;
    }

    // Validate input content / التحقق من محتوى الرسالة
    if (!content || !content.trim()) {
        const usageMessage = `⚠️ *Usage Format / صيغة الاستخدام:*

💬 *Example / مثال:* 
_${prefix}${command} SUCCESS_

Time / الوقت : @time
Date / التاريخ : @tanggal
Group / المجموعة : @grub
Note / ملاحظة : @catatan

@sender Thank you for your order / شكراً لطلبك
`;
        await sock.sendMessage(remoteJid, { text: usageMessage }, { quoted: message });
        return;
    }

    // Set done message / تعيين رسالة "تم الانتهاء"
    await setDone(remoteJid, content);

    // Reset done message if user types 'reset' / إعادة ضبط إذا كتب المستخدم "reset"
    if(content.toLowerCase() === 'reset') {
        await deleteMessage(remoteJid, 'setdone');
        await sock.sendMessage(remoteJid, { text: '_✅ Setdone has been successfully reset / تم إعادة ضبط Setdone بنجاح_' }, { quoted: message });
        return;
    }

    // Send success message / إرسال رسالة نجاح
    const successMessage = `✅ _Set done has been successfully configured / تم إعداد Set done بنجاح_

_Type .setdone reset to revert to default / اكتب .setdone reset للعودة إلى الإعداد الافتراضي_`;
    await sock.sendMessage(remoteJid, { text: successMessage }, { quoted: message });
}

module.exports = {
    handle,
    Commands: ["setdone"],
    OnlyPremium: false,
    OnlyOwner: false,
};