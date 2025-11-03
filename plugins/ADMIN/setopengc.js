// SET GROUP AUTO-OPEN SCHEDULE: Set a daily time to automatically open the group
// تعيين جدول الفتح التلقائي للمجموعة: تحديد وقت يومي لفتح المجموعة تلقائياً

const { setGroupSchedule } = require("@lib/participants");
// Import function to set group schedule
// استدعاء دالة لتعيين جدول المجموعة

const { getGroupMetadata } = require("@lib/cache");
// Import function to get group metadata
// استدعاء دالة للحصول على بيانات المجموعة

const mess = require("@mess");
// Import general messages
// استدعاء الرسائل العامة

const { convertTime, getTimeRemaining } = require('@lib/utils');
// Import utility functions to convert time and calculate remaining time
// استدعاء دوال مساعدة لتحويل الوقت وحساب الوقت المتبقي

async function handle(sock, messageInfo) {
    const { remoteJid, isGroup, message, content, sender, command, prefix } = messageInfo;

    // Only allow group messages
    // يسمح فقط برسائل المجموعات
    if (!isGroup) return;

    // Get group metadata
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
        const MSG = `_⚠️ Usage Format / صيغة الاستخدام:_ \n\n_💬 Example / مثال:_ _*${prefix + command} 23:10*_
        
_The bot will automatically open the group at this time every day / سيقوم البوت بفتح المجموعة تلقائياً في هذا الوقت كل يوم_ \n\n_To remove schedule type *.setopengc off* / لإزالة الجدول اكتب *.setopengc off*_`;
        return await sock.sendMessage(
            remoteJid,
            { text: MSG },
            { quoted: message }
        );
    }

    // If input is 'off', delete schedule
    // إذا كان الإدخال 'off'، احذف الجدول
    if(content.trim() == 'off') {
        await setGroupSchedule(sock, remoteJid, content.trim(), 'openTime');
        return await sock.sendMessage(
            remoteJid,
            { text: `_✅ Auto-open schedule successfully removed / تم حذف جدول الفتح التلقائي بنجاح_` },
            { quoted: message }
        );
    }

    // Validate time format HH:mm
    // التحقق من صيغة الوقت HH:mm
    const timeRegex = /^([01]?\d|2[0-3]):[0-5]\d$/;
    if (!timeRegex.test(content.trim())) {
        const MSG = `_⚠️ Invalid time format / صيغة الوقت غير صحيحة!_\n\n_Make sure format is HH:mm (example: 23:10) / تأكد أن الصيغة HH:mm (مثال: 23:10)_`;
        return await sock.sendMessage(
            remoteJid,
            { text: MSG },
            { quoted: message }
        );
    }

    // Save schedule
    // حفظ الجدول
    await setGroupSchedule(sock, remoteJid, content.trim(), 'openTime');

    const serverTime = convertTime(content.trim());
    const { hours, minutes } = getTimeRemaining(serverTime);
    // Convert time and calculate remaining time
    // تحويل الوقت وحساب الوقت المتبقي

    // Send success message
    // إرسال رسالة نجاح
    return await sock.sendMessage(
        remoteJid,
        {
            text: `✅ _Success, group will automatically open at *${content.trim()}* WIB / تم التعيين، ستفتح المجموعة تلقائياً في الساعة *${content.trim()}* بتوقيت WIB_ \n⏰ _Approximately ${hours} hours ${minutes} minutes remaining / حوالي ${hours} ساعة و ${minutes} دقيقة متبقية_\n\n_Make sure bot is admin to use this feature / تأكد من أن البوت مشرف لاستخدام هذه الميزة_`,
        },
        { quoted: message }
    );
}

module.exports = {
    handle,
    Commands    : ["setopengc"],
    OnlyPremium : false,
    OnlyOwner   : false
};