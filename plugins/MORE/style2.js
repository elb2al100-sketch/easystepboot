// Import required utilities / استيراد الأدوات اللازمة
const font = '𝓪 𝓫 𝓬 𝓭 𝓮 𝓯 𝓰 𝓱 𝓲 𝓳 𝓴 𝓵 𝓶 𝓷 𝓸 𝓹 𝓺 𝓻 𝓼 𝓽 𝓾 𝓿 𝔀 𝔁 𝔂 𝔃 0 1 2 3 4 5 6 7 8 9 𝓐 𝓑 𝓒 𝓓 𝓔 𝓕 𝓖 𝓗 𝓘 𝓙 𝓚 𝓛 𝓜 𝓝 𝓞 𝓟 𝓠 𝓡 𝓢 𝓣 𝓤 𝓥 𝓦 𝓧 𝓨 𝓩';
const commandName = 'style2';

const { reply, style } = require('@lib/utils');

// Define the handler function / تعريف دالة المعالجة الرئيسية
async function handle(sock, messageInfo) {
    const { m, remoteJid, message, prefix, command, content } = messageInfo;

    try {
        // If there is no input content, show usage example / إذا لم يُدخل المستخدم نصاً، أرسل له مثال الاستخدام
        if (!content) {
            return await reply(
                m,
                `_⚠️ Usage Format:_ \n\n_💬 Example:_ _*${prefix + command} resbot*_` +
                `\n\n⚙️ _استخدم الأمر بهذا الشكل:_\n💬 _مثال:_ _*${prefix + command} resbot*_`
            );
        }

        // Apply the chosen font style / تطبيق النمط الكتابي المحدد
        const result = style(content, font);
        if (!result) {
            return await reply(
                m,
                '⚠️ _Failed to apply style. Please check your input._\n⚠️ _فشل تطبيق النمط، يرجى التحقق من النص المدخل._'
            );
        }

        // Send the styled text as a message / إرسال النص المزخرف كرد للمستخدم
        await sock.sendMessage(remoteJid, { text: result }, { quoted: message });

    } catch (error) {
        // Handle and display any errors / معالجة وعرض الأخطاء إن وجدت
        console.error('Error in handle function:', error);
        await sock.sendMessage(
            remoteJid,
            { text: `_Error: ${error.message}_\n_خطأ:_ ${error.message}` },
            { quoted: message }
        );
    }
}

// Export module information / تصدير معلومات الوحدة
module.exports = {
    handle,
    Commands: [commandName],
    OnlyPremium: false,
    OnlyOwner: false
};