// Define the font style used for transformation / تحديد نوع الخط المستخدم للتحويل
const font = 'ａｂｃｄｅｆｇｈｉｊｋｌｍｎｏｐｑｒｓｔｕｖｗｘｙｚ１２３４５６７８９０ ＡＢＣＤＥＦＧＨＩＪＫＬＭＮＯＰＱＲＳＴＵＶＷＸＹＺ';
const commandName = 'style3';

// Import necessary utilities / استيراد الأدوات المساعدة المطلوبة
const { reply, style } = require('@lib/utils');

// Main command handler / الدالة الرئيسية لمعالجة الأمر
async function handle(sock, messageInfo) {
    const { m, remoteJid, message, prefix, command, content } = messageInfo;

    try {
        // If no input is provided, show usage example / إذا لم يُدخل المستخدم نصاً، أرسل له مثال الاستخدام
        if (!content) {
            return await reply(
                m,
                `_⚠️ Usage Format:_ \n\n_💬 Example:_ _*${prefix + command} resbot*_` +
                `\n\n⚙️ _استخدم الأمر بهذا الشكل:_\n💬 _مثال:_ _*${prefix + command} resbot*_`
            );
        }

        // Apply the special font style / تطبيق نمط الخط المزخرف
        const result = style(content, font);
        if (!result) {
            return await reply(
                m,
                '⚠️ _Failed to apply style. Please check your input._\n⚠️ _فشل تطبيق النمط، يرجى التحقق من النص المدخل._'
            );
        }

        // Send the result back to the chat / إرسال النتيجة مرة أخرى إلى الدردشة
        await sock.sendMessage(remoteJid, { text: result }, { quoted: message });

    } catch (error) {
        // Handle and report any errors / معالجة وإظهار أي أخطاء
        console.error('Error in handle function:', error);
        await sock.sendMessage(
            remoteJid,
            { text: `_Error: ${error.message}_\n_خطأ:_ ${error.message}` },
            { quoted: message }
        );
    }
}

// Export the module so it can be used elsewhere / تصدير الوحدة ليتم استخدامها في أماكن أخرى
module.exports = {
    handle,
    Commands: [commandName],
    OnlyPremium: false,
    OnlyOwner: false
};