const ApiAutoresbot = require('api-autoresbot');
const config = require("@config");
const { sendImageAsSticker } = require("@lib/exif");

async function handle(sock, messageInfo) {
    const { remoteJid, message, content, isQuoted, prefix, command } = messageInfo;

    try {
        // 📝 Get the text from message or quoted reply / الحصول على النص من الرسالة أو الرد المقتبس
        const text = content && content.trim() !== '' ? content : isQuoted?.text ?? null;

        // ⚠️ Validate input / التحقق من وجود نص
        if (!text) {
            await sock.sendMessage(remoteJid, {
                text: `_⚠️ Usage Format:_ \n\n_💬 Example:_ _*${prefix + command} hello world*_ \n\n⚠️ تنسيق الاستخدام:\n💬 مثال: *${prefix + command} مرحبًا بالعالم*`
            }, { quoted: message });
            return; // ⛔ Stop execution if no text / إيقاف التنفيذ إذا لم يُوجد نص
        }

        // ⏳ Send loading emoji reaction / إرسال رمز تعبيري أثناء المعالجة
        await sock.sendMessage(remoteJid, {
            react: { text: "🤌🏻", key: message.key }
        });

        // 🌐 Create API instance and request TTP image / إنشاء مثيل API وطلب صورة TTP
        const api = new ApiAutoresbot(config.APIKEY);
        const response = await api.getBuffer('/api/maker/ttp', { text: text });

        // 🖼️ Send the generated sticker / إرسال الملصق الناتج
        const options = {
            packname: config.sticker_packname, // اسم حزمة الملصقات / Sticker pack name
            author: config.sticker_author       // مؤلف الملصق / Sticker author
        };
        await sendImageAsSticker(sock, remoteJid, response, options, message);

    } catch (error) {
        // ❌ Error handling / معالجة الأخطاء
        const errorMessage = `❌ Sorry, an error occurred while processing your request. Please try again later.\n\nError: ${error.message}\n\n❌ عذرًا، حدث خطأ أثناء معالجة طلبك. حاول مرة أخرى لاحقًا.\n\nالخطأ: ${error.message}`;
        await sock.sendMessage(remoteJid, {
            text: errorMessage
        }, { quoted: message });
    }
}

module.exports = {
    handle,
    Commands       : ['ttp'],       // الأمر المستخدم / Command trigger
    OnlyPremium    : false,         // لا يقتصر على المستخدمين المميزين / Not for premium users only
    OnlyOwner      : false,         // لا يقتصر على المالك / Not owner-only
    limitDeduction : 1              // خصم حد الاستخدام / Usage cost
};