const { forceConvertToM4a } = require('@lib/utils');

// Handle Surah audio command / معالجة أمر إرسال صوت السورة
async function handle(sock, messageInfo) {
    const { remoteJid, message, content, prefix, command } = messageInfo;

    // Show usage guide if content is empty / عرض دليل الاستخدام إذا لم يتم إدخال أي محتوى
    if (!content) {
        return await sock.sendMessage(
            remoteJid,
            { text: `_⚠️ Usage Format / صيغة الاستخدام:_ \n\n_💬 Example / مثال:_ _*${prefix + command} 1*_` },
            { quoted: message }
        );
    }

    // List of Surah names / قائمة أسماء السور
    const surahData = [
        "Al-Fatihah", "Al-Baqarah", "Ali Imran", "An Nisa", "Al-Ma'idah",
        "Al-An'am", "Al-A'raf", "Al-Anfal", "At-Taubah", "Yunus", 
        "Hud", "Yusuf", "Ar-Ra'd", "Ibrahim", "Al-Hijr", "An-Nahl", 
        "Al-Isra", "Al-Kahf", "Maryam", "Ta Ha", "Al-Anbiya", "Al-Hajj", 
        "Al-Mu'minun", "An-Nur", "Al-Furqan", "Ash-Shu'ara", "An-Naml", 
        "Al-Qasas", "Al-'Ankabut", "Ar-Rum", "Luqman", "As-Sajda", "Al-Ahzab", 
        "Saba", "Fatir", "Ya Sin", "As-Saffat", "Sad", "Az-Zumar", "Ghafir", 
        "Fussilat", "Ash-Shura", "Az-Zukhruf", "Ad-Dukhan", "Al-Jathiya", 
        "Al-Ahqaf", "Muhammad", "Al-Fath", "Al-Hujurat", "Qaf", "Adh-Dhariyat", 
        "At-Tur", "An-Najm", "Al-Qamar", "Ar-Rahman", "Al-Waqi'a", "Al-Hadid", 
        "Al-Mujadila", "Al-Hashr", "Al-Mumtahina", "As-Saff", "Al-Jumu'a", 
        "Al-Munafiqun", "At-Taghabun", "At-Talaq", "At-Tahrim", "Al-Mulk", 
        "Al-Qalam", "Al-Haaqqa", "Al-Ma'arij", "Nuh", "Al-Jinn", "Al-Muzzammil", 
        "Al-Muddathir", "Al-Qiyama", "Al-Insan", "Al-Mursalat", "An-Naba", 
        "An-Nazi'at", "Abasa", "At-Takwir", "Al-Infitar", "Al-Mutaffifin", 
        "Al-Inshiqaq", "Al-Buruj", "At-Tariq", "Al-Ala", "Al-Ghashiya", "Al-Fajr", 
        "Al-Balad", "Ash-Shams", "Al-Lail", "Adh-Dhuha", "Ash-Sharh", "At-Tin", 
        "Al-Alaq", "Al-Qadr", "Al-Bayyina", "Az-Zalzala", "Al-Adiyat", "Al-Qaria", 
        "At-Takathur", "Al-Asr", "Al-Humazah", "Al-Fil", "Quraish", "Al-Ma'un", 
        "Al-Kawthar", "Al-Kafirun", "An-Nasr", "Al-Masad", "Al-Ikhlas", "Al-Falaq", 
        "An-Nas"
    ];

    // Find surah number based on input / البحث عن رقم السورة بناءً على الإدخال
    const surahName = content.trim().toLowerCase();
    const surahIndex = surahData.findIndex(surah => surah.toLowerCase() === surahName);
    let surahNumber = content;

    if (surahIndex !== -1) {
        // If input is surah name / إذا كان الإدخال هو اسم السورة
        surahNumber = surahIndex + 1;
    } else if (isNaN(surahNumber) || surahNumber < 1 || surahNumber > 114) {
        // Validate if input is surah number / التحقق إذا كان الإدخال رقم سورة صحيح
        return await sock.sendMessage(
            remoteJid,
            { text: `⚠️ _Enter a surah number between 1 and 114 / أدخل رقم سورة بين 1 و 114_` },
            { quoted: message }
        );
    }

    surahNumber = surahNumber.toString().padStart(3, '0');

    // Send loading reaction / إرسال رد فعل التحميل
    await sock.sendMessage(remoteJid, { react: { text: "📿", key: message.key } });

    try {
        // Build audio URL / إنشاء رابط الصوت
        const audioUrl = `https://download.quranicaudio.com/quran/mishaari_raashid_al_3afaasee/${surahNumber}.mp3`;

        // Convert audio to M4A / تحويل الصوت إلى M4A
        const output = await forceConvertToM4a({ url: audioUrl });

        // Send audio to user / إرسال الصوت للمستخدم
        await sock.sendMessage(remoteJid, {
            audio: { url: output },
            fileName: `surah.m4a`,
            mimetype: 'audio/mp4'
        }, { quoted: message });

    } catch (e) {
        console.error('Error sending Surah audio / خطأ أثناء إرسال صوت السورة:', e);
        return await sock.sendMessage(remoteJid, { react: { text: "⛔", key: message.key } });
    }
}

// Export module / تصدير الوحدة
module.exports = {
    handle,
    Commands    : ['surah', 'suroh'], // Command triggers / أوامر التشغيل
    OnlyPremium : false,               // Not limited to premium users / غير مقتصر على المميزين
    OnlyOwner   : false                // Not limited to owner / غير مقتصر على المالك
};