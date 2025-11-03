const config = require("@config");
const { createUser, findUserByEmail } = require("@lib/panel");

async function handle(sock, messageInfo) {
    const { remoteJid, message, content, prefix, command } = messageInfo;

    try {
        // Validate input content / التحقق من محتوى الإدخال
        if (!content) {
            await sock.sendMessage(remoteJid, {
                text: `_Example / مثال: *${prefix + command} xxx@gmail.com*_`
            }, { quoted: message });
            return;
        }

        // Validate email format / التحقق من صحة البريد الإلكتروني
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(content)) {
            await sock.sendMessage(remoteJid, {
                text: "_Invalid email format. Example / صيغة البريد غير صحيحة. مثال: xxx@gmail.com_"
            }, { quoted: message });
            return;
        }

        // Send reaction to indicate processing / إرسال رد فعل لإظهار أن العملية جارية
        await sock.sendMessage(remoteJid, { react: { text: "🤌🏻", key: message.key } });

        // Call findUserByEmail function to retrieve user / استدعاء دالة البحث عن المستخدم عبر البريد
        const result = await findUserByEmail(content);
        const { id, uuid, username, email, root_admin } = result.attributes;

        // Determine admin status / تحديد حالة المشرف
        const adminStatus = root_admin ? "✅ Admin / مشرف" : "❌ Not Admin / ليس مشرف";

        // Send success message with user details / إرسال رسالة النجاح مع تفاصيل المستخدم
        await sock.sendMessage(remoteJid, {
            text: `*User Information / معلومات المستخدم* 
        
🔹 *User ID / معرف المستخدم*: ${id}
🔹 *UUID*: ${uuid}
🔹 *Username / اسم المستخدم*: ${username}
🔹 *Email / البريد الإلكتروني*: ${email}
🔹 *Admin Status / حالة المشرف*: ${adminStatus}`
        }, { quoted: message });

    } catch (error) {
        // Send error message to user / إرسال رسالة خطأ للمستخدم
        await sock.sendMessage(remoteJid, {
            text: error.message || '❌ An error occurred / حدث خطأ'
        }, { quoted: message });
    }
}

module.exports = {
    handle,
    Commands    : ['finduser'],  // Command trigger / كلمة الأمر
    OnlyPremium : false,          // Not limited to premium users / غير مقتصر على المستخدمين المميزين
    OnlyOwner   : true,           // Owner-only command / مقتصر على المالك
};