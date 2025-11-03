// Define the bold sans-serif font style used for transformation 
// تعريف نوع الخط الغامق (Sans-Serif) المستخدم لتحويل النص
const font = '𝗮 𝗯 𝗰 𝗱 𝗲 𝗳 𝗴 𝗵 𝗶 𝗷 𝗸 𝗹 𝗺 𝗻 𝗼 𝗽 𝗾 𝗿 𝘀 𝘁 𝘂 𝘃 𝘄 𝘅 𝘆 𝘇 𝟬 𝟭 𝟮 𝟯 𝟰 𝟱 𝟲 𝟯 𝟴 𝟵 𝗔 𝗕 𝗖 𝗗 𝗘 𝗙 𝗚 𝗛 𝗜 𝗝 𝗞 𝗟 𝗠 𝗡 𝗢 𝗣 𝗤 𝗥 𝗦 𝗧 𝗨 𝗩 𝗪 𝗫 𝗬 𝗭';
const commandName = 'style6';

// Import helper functions / استيراد الدوال المساعدة
const { reply, style } = require('@lib/utils');

// Main handler function / الدالة الرئيسية لمعالجة الأمر
async function handle(sock, messageInfo) {
    const { m, remoteJid, message, prefix, command, content } = messageInfo;

    try {
        // Check if user provided input / التحقق مما إذا أدخل المستخدم نصاً
        if (!content) {
            return await reply(
                m,
                `_⚠️ Usage Format:_ \n\n_💬 Example:_ _*${prefix + command} resbot*_` +
                `\n\n⚙️ _استخدم الأمر بهذا الشكل:_\n💬 _مثال:_ _*${prefix + command} resbot*_`
            );
        }

        // Apply the bold sans-serif style to the text / تطبيق النمط الغامق على النص
        const result = style(content, font);
        if (!result) {
            return await reply(
                m,
                '⚠️ _Failed to apply style. Please check your input._\n⚠️ _فشل تطبيق النمط، يرجى التحقق من النص._'
            );
        }

        // Send styled text to chat / إرسال النص المزخرف إلى الدردشة
        await sock.sendMessage(remoteJid, { text: result }, { quoted: message });

    } catch (error) {
        // Handle errors gracefully / معالجة الأخطاء بطريقة مناسبة
        console.error('Error in handle function:', error);
        await sock.sendMessage(
            remoteJid,
            { text: `_Error: ${error.message}_\n_خطأ:_ ${error.message}` },
            { quoted: message }
        );
    }
}

// Export the command to be used by the bot / تصدير الأمر لاستخدامه داخل البوت
module.exports = {
    handle,
    Commands: [commandName],
    OnlyPremium: false,
    OnlyOwner: false
};