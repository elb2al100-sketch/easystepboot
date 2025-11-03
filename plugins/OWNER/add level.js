// Import functions to find and update user data
// استيراد دوال العثور على المستخدم وتحديث بياناته
const { findUser, updateUser } = require("@lib/users");
const { determineUser } = require('@lib/utils');

async function handle(sock, messageInfo) {
    const { remoteJid, message, content, sender, prefix, command, mentionedJid, isQuoted } = messageInfo;

    // Validate empty input
    // التحقق من وجود محتوى الرسالة
    if (!content || content.trim() === '') {
        return await sock.sendMessage(
            remoteJid,
            { text: `_⚠️ Usage Format:_ \n_💬 Example:_ _*${prefix + command} 628xxx 10*_\n_⚠️ تنسيق الاستخدام:_ \n_💬 مثال:_ _*${prefix + command} 628xxx 10*_` },
            { quoted: message }
        );
    }

    // Split phone number and level amount
    // فصل الرقم وعدد المستويات
    const [rawNumber, rawLevel] = content.split(' ').map(item => item.trim());

    // Determine user
    // تحديد المستخدم الذي سيتم تعديل مستواه
    const userToAction = determineUser(mentionedJid, isQuoted, rawNumber);
    if (!userToAction) {
        return await sock.sendMessage(
            remoteJid,
            { text: `_⚠️ Usage Format:_ \n_💬 Example:_ _*${prefix + command} 628xxx 50*_\n_⚠️ تنسيق الاستخدام:_ \n_💬 مثال:_ _*${prefix + command} 628xxx 50*_` },
            { quoted: message }
        );
    }

    if (!userToAction || !rawLevel) {
        return await sock.sendMessage(
            remoteJid,
            { text: `_⚠️ Enter the correct format_\n_💬 Example:_ *${prefix + command} 628xxx 50*\n_⚠️ أدخل التنسيق الصحيح_\n_💬 مثال:_ *${prefix + command} 628xxx 50*` },
            { quoted: message }
        );
    }

    // Validate phone number and append "@s.whatsapp.net"
    // التحقق من صحة الرقم وإضافة الدومين "@s.whatsapp.net"
    const senderAdd = userToAction.replace(/[^0-9]/g, '') + "@s.whatsapp.net";
    if (!/^\d{10,15}@s\.whatsapp\.net$/.test(senderAdd)) {
        return await sock.sendMessage(
            remoteJid,
            { text: `⚠️ _Invalid number. Make sure the format is correct_\n_💬 Example:_ *${prefix + command} 628xxx 5*\n⚠️ _رقم غير صالح. تأكد من صحة التنسيق_\n_💬 مثال:_ *${prefix + command} 628xxx 5*` },
            { quoted: message }
        );
    }

    // Validate level
    // التحقق من صحة عدد المستويات
    const levelToAdd = parseInt(rawLevel, 10);
    if (isNaN(levelToAdd) || levelToAdd <= 0) {
        return await sock.sendMessage(
            remoteJid,
            { text: `⚠️ _Level amount must be a positive number_\n_💬 Example:_ *${prefix + command} 628xxx 5*\n⚠️ _عدد المستويات يجب أن يكون رقماً موجباً_\n_💬 مثال:_ *${prefix + command} 628xxx 5*` },
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

    // Update user level
    // تحديث مستوى المستخدم
    await updateUser(senderAdd, {
        level: (dataUsers.level || 0) + levelToAdd, // Add levels
        // إضافة المستوى إلى المستوى الحالي
    });

    // Send success message
    // إرسال رسالة نجاح
    return await sock.sendMessage(
        remoteJid,
        { text: `✅ _Successfully added ${levelToAdd} levels to number ${rawNumber}._\n✅ _تمت إضافة ${levelToAdd} مستوى للرقم ${rawNumber}._` },
        { quoted: message }
    );
}

module.exports = {
    handle,
    Commands    : ['addlevel'], // Command name
    OnlyPremium : false,
    OnlyOwner   : true
};