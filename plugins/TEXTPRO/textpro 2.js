// Textpro 2 parameters / نص برو مع معاملين

const ApiAutoresbot = require("api-autoresbot");
const config = require("@config");
const mess = require("@mess");
const { logCustom } = require("@lib/logger");

async function handle(sock, messageInfo) {
    const { remoteJid, message, content, prefix, command } = messageInfo;

    try {
        // Validate message content / التحقق من محتوى الرسالة
        if (!content || content.trim().split(/\s+/).length < 2) {
            await sock.sendMessage(remoteJid, {
                text: `_⚠️ Usage Format / صيغة الاستخدام:_ \n\n_💬 Example / مثال:_ _*${prefix + command} auto | resbot*_ \n\n_Minimum 2 words / الحد الأدنى كلمتين_`
            }, { quoted: message });
            return; // Stop execution if content is empty or less than 2 words / إيقاف التنفيذ إذا كانت الرسالة فارغة أو أقل من كلمتين
        }

        // Split content into 2 parameters / تقسيم المحتوى إلى معاملين
        let text1, text2;
        if (content.includes('|')) {
            // If '|' exists, split by '|' / إذا كان هناك '|'، تقسيم المحتوى حسب '|'
            [text1, text2] = content.split('|').map(item => item.trim());
        } else {
            // If no '|', split by space / إذا لم يوجد '|', تقسيم حسب المسافة
            const [first, ...rest] = content.split(' ');
            text1 = first;
            text2 = rest.join(' ');
        }

        // React to the message / التفاعل مع الرسالة
        await sock.sendMessage(remoteJid, { react: { text: "🤌🏻", key: message.key } });

        // Call API to generate Textpro image / استدعاء API لإنشاء صورة نصية
        const api = new ApiAutoresbot(config.APIKEY);
        const buffer = await api.getBuffer(`/api/textpro/${command}`, {
            text1,
            text2
        });

        // Send generated image with caption / إرسال الصورة المولدة مع التسمية التوضيحية
        await sock.sendMessage(
            remoteJid,
            { image: buffer, caption: mess.general.success }, // Success message / رسالة نجاح
            { quoted: message }
        );
    } catch (error) {
        // Log error with custom logger / تسجيل الخطأ باستخدام المسجل المخصص
        logCustom('info', content, `ERROR-COMMAND-TEXTPRO-${command}.txt`);
        console.error("Error in handle function / خطأ في دالة المعالجة:", error.message);
    }
}

module.exports = {
    handle,
    Commands: ['marvel','pornhub'], // Supported Textpro commands / أوامر Textpro المدعومة
    OnlyPremium: false,
    OnlyOwner: false,
    limitDeduction: 1, // Number of usage limits to deduct / عدد حدود الاستخدام التي سيتم خصمها
};