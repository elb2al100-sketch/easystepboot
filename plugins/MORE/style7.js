// Define the italic-like font style / تعريف نوع الخط المائل المستخدم
const font = '𝘢 𝘣 𝘤 𝘥 𝘦 𝘧 𝘨 𝘩 𝘪 𝘫 𝘬 𝘭 𝘮 𝘯 𝘰 𝘱 𝘲 𝘳 𝘴 𝘵 𝘶 𝘷 𝘸 𝘹 𝘺 𝘻 0 1 2 3 4 5 6 7 8 9 𝘈 𝘉 𝘊 𝘋 𝘌 𝘍 𝘎 𝘏 𝘐 𝘑 𝘒 𝘓 𝘔 𝘕 𝘖 𝘗 𝘘 𝘙 𝘚 𝘛 𝘜 𝘝 𝘞 𝘟 𝘠 𝘡';
const commandName = 'style7';

// Import helper functions / استيراد الدوال المساعدة
const { reply, style } = require('@lib/utils');

// Main handler function / الدالة الرئيسية لمعالجة الأمر
async function handle(sock, messageInfo) {
    const { m, remoteJid, message, prefix, command, content } = messageInfo;

    try {
        // Check if user provided text / التحقق من إدخال المستخدم للنص
        if (!content) {
            return await reply(
                m,
                `_⚠️ Usage Format:_ \n\n_💬 Example:_ _*${prefix + command} resbot*_` +
                `\n\n⚙️ _صيغة الاستخدام:_\n💬 _مثال:_ _*${prefix + command} resbot*_`
            );
        }

        // Apply the italic-like style / تطبيق نمط النص المائل
        const result = style(content, font);
        if (!result) {
            return await reply(
                m,
                '⚠️ _Failed to apply style. Please check your input._\n⚠️ _فشل تطبيق النمط، تحقق من النص._'
            );
        }

        // Send the styled text / إرسال النص المزخرف
        await sock.sendMessage(remoteJid, { text: result }, { quoted: message });

    } catch (error) {
        // Handle errors gracefully / التعامل مع الأخطاء
        console.error('Error in handle function:', error);
        await sock.sendMessage(
            remoteJid,
            { text: `_Error: ${error.message}_\n_خطأ: ${error.message}_` },
            { quoted: message }
        );
    }
}

// Export the command / تصدير الأمر
module.exports = {
    handle,
    Commands: [commandName],
    OnlyPremium: false,
    OnlyOwner: false
};