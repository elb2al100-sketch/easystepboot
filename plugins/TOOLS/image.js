const ApiAutoresbot = require("api-autoresbot");
const config = require("@config");
const mess = require("@mess");
const { logCustom } = require("@lib/logger");

async function handle(sock, messageInfo) {
    const { remoteJid, message, content, prefix, command } = messageInfo;

    try {
        // Validate input content / التحقق من محتوى الرسالة
        if (!content) {
            await sock.sendMessage(remoteJid, {
                text: `_⚠️ Usage Format / صيغة الاستخدام:_ \n\n_💬 Example / مثال:_ _*${prefix + command} cat*_`
            }, { quoted: message });
            return; // Stop execution if no content / إيقاف التنفيذ إذا لم يكن هناك محتوى
        }

        // Send loading reaction / إرسال تفاعل تحميل
        await sock.sendMessage(remoteJid, { react: { text: "🤌🏻", key: message.key } });

        // Call API Autoresbot for image search / استدعاء واجهة Autoresbot للبحث عن الصور
        const api = new ApiAutoresbot(config.APIKEY);
        const buffer = await api.getBuffer(`/api/search/bingimage`, {
            q: content
        });

        // Send image with success caption / إرسال الصورة مع رسالة نجاح
        await sock.sendMessage(
            remoteJid,
            { image: buffer, caption: mess.general.success },
            { quoted: message }
        );

    } catch (error) {
        // Log error and output to console / تسجيل الخطأ وإظهاره في الكونسول
        logCustom('info', content, `ERROR-COMMAND-${command}.txt`);
        console.error("Error in handle function / خطأ في الدالة:", error.message);
    }
}

module.exports = {
    handle,
    Commands    : ['image','img','googleimage'], // Commands handled / الأوامر التي يتعامل معها
    OnlyPremium : false,
    OnlyOwner   : false,
    limitDeduction  : 1, // Number of limit to deduct / عدد الاستخدامات التي سيتم خصمها
};