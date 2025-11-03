// Define the font style used for text transformation / تحديد نوع الخط المستخدم لتحويل النص
const font = 'ⓐ ⓑ ⓒ ⓓ ⓔ ⓕ ⓖ ⓗ ⓘ ⓙ ⓚ ⓛ ⓜ ⓝ ⓞ ⓟ ⓠ ⓡ ⓢ ⓣ ⓤ ⓥ ⓦ ⓧ ⓨ ⓩ ⓪ ① ② ③ ④ ⑤ ⑥ ⑦ ⑧ ⑨ Ⓐ Ⓑ Ⓒ Ⓓ Ⓔ Ⓕ Ⓖ Ⓗ Ⓘ Ⓙ Ⓚ Ⓛ Ⓜ️ Ⓝ Ⓞ Ⓟ Ⓠ Ⓡ Ⓢ Ⓣ Ⓤ Ⓥ Ⓦ Ⓧ Ⓨ Ⓩ';
const commandName = 'style4';

// Import helper functions / استيراد الدوال المساعدة
const { reply, style } = require('@lib/utils');

// Main command handler / الدالة الرئيسية لمعالجة الأمر
async function handle(sock, messageInfo) {
    const { m, remoteJid, message, prefix, command, content } = messageInfo;

    try {
        // Check if user provided text / التحقق إذا أدخل المستخدم نصًا أم لا
        if (!content) {
            return await reply(
                m,
                `_⚠️ Usage Format:_ \n\n_💬 Example:_ _*${prefix + command} resbot*_` +
                `\n\n⚙️ _استخدم الأمر بهذا الشكل:_\n💬 _مثال:_ _*${prefix + command} resbot*_`
            );
        }

        // Apply font style to the text / تطبيق نمط الخط على النص
        const result = style(content, font);
        if (!result) {
            return await reply(
                m,
                '⚠️ _Failed to apply style. Please check your input._\n⚠️ _فشل تطبيق النمط، يرجى التحقق من النص._'
            );
        }

        // Send the styled result to chat / إرسال النتيجة المزخرفة إلى الدردشة
        await sock.sendMessage(remoteJid, { text: result }, { quoted: message });

    } catch (error) {
        // Handle errors gracefully / معالجة الأخطاء بطريقة آمنة
        console.error('Error in handle function:', error);
        await sock.sendMessage(
            remoteJid,
            { text: `_Error: ${error.message}_\n_خطأ:_ ${error.message}` },
            { quoted: message }
        );
    }
}

// Export module for use in bot / تصدير الوحدة ليتمكن البوت من استخدامها
module.exports = {
    handle,
    Commands: [commandName],
    OnlyPremium: false,
    OnlyOwner: false
};