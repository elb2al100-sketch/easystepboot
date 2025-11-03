// Import functions to find and update user data
// استيراد دوال العثور على المستخدم وتحديث بياناته
const { findUser, updateUser } = require("@lib/users");
const { determineUser } = require('@lib/utils');

async function handle(sock, messageInfo) {
    const { remoteJid, message, content, sender, mentionedJid, isQuoted, prefix, command } = messageInfo;

    // Validate empty input
    // التحقق من وجود محتوى الرسالة
    if (!content || content.trim() === '') {
        return await sock.sendMessage(
            remoteJid,
            { text: `_⚠️ Usage Format:_ \n_💬 Example:_ _*${prefix + command} 628xxx 10*_\n_⚠️ تنسيق الاستخدام:_ \n_💬 مثال:_ _*${prefix + command} 628xxx 10*_` },
            { quoted: message }
        );
    }

    // Split phone number and limit amount
    // فصل الرقم وعدد الحد المضاف
    const [rawNumber, rawLimit] = content.split(' ').map(item => item.trim());

    // Determine user to act on
    // تحديد المستخدم الذي سيتم تعديل الحد له
    const userToAction = determineUser(mentionedJid, isQuoted, rawNumber);
    if (!userToAction) {
        return await sock.sendMessage(
            remoteJid,
            { text: `_⚠️ Usage Format:_ \n_💬 Example:_ _*${prefix + command} @NAME*_\n_⚠️ تنسيق الاستخدام:_ \n_💬 مثال:_ _*${prefix + command} @NAME*_` },
            { quoted: message }
        );
    }

    if (!userToAction || !rawLimit) {
        return await sock.sendMessage(
            remoteJid,
            { text: `⚠️ _Enter the correct format_\n_💬 Example:_ *${prefix + command} 628xxx 50*\n⚠️ _أدخل التنسيق الصحيح_\n_💬 مثال:_ *${prefix + command} 628xxx 50*` },
            { quoted: message }
        );
    }

    // Validate user number and append "@s.whatsapp.net"
    // التحقق من صحة الرقم وإضافة الدومين "@s.whatsapp.net"
    const senderAdd = userToAction.replace(/[^0-9]/g, '') + "@s.whatsapp.net"; 
    if (!/^\d{10,15}@s\.whatsapp\.net$/.test(senderAdd)) {
        return await sock.sendMessage(
            remoteJid,
            { text: `⚠️ _Invalid number. Make sure the format is correct_\n_💬 Example:_ *${prefix + command} 628xxx 50*\n⚠️ _رقم غير صالح. تأكد من صحة التنسيق_\n_💬 مثال:_ *${prefix + command} 628xxx 50*` },
            { quoted: message }
        );
    }

    // Validate limit
    // التحقق من صحة الحد
    const limitToAdd = parseInt(rawLimit, 10);
    if (isNaN(limitToAdd) || limitToAdd <= 0) {
        return await sock.sendMessage(
            remoteJid,
            { text: `⚠️ _Limit amount must be a positive number_\n_💬 Example:_ *${prefix + command} 628xxx 50*\n⚠️ _الحد يجب أن يكون رقماً موجباً_\n_💬 مثال:_ *${prefix + command} 628xxx 50*` },
            { quoted: message }
        );
    }

    // Get user data
    // الحصول على بيانات المستخدم
    const dataUsers = await findUser(senderAdd);
    if (!dataUsers) {
        return await sock.sendMessage(
            remoteJid,
            { text: `⚠️ _User with number ${rawNumber} not found._\n⚠️ _المستخدم بالرقم ${rawNumber} غير موجود._` },
            { quoted: message }
        );
    }

    // Update user limit
    // تحديث حد المستخدم
    await updateUser(senderAdd, {
        limit: (dataUsers.limit || 0) + limitToAdd, // Add limit to existing value
        // إضافة الحد إلى القيمة الحالية
    });

    // Send success message
    // إرسال رسالة نجاح
    return await sock.sendMessage(
        remoteJid,
        { text: `✅ _Successfully added ${limitToAdd} limit to number ${rawNumber}._\n✅ _تمت إضافة ${limitToAdd} حد للرقم ${rawNumber}._` },
        { quoted: message }
    );
}

module.exports = {
    handle,
    Commands    : ['addlimit'], // Command name
    OnlyPremium : false,
    OnlyOwner   : true
};