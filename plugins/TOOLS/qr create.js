const qrcode = require('qrcode')
const mess = require("@mess");
const { reply } = require("@lib/utils");

async function handle(sock, messageInfo) {
    const { m, remoteJid, message, prefix, command, content } = messageInfo;

    // Validate input
    // التحقق من صحة الإدخال
    if (!content) {
        return await reply(
            m,
            `_⚠️ Usage Format:_ \n\n💬 _Example:_ _*${prefix + command} resbot*_`
        );
    }

    try {
        // Send reaction emoji 🤌🏻 to indicate processing
        // إرسال رمز تعبيري 🤌🏻 كإشارة إلى المعالجة
        await sock.sendMessage(remoteJid, { react: { text: "🤌🏻", key: message.key } });
        
        // Generate QR code
        // إنشاء رمز الاستجابة السريعة (QR)
        const resultQr = await qrcode.toDataURL(content, { scale: 8 });
        const buffer = Buffer.from(resultQr.replace('data:image/png;base64,', ''), 'base64');

        // Send message with QR image
        // إرسال رسالة تحتوي على صورة QR
        await sock.sendMessage(
            remoteJid,
            {
                image: buffer,
                caption: mess.general.success,
            },
            { quoted: message }
        );
    } catch (error) {
        console.error("Error in handle function:", error);

        // If error occurs, send error message to user
        // في حال حدوث خطأ، إرسال رسالة خطأ للمستخدم
        const errorMessage = error.message || "An unknown error occurred. / حدث خطأ غير معروف.";
        return await sock.sendMessage(
            remoteJid,
            { text: `_Error: ${errorMessage}_` },
            { quoted: message }
        );
    }
}

module.exports = {
    handle,
    Commands    : ["createqr"], // Command to generate QR code / الأمر لإنشاء رمز QR
    OnlyPremium : false,
    OnlyOwner   : false,
    limitDeduction  : 1, // Number of limit deductions / عدد الخصم من الحد
};