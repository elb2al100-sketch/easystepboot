const ApiAutoresbot = require('api-autoresbot');
const config = require("@config");

async function handle(sock, messageInfo) {
    const { remoteJid, message, content, isQuoted, prefix, command } = messageInfo;

    try {
        // ✅ Get the text from the message or quoted message
        // ✅ الحصول على النص من الرسالة أو من الرسالة المقتبسة
        const text = content && content.trim() !== '' ? content : isQuoted?.text ?? null;

        // ⚠️ Validate input content
        // ⚠️ التحقق من أن المستخدم أدخل نصًا
        if (!text) {
            await sock.sendMessage(remoteJid, {
                text: `_⚠️ Usage Format / تنسيق الاستخدام:_ \n\n_💬 Example / مثال:_ _*${prefix + command} resbot*_`
            }, { quoted: message });
            return; // 🛑 Stop execution if no content / إيقاف التنفيذ إذا لم يتم إدخال نص
        }

        // 🤌🏻 Send loading reaction
        // 🤌🏻 إرسال رد فعل (إيموجي) أثناء التحميل
        await sock.sendMessage(remoteJid, {
            react: { text: "🤌🏻", key: message.key }
        });

        // 🌐 Create API instance and fetch data from endpoint
        // 🌐 إنشاء كائن من واجهة API وجلب البيانات من المسار المحدد
        const api = new ApiAutoresbot(config.APIKEY);
        const response = await api.getBuffer('/api/maker/attp2', { text: text });

        // 🎨 Send the generated sticker as response
        // 🎨 إرسال الملصق (sticker) الناتج كردّ على المستخدم
        await sock.sendMessage(remoteJid, {
            sticker: response
        }, { quoted: message });

    } catch (error) {
        // ❌ Handle error and send message to user
        // ❌ معالجة الخطأ وإرسال رسالة للمستخدم
        const errorMessage = 
            `😔 Sorry, an error occurred while processing your request. Please try again later.\n` +
            `عذرًا، حدث خطأ أثناء معالجة طلبك. حاول مرة أخرى لاحقًا.\n\n` +
            `Error / الخطأ: ${error.message}`;

        await sock.sendMessage(remoteJid, {
            text: errorMessage
        }, { quoted: message });
    }
}

module.exports = {
    handle,
    Commands        : ['attp'],      // Command name / اسم الأمر
    OnlyPremium     : false,         // Not limited to premium users / غير حصري للمستخدمين المميزين
    OnlyOwner       : false,         // Everyone can use / متاح للجميع
    limitDeduction  : 1              // Limit usage deduction / خصم مرة واحدة من الحد اليومي
};