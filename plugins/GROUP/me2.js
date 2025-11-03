const { findUser } = require("@lib/users");
const { isOwner, isPremiumUser } = require("@lib/users");

async function handle(sock, messageInfo) {
    const { remoteJid, message, sender, pushName } = messageInfo;

    // English: Get user data from database
    // العربية: الحصول على بيانات المستخدم من قاعدة البيانات
    const dataUsers = await findUser(sender);
    if (!dataUsers) return;

    // English: Determine user role (Owner / Premium / default role)
    // العربية: تحديد دور المستخدم (مالك / بريميوم / الدور الافتراضي)
    const role = await isOwner(sender) 
        ? 'Owner | مالك' 
        : await isPremiumUser(sender) 
        ? 'Premium | بريميوم' 
        : dataUsers.role;

    // English: Prepare profile text
    // العربية: تحضير نص الملف الشخصي
    let teks = `
╭─── _*MY PROFILE | ملفي الشخصي*_ 
├────
├──
│ Name  : *${pushName}*
│ Level : *${dataUsers.level || 0}*
│ Limit : *${dataUsers.limit || 0}*
│ Money : *${dataUsers.money || 0}*
│ Role  : *${role}*
│
├────
╰────────────────────────`;

    // English: Send profile text to the chat
    // العربية: إرسال نص الملف الشخصي إلى الدردشة
    await sock.sendMessage(
        remoteJid,
        { text: teks },
        { quoted: message }
    );
}

module.exports = {
    handle,
    Commands    : ['me2','limit2'], // English: Command names | العربية: أسماء الأوامر
    OnlyPremium : false,             // English: Not premium only | العربية: لا يحتاج بريميوم
    OnlyOwner   : false              // English: Not owner only | العربية: لا يحتاج مالك
};