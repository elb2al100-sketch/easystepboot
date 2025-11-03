const fetch = require('node-fetch');
const schedule = require('node-schedule'); // Scheduler / جدولة المهام
const sock = require('@lib/sock'); // اتصال البوت / Bot connection
const config = require('@config'); // إعدادات البوت / Bot config

// روابط ملفات الأذان / Azan MP3 links
const azanUrls = {
    subuh: 'https://api.autoresbot.com/mp3/azan-subuh.m4a',
    dzuhur: 'https://api.autoresbot.com/mp3/azan-dzuhur.m4a',
    ashar: 'https://api.autoresbot.com/mp3/azan-ashar.m4a',
    maghrib: 'https://api.autoresbot.com/mp3/azan-maghrib.m4a',
    isya: 'https://api.autoresbot.com/mp3/azan-isya.m4a'
};

// أسماء الصلوات / Prayer names
const prayerNames = {
    subuh: "أذان صلاة الفجر 🌅",
    dzuhur: "أذان صلاة الظهر ☀️",
    ashar: "أذان صلاة العصر 🌇",
    maghrib: "أذان صلاة المغرب 🌆",
    isya: "أذان صلاة العشاء 🌙"
};

// دالة لجلب مواقيت الصلاة لمدينة القاهرة / Fetch prayer times for Cairo
async function getPrayerTimes() {
    try {
        const res = await fetch("https://muslimsalat.com/cairo.json?key=demo");
        const data = await res.json();
        if (!data || !data.items || !data.items[0]) throw new Error("No data found / لا توجد بيانات");
        return data.items[0]; // أوقات الصلاة اليوم / Today's prayer times
    } catch (e) {
        console.error('Error fetching prayer times / خطأ في جلب مواقيت الصلاة:', e);
        return null;
    }
}

// دالة لإرسال الأذان مع رسالة باسم الصلاة / Send Azan audio with prayer name
async function sendAzan(prayer) {
    const audioUrl = azanUrls[prayer];
    if (!audioUrl) return;

    // إرسال رسالة قبل الأذان / Send text message with prayer name
    await sock.sendMessage(config.targetJid, { text: prayerNames[prayer] });

    // إرسال ملف الأذان / Send audio
    await sock.sendMessage(config.targetJid, {
        audio: { url: audioUrl },
        mimetype: 'audio/mp4',
        ptt: true
    });

    console.log(`🕌 Sent Azan for ${prayer} / تم إرسال الأذان لصلاة ${prayer}`);
}

// تحويل صيغة الوقت AM/PM إلى 24 ساعة / Convert time string to 24h format
function convertTo24h(timeStr) {
    const [time, modifier] = timeStr.split(' ');
    let [hours, minutes] = time.split(':').map(Number);
    if (modifier === 'PM' && hours !== 12) hours += 12;
    if (modifier === 'AM' && hours === 12) hours = 0;
    return { hours, minutes };
}

// دالة لجدولة الأذان حسب مواقيت الصلاة / Schedule Azan for today
async function scheduleAzanForToday() {
    const times = await getPrayerTimes();
    if (!times) return;

    const prayers = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];
    const prayerMap = { fajr: 'subuh', dhuhr: 'dzuhur', asr: 'ashar', maghrib: 'maghrib', isha: 'isya' };

    prayers.forEach(prayer => {
        const { hours, minutes } = convertTo24h(times[prayer]);
        schedule.scheduleJob({ hour: hours, minute: minutes }, async () => {
            await sendAzan(prayerMap[prayer]);
        });
    });

    console.log('✅ Azan scheduled for today / تم جدولة الأذان لليوم');
}

// دالة لإعادة جدولة الأذان كل يوم صباحاً قبل الفجر / Reschedule every day at 03:00
schedule.scheduleJob({ hour: 3, minute: 0 }, async () => {
    console.log('🔄 Updating prayer times for today / تحديث مواقيت الصلاة لليوم');
    await scheduleAzanForToday();
});

// تشغيل جدولة اليوم عند بدء البوت / Schedule today's Azan immediately
scheduleAzanForToday();
console.log('✅ Azan scheduler started for Cairo 🇪🇬 / تم بدء جدولة الأذان للقاهرة');