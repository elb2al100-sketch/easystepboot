const ApiAutoresbot = require('api-autoresbot');
const config = require("@config");
const { logCustom } = require("@lib/logger");

// Handle prayer schedule command / معالجة أمر جدول الصلاة
async function handle(sock, messageInfo) {
    const { remoteJid, message, prefix, command, content } = messageInfo;

    try {
        // Validate if `content` is empty / التحقق إذا كان المحتوى فارغ
        if (!content) {
            const usageMessage = `_⚠️ Usage Format / صيغة الاستخدام:_ \n\n_💬 Example / مثال:_ _*${prefix + command} sambas*_`;
            await sock.sendMessage(remoteJid, { text: usageMessage }, { quoted: message });
            return;
        }

        // Send loading reaction / إرسال رد فعل التحميل
        await sock.sendMessage(remoteJid, { react: { text: "⏰", key: message.key } });

        const api = new ApiAutoresbot(config.APIKEY);

        // Call prayer schedule API / استدعاء واجهة برمجة التطبيقات لجدول الصلاة
        const response = await api.get('/api/jadwalsholat', { kota: content });

        // Validate response / التحقق من الاستجابة
        const prayerSchedule = response?.data?.jadwal;
        if (prayerSchedule) {
            const formattedSchedule = `_Prayer Schedule for Area *${content.toUpperCase()}* / جدول الصلاة لمنطقة *${content.toUpperCase()}*_\n\n` +
                `_${prayerSchedule.tanggal}_ / التاريخ\n\n` +
                `◧ [ ${prayerSchedule.imsak} ] Imsak\n` +
                `◧ [ ${prayerSchedule.subuh} ] *Subuh / الفجر*\n` +
                `◧ [ ${prayerSchedule.dhuha} ] Dhuha / الضحى\n` +
                `◧ [ ${prayerSchedule.dzuhur} ] *Dzuhur / الظهر*\n` +
                `◧ [ ${prayerSchedule.ashar} ] *Ashar / العصر*\n` +
                `◧ [ ${prayerSchedule.maghrib} ] *Maghrib / المغرب*\n` +
                `◧ [ ${prayerSchedule.isya} ] *Isya / العشاء*`;

            // Send prayer schedule to user / إرسال جدول الصلاة للمستخدم
            await sock.sendMessage(remoteJid, { text: formattedSchedule }, { quoted: message });
        } else {
            // Log content if response is empty / تسجيل المحتوى إذا كانت الاستجابة فارغة
            logCustom('info', content, `ERROR-COMMAND-${command}.txt`);
            
            // Message if no data found / رسالة إذا لم توجد بيانات
            const noDataMessage = `⚠️ _No results found for city *${content}* / لا توجد نتائج للمدينة *${content}*._`;
            await sock.sendMessage(remoteJid, { text: noDataMessage }, { quoted: message });
        }
    } catch (error) {
        // Log error for debugging / تسجيل الخطأ لأغراض التصحيح
        logCustom('info', content, `ERROR-COMMAND-${command}.txt`);
        
        // Error message to user / رسالة خطأ للمستخدم
        const errorMessage = `Sorry, an error occurred while processing your request / عذراً، حدث خطأ أثناء معالجة طلبك.\n\n` +
                             `Error Details / تفاصيل الخطأ: ${error.message}`;
        await sock.sendMessage(remoteJid, { text: errorMessage }, { quoted: message });
    }
}

// Export module / تصدير الوحدة
module.exports = {
    handle,
    Commands    : ['jadwalsholat', 'jadwalshalat'], // Command triggers / أوامر التشغيل
    OnlyPremium : false, // Not limited to premium users / غير مقتصر على المميزين
    OnlyOwner   : false  // Not limited to owner / غير مقتصر على المالك
};