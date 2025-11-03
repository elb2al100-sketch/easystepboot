// Import functions to find and update user data
// استيراد دوال العثور على المستخدم وتحديث بياناته
const { findUser, updateUser } = require("@lib/users");
const { determineUser } = require('@lib/utils');

async function handle(sock, messageInfo) {
    const { remoteJid, message, content, sender, mentionedJid, isQuoted, prefix, command } = messageInfo;

    // Split phone number and amount of money
    // فصل الرقم ومقدار المال المراد إضافته
    const [rawNumber, rawMoney] = content.split(' ').map(item => item.trim());

    // Determine user to act on
    // تحديد المستخدم الذي سيتم تعديل المال له
    const userToAction = determineUser(mentionedJid, isQuoted, rawNumber);

    if (!userToAction || !rawMoney) {
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

    // Validate money amount
    // التحقق من أن المال عبارة عن رقم موجب
    const moneyToAdd = parseInt(rawMoney, 10);
    if (isNaN(moneyToAdd) || moneyToAdd <= 0) {
        return await sock.sendMessage(
            remoteJid,
            { text: `⚠️ _Money amount must be a positive number_\n_💬 Example:_ *${prefix + command} 628xxx 50*\n⚠️ _المال يجب أن يكون رقماً موجباً_\n_💬 مثال:_ *${prefix + command} 628xxx 50*` },
            { quoted: message }
        );
    }

    // Get user data
    // الحصول على بيانات المستخدم
    const dataUsers = await findUser(senderAdd);
    if (!dataUsers) {
        return await sock.sendMessage(
            remoteJid,
            { text: `⚠️ _User with number ${rawNumber} not found_\n⚠️ _المستخدم بالرقم ${rawNumber} غير موجود_` },
            { quoted: message }
        );
    }

    // Update user money
    // تحديث رصيد المال للمستخدم
    await updateUser(senderAdd, {
        money: (dataUsers.money || 0) + moneyToAdd, // Add money to existing value
        // إضافة المال إلى القيمة الحالية
    });

    // Send success message
    // إرسال رسالة نجاح
    return await sock.sendMessage(
        remoteJid,
        { text: `✅ _Successfully added ${moneyToAdd} money to number ${rawNumber}._\n✅ _تمت إضافة ${moneyToAdd} إلى رصيد الرقم ${rawNumber} بنجاح_` },
        { quoted: message }
    );
}

module.exports = {
    handle,
    Commands    : ['addmoney'], // Command name
    OnlyPremium : false,
    OnlyOwner   : true
};