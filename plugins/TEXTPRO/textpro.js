// Textpro 1 parameter / نص برو مع معامل واحد

const ApiAutoresbot = require("api-autoresbot");
const config = require("@config");
const mess = require("@mess");
const { logCustom } = require("@lib/logger"); // Custom logging / تسجيل مخصص

async function handle(sock, messageInfo) {
    const { remoteJid, message, content, prefix, command } = messageInfo;
    try {
        // Validate message content / التحقق من محتوى الرسالة
        if (!content) {
            await sock.sendMessage(remoteJid, {
                text: `_⚠️ Usage Format / صيغة الاستخدام:_ \n\n_💬 Example / مثال:_ _*${prefix + command} resbot*_`
            }, { quoted: message });
            return; // Stop execution if content is empty / إيقاف التنفيذ إذا كانت الرسالة فارغة
        }

        // React to the message / تفاعل مع الرسالة
        await sock.sendMessage(remoteJid, { react: { text: "🤌🏻", key: message.key } });

        // Call the API to generate Textpro image / استدعاء API لإنشاء صورة نصية
        const api = new ApiAutoresbot(config.APIKEY);
        const buffer = await api.getBuffer(`/api/textpro/${command}`, {
            text: content,
            orientasi: 'potrait' // Orientation / الاتجاه
        });

        // Send generated image with caption / إرسال الصورة المولدة مع التسمية التوضيحية
        await sock.sendMessage(
            remoteJid,
            { image: buffer, caption: mess.general.success }, // Success message / رسالة نجاح
            { quoted: message }
        );
    } catch (error) {
        // Log error with custom logger / تسجيل الخطأ باستخدام المسجل المخصص
        logCustom('info', content, `ERROR-COMMAND-${command}.txt`);
        console.error("Error in handle function / خطأ في دالة المعالجة:", error.message);
    }
}

module.exports = {
    handle,
    Commands: ['3dbox','blackpink','boom','gaming','magma','matrix','metal','neon','shadow','signature','sliced','snow','valentine','winter','wolf'], // Supported Textpro commands / أوامر Textpro المدعومة
    OnlyPremium: false,
    OnlyOwner: false,
    limitDeduction: 1, // Number of usage limits to deduct / عدد حدود الاستخدام التي سيتم خصمها
};