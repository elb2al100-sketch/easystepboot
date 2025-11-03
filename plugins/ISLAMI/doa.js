const ApiAutoresbot = require('api-autoresbot'); // API client for autoresbot / عميل API لبوت autoresbot
const config = require("@config");               // Configuration file / ملف الإعدادات
const { logCustom } = require("@lib/logger");    // Custom logger / وحدة تسجيل مخصصة

// Handle function for 'doa' command / دالة معالجة أمر 'doa'
async function handle(sock, messageInfo) {
    const { remoteJid, message, prefix, command, content } = messageInfo;

    try {
        // Send loading reaction / إرسال رد فعل 🙏🏻 عند الانتظار
        await sock.sendMessage(remoteJid, { react: { text: "🙏🏻", key: message.key } });

        // Initialize API client / تهيئة عميل API
        const api = new ApiAutoresbot(config.APIKEY);

        // Call API based on user input / استدعاء API حسب محتوى المستخدم
        const endpoint = content ? '/api/doa' : '/api/doa/random';
        const params = content ? { q: content } : {};
        const response = await api.get(endpoint, params);

        // Validate API response / التحقق من استجابة API
        if (response?.data?.length) {
            const doaInfo = response.data[0]; // Get first result / الحصول على أول نتيجة
            const msgNiatSholat = `_*${doaInfo.doa}*_  \n\n` +
                `${doaInfo.ayat}\n` +
                `${doaInfo.latin}\n\n` +
                `_${doaInfo.artinya}_`;

            // Send doa information to user / إرسال معلومات الدعاء للمستخدم
            await sock.sendMessage(remoteJid, { text: msgNiatSholat }, { quoted: message });
        } else {
            logCustom('info', content, `ERROR-COMMAND-${command}.txt`);
            // Message if no data found / رسالة إذا لم يتم العثور على بيانات
            const notFoundMessage = `_Doa *${content || "yang Anda cari"}* tidak ditemukan._\n` +
                `_Coba gunakan kata kunci yang lebih spesifik atau pendek._\n\n` +
                `_Misalnya / For example: *${prefix + command} tidur*._`;
            await sock.sendMessage(remoteJid, { text: notFoundMessage }, { quoted: message });
        }
    } catch (error) {
        console.error("Error saat memanggil API doa / Error calling doa API:", error);
        logCustom('info', content, `ERROR-COMMAND-${command}.txt`);

        // Send error message to user / إرسال رسالة خطأ للمستخدم
        const errorMessage = `Maaf / Sorry, terjadi kesalahan saat memproses permintaan Anda / حدث خطأ أثناء معالجة طلبك. Coba lagi nanti / حاول لاحقاً.\n\nDetail Kesalahan / Error Detail: ${error.message}`;
        await sock.sendMessage(remoteJid, { text: errorMessage }, { quoted: message });
    }
}

// Export module / تصدير الوحدة
module.exports = {
    handle,
    Commands    : ['doa'],  // Command name / اسم الأمر
    OnlyPremium : false,    // Accessible to all users / متاح لجميع المستخدمين
    OnlyOwner   : false     // Not restricted to bot owner / غير مقيد بالمالك
};