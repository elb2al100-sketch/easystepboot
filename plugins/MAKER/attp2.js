const ApiAutoresbot = require('api-autoresbot');
const config = require("@config");
const { sendImageAsSticker } = require("@lib/exif");

async function handle(sock, messageInfo) {
    const { remoteJid, message, content, isQuoted, prefix, command } = messageInfo;

    try {
        // ✅ Get text from message or quoted text
        // ✅ الحصول على النص من الرسالة أو من الرسالة المقتبسة
        const text = content ?? isQuoted?.text ?? null;

        // ⚠️ Validate user input
        // ⚠️ التحقق من أن المستخدم كتب نصًا بعد الأمر
        if (!text) {
            await sock.sendMessage(remoteJid, {
                text: `_⚠️ Usage Format / تنسيق الاستخدام:_ \n\n_💬 Example / مثال:_ _*${prefix + command} resbot*_`
            }, { quoted: message });
            return; // 🛑 Stop execution if no input / إيقاف التنفيذ إذا لم يوجد إدخال
        }

        // 🤌🏻 Send loading reaction
        // 🤌🏻 إرسال رد فعل (إيموجي) لإظهار أن النظام يعمل على معالجة الطلب
        await sock.sendMessage(remoteJid, {
            react: { text: "🤌🏻", key: message.key }
        });

        // 🌐 Create API instance and fetch data from endpoint
        // 🌐 إنشاء كائن من واجهة API وجلب البيانات من المسار المحدد
        const api = new ApiAutoresbot(config.APIKEY);
        const response = await api.getBuffer('/api/maker/attp3', { text: text });

        // 🧩 Send sticker as response
        // 🧩 إرسال النتيجة كملصق (sticker) إلى المستخدم
        await sock.sendMessage(remoteJid, {
            sticker: response
        }, { quoted: message });

    } catch (error) {
        // ❌ Handle errors and send message to user
        // ❌ معالجة الأخطاء وإرسال رسالة ودّية للمستخدم
        const errorMessage = 
            `😔 Sorry, an error occurred while processing your request.\n` +
            `عذرًا، حدث خطأ أثناء معالجة طلبك.\n\n` +
            `Please try again later / حاول مرة أخرى لاحقًا.\n\n` +
            `Error / الخطأ: ${error.message}`;

        await sock.sendMessage(remoteJid, {
            text: errorMessage
        }, { quoted: message });
    }
}

module.exports = {
    handle,
    Commands    : ['attp2'],   // 🧠 Command name / اسم الأمر
    OnlyPremium : false,       // 🚫 Not premium-only / غير مخصص للمميزين فقط
    OnlyOwner   : false        // 👥 Accessible by all users / متاح للجميع
};