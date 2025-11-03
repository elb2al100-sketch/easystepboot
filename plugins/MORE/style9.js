// Define the square style font / تعريف نوع الخط على شكل مربعات
const font = '🄰 🄱 🄲 🄳 🄴 🄵 🄶 🄷 🄸 🄹 🄺 🄻 🄼 🄽 🄾 🄿 🅀 🅁 🅂 🅃 🅄 🅅 🅆 🅇 🅈 🅉 0 1 2 3 4 5 6 7 8 9 🄰 🄱 🄲 🄳 🄴 🄵 🄶 🄷 🄸 🄹 🄺 🄻 🄼 🄽 🄾 🄿 🅀 🅁 🅂 🅃 🅄 🅅 🅆 🅇 🅈 🅉';
const commandName = 'style9';

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

        // Apply the square font style / تطبيق نمط الخط المربع
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