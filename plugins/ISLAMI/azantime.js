const fetch = require('node-fetch');

// Handle function for 'azantime' command / دالة معالجة أمر 'azantime'
async function handle(sock, messageInfo) {
    const { remoteJid, message } = messageInfo;

    try {
        // Send reaction to indicate processing / إرسال رد فعل 🕌
        await sock.sendMessage(remoteJid, { react: { text: "🕌", key: message.key } });

        // Fetch prayer times from API / جلب بيانات الأذان من API
        const res = await fetch("https://muslimsalat.com/cairo.json?key=demo");
        const data = await res.json();

        if (!data || !data.items || !data.items[0]) {
            throw new Error("Prayer times data not found / لم يتم العثور على بيانات.");
        }

        // Extract today's prayer times / استخراج مواقيت اليوم
        const prayerTimes = data.items[0];
        const date = data.date_for;

        const text = `
📅 *Prayer Times Today - Cairo 🇪🇬 / مواقيت الصلاة اليوم - القاهرة*

🕋 Fajr / الفجر: ${prayerTimes.fajr}
🌅 Sunrise / الشروق: ${prayerTimes.shurooq}
☀️ Dhuhr / الظهر: ${prayerTimes.dhuhr}
🌇 Asr / العصر: ${prayerTimes.asr}
🌆 Maghrib / المغرب: ${prayerTimes.maghrib}
🌙 Isha / العشاء: ${prayerTimes.isha}

اللهم رُدَّ كلَ تَاركٍ للصلاةِ إلى الصلاةِ 🤲💚
May Allah guide every person who abandoned prayer back to Salah 🤲💚
`;

        // Send prayer times message / إرسال مواقيت الصلاة للمستخدم
        await sock.sendMessage(remoteJid, { text }, { quoted: message });

    } catch (e) {
        console.error(e);
        // Send error message if failed / إرسال رسالة خطأ إذا فشل
        await sock.sendMessage(remoteJid, {
            text: "⚠️ Error fetching prayer times. Try again later / حدث خطأ أثناء جلب مواقيت الصلاة. حاول لاحقًا."
        }, { quoted: message });
    }
}

// Export module / تصدير الوحدة
module.exports = {
    handle,
    Commands: ['azantime', 'مواقيت'], // Command names / أسماء الأوامر
    OnlyPremium: false,                // Accessible to all users / متاح لجميع المستخدمين
    OnlyOwner: false                   // Not restricted to bot owner / غير مقيد بالمالك
};