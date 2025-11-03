const { reply } = require("@lib/utils");

async function handle(sock, messageInfo) {
    const { m, remoteJid, message, prefix, command, content } = messageInfo;

    try {
        // Validate input / التحقق من الإدخال
        if (!content) {
            return await reply(m, `_⚠️ Usage Format / صيغة الاستخدام:_ \n\n_💬 Example / مثال:_ _${prefix + command} https://chat.whatsapp.com/xxxxxxxxxxxxxxxx_`);
        }

        // Validate WhatsApp group link / التحقق من رابط مجموعة واتساب
        const regex = /https:\/\/chat\.whatsapp\.com\/([\w\d]+)/;
        const match = content.match(regex);
        if (!match || !match[1]) {
            return await reply(m, `_❌ Invalid group link / رابط المجموعة غير صالح. Make sure the link is like this / تأكد أن الرابط مثل هذا:_\nhttps://chat.whatsapp.com/xxxxxxxxxxxxxxxx`);
        }

        const inviteCode = match[1];

        // Get group info without joining / الحصول على معلومات المجموعة بدون الانضمام
        const groupInfo = await sock.groupGetInviteInfo(inviteCode);

        const info = [
            `🆔 Group ID / معرف المجموعة: ${groupInfo.id}`,
            `📛 Name / الاسم: ${groupInfo.subject}`,
            `👥 Members Count / عدد الأعضاء: ${groupInfo.size}`
        ].join('\n');

        return await reply(m, `_✅ Group Information / معلومات المجموعة:_\n${info}`);
    } catch (error) {
        console.error("Error in handle function / خطأ في دالة المعالجة:", error);

        const errorMessage = error.message || "Unknown error occurred / حدث خطأ غير معروف.";
        return await sock.sendMessage(
            remoteJid,
            { text: `_❌ Error / خطأ: ${errorMessage}_` },
            { quoted: message }
        );
    }
}

module.exports = {
    handle,
    Commands: ["cekidgc"], // Command to check group info / أمر للتحقق من معلومات المجموعة
    OnlyPremium: false,
    OnlyOwner: false,
    limitDeduction: 1, // Number of usage limits to deduct / عدد حدود الاستخدام التي سيتم خصمها
};