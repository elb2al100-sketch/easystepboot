const ApiAutoresbot = require('api-autoresbot');
const config        = require("@config");
const { isURL }     = require("@lib/utils");
const mess          = require('@mess');
const { logCustom } = require("@lib/logger");

// Function to send a message while quoting the original message
// دالة لإرسال رسالة مع اقتباس الرسالة الأصلية
async function sendMessageWithQuote(sock, remoteJid, message, text, options = {}) {
    await sock.sendMessage(remoteJid, { text }, { quoted: message, ...options });
}

async function handle(sock, messageInfo) {
    const { remoteJid, message, prefix, command, content } = messageInfo;

    try {
        // Validate input
        // التحقق من صحة المحتوى
        if (!content.trim() || content.trim() === '' || !isURL(content)) {
            return sendMessageWithQuote(
                sock,
                remoteJid,
                message,
                `_⚠️ Usage Format:_ \n\n💬 _Example:_ _*${prefix + command} https://google.com*_ \n⚠️ صيغة الاستخدام:_ \n\n💬 _مثال:_ _*${prefix + command} https://google.com*_`
            );
        }

        // Send "Processing" reaction
        // إرسال رمز تعبيري "جارٍ المعالجة"
        await sock.sendMessage(remoteJid, { react: { text: "🤌🏻", key: message.key } });

        // Initialize API
        // تهيئة API
        const api = new ApiAutoresbot(config.APIKEY);

        // Call API with parameters
        // استدعاء API مع المعلمات
        const buffer = await api.getBuffer('/api/ssweb', { 
            url: content,
            delay : 6000 // 6 seconds / 6 ثوانٍ
        });

        // Send the screenshot image
        // إرسال صورة لقطة الشاشة
        await sock.sendMessage(
            remoteJid,
            {
                image: buffer,
                caption: mess.general.success, // Predefined success message / رسالة نجاح جاهزة
            },
            { quoted: message }
        );

    } catch (error) {
        console.error("Error in handle function:", error);
        logCustom('info', content, `ERROR-COMMAND-${command}.txt`);

        // Handle errors and send message
        // التعامل مع الأخطاء وإرسال رسالة
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
    Commands    : ["ssweb"],   // Command for screenshotting a website / أمر لأخذ لقطة شاشة لموقع ويب
    OnlyPremium : false,        // Accessible by all users / متاح لجميع المستخدمين
    OnlyOwner   : false,
    limitDeduction  : 1,        // Amount of limit to deduct / مقدار الحد الذي سيتم خصمه
};