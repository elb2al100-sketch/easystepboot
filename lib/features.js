const axios = require('axios');

let cachedJadwalSholat = null; // Cache for prayer times / ذاكرة مؤقتة لمواقيت الصلاة

/**
 * ⏱ Reduce minutes from given time
 * طرح عدد الدقائق من الوقت المعطى
 * 
 * @param {string} waktu - Time in format "HH:MM" / الوقت بصيغة "HH:MM"
 * @param {number} menitDikurangi - Minutes to subtract / عدد الدقائق المطلوب طرحها
 * @returns {string} New time after subtracting minutes / الوقت الجديد بعد الطرح
 */
function kurangiMenit(waktu, menitDikurangi) {
    let [jam, menit] = waktu.split(":").map(Number);
    let totalMenit = jam * 60 + menit - menitDikurangi;

    let newJam = Math.floor(totalMenit / 60);
    let newMenit = totalMenit % 60;

    return `${String(newJam).padStart(2, '0')}:${String(newMenit).padStart(2, '0')}`;
}

/**
 * 📿 Get prayer schedule for a city
 * الحصول على مواقيت الصلاة لمدينة معينة
 * 
 * @param {string} kota - City name / اسم المدينة
 * @returns {Object} Prayer times / مواقيت الصلاة
 */
async function getJadwalSholat(kota = 'jakarta') {
    try {
        // Return cached data if available / إرجاع البيانات من الذاكرة المؤقتة إذا كانت موجودة
        if (cachedJadwalSholat) {
            return cachedJadwalSholat;
        }

        const url = `https://api.autoresbot.com/api/jadwalsholat?kota=${kota}`;

        // Call API to get prayer schedule / استدعاء API للحصول على مواقيت الصلاة
        const response = await axios.get(url);

        if (!response || response.status !== 200) {
            throw new Error('Failed to fetch prayer schedule / فشل في الحصول على مواقيت الصلاة.');
        }

        const { subuh, dzuhur, ashar, maghrib, isya } = response.data.data.jadwal;

        const sahur = kurangiMenit(subuh, 60); // Sahur time 1 hour before Subuh / وقت السحور قبل ساعة من الفجر

        // Create local schedule object / إنشاء كائن جدول محلي
        const jadwalLokal = { subuh, dzuhur, ashar, maghrib, isya };

        // Store in cache / تخزين في الذاكرة المؤقتة
        cachedJadwalSholat = Object.fromEntries(
            Object.entries(jadwalLokal).map(([key, value]) => [key, value])
        );
        return cachedJadwalSholat;
    } catch (error) {
        console.error('Error in getJadwalSholat:', error.message);
        throw new Error('Failed to get prayer times / فشل في الحصول على مواقيت الصلاة');
    }
}

/**
 * 🔊 Convert text to audio using Google Translate TTS
 * تحويل النص إلى صوت باستخدام Google Translate TTS
 * 
 * @param {string} text - Input text / النص المطلوب تحويله
 * @returns {Buffer} Audio data / بيانات الصوت
 */
async function textToAudio(text) {
    try {
        // Validate input / التحقق من صحة النص
        if (!text || typeof text !== 'string') {
            throw new Error('Text must be a valid string / النص يجب أن يكون نصًا صحيحًا.');
        }

        // Truncate text to max 190 characters / قص النص ليصبح 190 حرفًا كحد أقصى
        const maxLength = 190;
        const truncatedText = text.slice(0, maxLength).trim();
        
        // Google Translate TTS URL / رابط خدمة Google Translate TTS
        const url = `https://translate.google.com/translate_tts?ie=UTF-8&q=${truncatedText}&tl=id&client=tw-ob`;

        // Fetch audio data from URL / جلب بيانات الصوت من الرابط
        const response = await axios({
            method: 'get',
            url: url,
            responseType: 'arraybuffer',
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            },
        });

        if (!response || response.status !== 200) {
            throw new Error('Failed to get audio from Google Translate TTS / فشل في الحصول على الصوت من Google TTS.');
        }

        return Buffer.from(response.data);
    } catch (error) {
        console.error('Error in textToAudio:', error.message);
        throw new Error('Failed to convert text to audio / فشل في تحويل النص إلى صوت.');
    }
}

// Export functions / تصدير الدوال لاستخدامها في ملفات أخرى
module.exports = { textToAudio, getJadwalSholat };