const ApiAutoresbot = require('api-autoresbot');
const config = require("@config");
const { sendImageAsSticker } = require("@lib/exif");
const { logCustom } = require("@lib/logger");

// 🟢 Main function to handle the "brat2" command
// 🟢 الدالة الرئيسية لمعالجة أمر "brat2"
async function handle(sock, messageInfo) {
    const { remoteJid, message, content, isQuoted, prefix, command } = messageInfo;

    try {
        // 🟣 Get the text from the message or quoted message
        // 🟣 الحصول على النص من الرسالة أو من الرسالة المقتبسة
        const text = content ?? isQuoted?.text ?? null;
        
        // 🟠 Validate user input
        // 🟠 التحقق من أن المستخدم أدخل نصًا بعد الأمر
        if (!text) {
            await sock.sendMessage(remoteJid, {
                // 🇮🇩 "_⚠️ Format Penggunaan:_ \n\n_💬 Contoh:_ _*${prefix + command} resbot*_"
                // 🇬🇧 "_⚠️ Usage Format:_ \n\n_💬 Example:_ _*${prefix + command} resbot*_"
                // 🇸🇦 "_⚠️ تنسيق الاستخدام:_ \n\n_💬 مثال:_ _*${prefix + command} resbot*_"
                text: `_⚠️ Usage Format:_ \n\n_💬 Example:_ _*${prefix + command} resbot*_`
            }, { quoted: message });
            return; // 🚫 Stop execution if there is no content / إيقاف التنفيذ إذا لم يوجد نص
        }

        // 🟡 Send loading reaction (emoji)
        // 🟡 إرسال رمز تعبيري للإشارة إلى أن العملية قيد التنفيذ
        await sock.sendMessage(remoteJid, {
            react: { text: "🤌🏻", key: message.key }
        });

        // 🔵 Clean up text input by removing newlines and extra spaces
        // 🔵 تنظيف النص من الأسطر الجديدة أو الفراغات الزائدة
        const sanitizedContent = encodeURIComponent(text.trim().replace(/\n+/g, " "));

        // 🟣 Create API instance and get image buffer from endpoint
        // 🟣 إنشاء مثيل من واجهة API والحصول على الصورة من نقطة النهاية المحددة
        const api = new ApiAutoresbot(config.APIKEY);
        const buffer = await api.getBuffer('/api/maker/brat2', { text: sanitizedContent });

        // 🟢 Sticker options (pack name and author)
        // 🟢 إعدادات الستيكر (اسم الحزمة والمؤلف)
        const options = {
            packname: config.sticker_packname,
            author: config.sticker_author,
        };

        // 🟩 Send the generated sticker to the user
        // 🟩 إرسال الستيكر الناتج إلى المستخدم
        await sendImageAsSticker(sock, remoteJid, buffer, options, message);

    } catch (error) {
        // 🟥 Log the error for debugging purposes
        // 🟥 تسجيل الخطأ في ملف لمراجعة الأخطاء لاحقًا
        logCustom('info', content, `ERROR-COMMAND-${command}.txt`);

        // 🇮🇩 "Maaf, terjadi kesalahan saat memproses permintaan Anda. Coba lagi nanti."
        // 🇬🇧 "Sorry, an error occurred while processing your request. Please try again later."
        // 🇸🇦 "عذرًا، حدث خطأ أثناء معالجة طلبك. يرجى المحاولة لاحقًا."
        const errorMessage = `Sorry, an error occurred while processing your request. Please try again later.\n\nError: ${error.message}`;

        // 📨 Send the error message back to the user
        // 📨 إرسال رسالة الخطأ إلى المستخدم
        await sock.sendMessage(remoteJid, {
            text: errorMessage
        }, { quoted: message });
    }
}

// 🧩 Export command configuration
// 🧩 تصدير إعدادات الأمر
module.exports = {
    handle,
    Commands: ['brat2'],       // The command keyword / كلمة الأمر
    OnlyPremium: false,        // Not limited to premium users / لا يقتصر على المستخدمين المميزين
    OnlyOwner: false,          // Not limited to owner / لا يقتصر على المالك
    limitDeduction: 1          // Deduct 1 usage point per command / خصم نقطة استخدام واحدة لكل أمر
};