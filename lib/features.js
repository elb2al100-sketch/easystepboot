const axios = require('axios');

let cachedJadwalSholat = null; // 🇬🇧 Cache prayer schedule / 🇸🇦 تخزين مؤقت لجدول الصلاة

/**
 * 🇬🇧 Reduce time by certain minutes
 * 🇸🇦 تقليل الوقت بعدد دقائق معين
 */
function kurangiMenit(waktu, menitDikurangi) {
    let [jam, menit] = waktu.split(":").map(Number);
    let totalMenit = jam * 60 + menit - menitDikurangi;

    let newJam = Math.floor(totalMenit / 60);
    let newMenit = totalMenit % 60;

    return `${String(newJam).padStart(2, '0')}:${String(newMenit).padStart(2, '0')}`;
}

/**
 * 🇬🇧 Get prayer schedule for a city (default Jakarta)
 * 🇸🇦 الحصول على جدول الصلاة لمدينة معينة (الافتراضي جاكرتا)
 */
async function getJadwalSholat(kota = 'jakarta') {
    try {
        // 🇬🇧 Return cached data if available / 🇸🇦 إذا كان الجدول موجودًا في الكاش أرجعه مباشرة
        if (cachedJadwalSholat) {
            return cachedJadwalSholat;
        }

        const url = `https://api.autoresbot.com/api/jadwalsholat?kota=${kota}`;

        // 🇬🇧 Call API to get prayer schedule / 🇸🇦 استدعاء API للحصول على جدول الصلاة
        const response = await axios.get(url);

        if (!response || response.status !== 200) {
            throw new Error('Failed to get prayer schedule / فشل في الحصول على جدول الصلاة.');
        }

        // 🇬🇧 Extract prayer times / 🇸🇦 استخراج أوقات الصلاة
        const { subuh, dzuhur, ashar, maghrib, isya } = response.data.data.jadwal;

        const sahur = kurangiMenit(subuh, 60); // 🇬🇧 Sahur time is 1 hour before subuh / وقت السحور ساعة قبل الفجر

        // 🇬🇧 Local schedule object / 🇸🇦 كائن جدول محلي
        const jadwalLokal = { subuh, dzuhur, ashar, maghrib, isya };

        // 🇬🇧 Store in cache / 🇸🇦 تخزين البيانات في الكاش
        cachedJadwalSholat = Object.fromEntries(
            Object.entries(jadwalLokal).map(([key, value]) => [key, value])
        );

        return cachedJadwalSholat;
    } catch (error) {
        console.error('Error in getJadwalSholat:', error.message);
        throw new Error('Failed to get prayer time / فشل في الحصول على وقت الصلاة');
    }
}

/**
 * 🇬🇧 Convert text to audio using Google Translate TTS
 * 🇸🇦 تحويل النص إلى صوت باستخدام خدمة TTS من Google Translate
 */
async function textToAudio(text) {
    try {
        // 🇬🇧 Validate input / 🇸🇦 التحقق من النص
        if (!text || typeof text !== 'string') {
            throw new Error('Text must be a valid string / النص يجب أن يكون سلسلة نصية صالحة.');
        }

        // 🇬🇧 Limit text length for TTS (max 190 chars) / 🇸🇦 حد الطول للنص (أقصى 190 حرف)
        const maxLength = 190;
        const truncatedText = text.slice(0, maxLength).trim();
        
        // 🇬🇧 Google Translate TTS URL / 🇸🇦 رابط خدمة TTS من Google Translate
        const url = `https://translate.google.com/translate_tts?ie=UTF-8&q=${truncatedText}&tl=id&client=tw-ob`;

        // 🇬🇧 Get audio from URL / 🇸🇦 الحصول على الصوت من الرابط
        const response = await axios({
            method: 'get',
            url: url,
            responseType: 'arraybuffer',
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            },
        });

        if (!response || response.status !== 200) {
            throw new Error('Failed to get audio from Google TTS / فشل في الحصول على الصوت من Google TTS.');
        }

        return Buffer.from(response.data);
    } catch (error) {
        console.error('Error in textToAudio:', error.message);
        throw new Error('Failed to convert text to audio / فشل في تحويل النص إلى صوت.');
    }
}

module.exports = { textToAudio, getJadwalSholat };