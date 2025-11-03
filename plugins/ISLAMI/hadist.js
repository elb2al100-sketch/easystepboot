const ApiAutoresbot = require('api-autoresbot'); // API client for autoresbot / عميل API لبوت autoresbot
const config = require("@config");              // Configuration file / ملف الإعدادات

// Handle function for 'hadis' command / دالة معالجة أمر 'hadis'
async function handle(sock, messageInfo) {
    const { remoteJid, message } = messageInfo;

    try {
        // Send loading reaction / إرسال رد فعل ✅ عند الانتظار
        await sock.sendMessage(remoteJid, { react: { text: "✅", key: message.key } });

        // Initialize API client / تهيئة عميل API
        const api = new ApiAutoresbot(config.APIKEY);

        // Call API to get random hadith / استدعاء API للحصول على حديث شريف عشوائي
        const response = await api.get('/api/hadits');

        // Validate response / التحقق من استجابة API
        if (response?.data && response.data.judul && response.data.arab && response.data.indo) {
            const dataHadist = `📖 *${response.data.judul}*\n\n` +
                `🔹 *Arab / Arabic:*\n${response.data.arab}\n\n` +
                `🔸 *Terjemahan / Translation:*\n${response.data.indo}`;

            // Send hadith data to user / إرسال الحديث الشريف للمستخدم
            await sock.sendMessage(remoteJid, { text: dataHadist }, { quoted: message });
        } else {
            console.warn("Respons API tidak sesuai / API response invalid:", response?.data);

            // Message if data is empty / رسالة إذا لم تتوفر بيانات
            const noDataMessage = "Maaf / Sorry, tidak ada data hadits yang tersedia saat ini. Coba lagi nanti / لا توجد بيانات حديث متاحة حالياً. حاول لاحقاً.";
            await sock.sendMessage(remoteJid, { text: noDataMessage }, { quoted: message });
        }
    } catch (error) {
        console.error("Error saat memanggil API hadits / Error calling hadith API:", error);

        // Send error message to user / إرسال رسالة خطأ للمستخدم
        const errorMessage = `Maaf / Sorry, terjadi kesalahan saat memproses permintaan Anda / حدث خطأ أثناء معالجة طلبك. Coba lagi nanti / حاول لاحقاً.\n\nDetail Kesalahan / Error Detail: ${error.message}`;
        await sock.sendMessage(remoteJid, { text: errorMessage }, { quoted: message });
    }
}

// Export module / تصدير الوحدة
module.exports = {
    handle,
    Commands    : ['hadis', 'hadist', 'hadits'], // Command names / أسماء الأوامر
    OnlyPremium : false,                          // Accessible to all users / متاح لجميع المستخدمين
    OnlyOwner   : false                            // Not restricted to bot owner / غير مقيد بالمالك
};