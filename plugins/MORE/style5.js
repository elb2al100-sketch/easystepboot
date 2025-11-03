// Define the bold serif font style used for transformation / تحديد نوع الخط العريض المستخدم لتحويل النص
const font = '𝐚 𝐛 𝐜 𝐝 𝐞 𝐟 𝐠 𝐡 𝐢 𝐣 𝐤 𝐥 𝐦 𝐧 𝐨 𝐩 𝐪 𝐫 𝐬 𝐭 𝐮 𝐯 𝐰 𝐱 𝐲 𝐳 𝟎 𝟏 𝟐 𝟑 𝟒 𝟓 𝟔 𝟕 𝟖 𝟗 𝐀 𝐁 𝐂 𝐃 𝐄 𝐅 𝐆 𝐇 𝐈 𝐉 𝐊 𝐋 𝐌 𝐍 𝐎 𝐏 𝐐 𝐑 𝐒 𝐓 𝐔 𝐕 𝐖 𝐗 𝐘 𝐙';
const commandName = 'style5';

// Import helper utilities / استيراد الأدوات المساعدة
const { reply, style } = require('@lib/utils');

// Main handler for the command / الدالة الرئيسية لمعالجة الأمر
async function handle(sock, messageInfo) {
    const { m, remoteJid, message, prefix, command, content } = messageInfo;

    try {
        // Check if user provided text / التحقق مما إذا أدخل المستخدم نصاً
        if (!content) {
            return await reply(
                m,
                `_⚠️ Usage Format:_ \n\n_💬 Example:_ _*${prefix + command} resbot*_` +
                `\n\n⚙️ _استخدم الأمر بهذا الشكل:_\n💬 _مثال:_ _*${prefix + command} resbot*_`
            );
        }

        // Apply bold serif style to the text / تطبيق نمط الخط العريض على النص
        const result = style(content, font);
        if (!result) {
            return await reply(
                m,
                '⚠️ _Failed to apply style. Please check your input._\n⚠️ _فشل تطبيق النمط، يرجى التحقق من النص._'
            );
        }

        // Send the styled text to the chat / إرسال النص المزخرف إلى الدردشة
        await sock.sendMessage(remoteJid, { text: result }, { quoted: message });

    } catch (error) {
        // Handle and show errors / معالجة الأخطاء وإظهارها
        console.error('Error in handle function:', error);
        await sock.sendMessage(
            remoteJid,
            { text: `_Error: ${error.message}_\n_خطأ:_ ${error.message}` },
            { quoted: message }
        );
    }
}

// Export the module for bot command registration / تصدير الوحدة لاستخدامها كأمر في البوت
module.exports = {
    handle,
    Commands: [commandName],
    OnlyPremium: false,
    OnlyOwner: false
};