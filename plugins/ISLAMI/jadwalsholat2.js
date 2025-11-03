const ApiAutoresbot = require("api-autoresbot"); // API client for autoresbot / عميل API لبوت autoresbot
const config = require("@config");              // Configuration file / ملف الإعدادات
const mess = require("@mess");                  // Predefined messages / الرسائل الجاهزة

// Handle function for 'jadwalsholat2' command / دالة معالجة أمر 'jadwalsholat2'
async function handle(sock, messageInfo) {
    try {
        const { remoteJid, message, content, prefix, command } = messageInfo;

        // If no content is provided, show usage instructions / إذا لم يُدخل المستخدم أي محتوى، عرض تعليمات الاستخدام
        if (!content) {
            await sock.sendMessage(remoteJid, {
                text: `_⚠️ Format Penggunaan / Usage Format:_ \n\n_💬 Contoh / Example:_ _*${prefix + command} sambas*_`
            }, { quoted: message });
            return; // Stop execution / إيقاف التنفيذ إذا لم يوجد محتوى
        }

        // Send a loading reaction / إرسال رد فعل انتظار
        await sock.sendMessage(remoteJid, { react: { text: "📿", key: message.key } });

        // Initialize API client / تهيئة عميل API
        const api = new ApiAutoresbot(config.APIKEY);

        // Get prayer schedule image buffer from API / الحصول على صورة جدول مواقيت الصلاة من API
        const buffer = await api.getBuffer(`/api/maker/jadwalsholat`, {
            kota: content // City parameter / اسم المدينة
        });

        // Send the image to the user with success caption / إرسال الصورة للمستخدم مع رسالة نجاح
        await sock.sendMessage(
            remoteJid,
            { image: buffer, caption: mess.general.success },
            { quoted: message }
        );
    } catch (error) {
        console.error("Error in handle function / خطأ في دالة المعالجة:", error.message);
    }
}

// Export module / تصدير الوحدة
module.exports = {
    handle,
    Commands: ['jadwalsholat2'], // Command names / أسماء الأوامر
    OnlyPremium: false,           // Accessible to all users / متاح لجميع المستخدمين
    OnlyOwner: false,             // Not restricted to bot owner / غير مقيد بالمالك
    limitDeduction: 1,            // Amount of limit to deduct / كمية الحد الذي سيتم خصمه
};