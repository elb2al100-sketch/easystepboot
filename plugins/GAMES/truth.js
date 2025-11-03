const { readFileAsBuffer } = require('@lib/fileHelper'); // Helper to read files as buffer / وظيفة لقراءة الملفات كبافر

// ===== Read image file as buffer / قراءة صورة اللعبة كبافر =====
const buffer = readFileAsBuffer('@assets/game truth dare.jpg');

// ===== List of truth questions / قائمة أسئلة الـ Truth =====
const truths = [
    'Pernah suka sama siapa aja? Berapa lama?', // Ever liked someone? How long? / هل أعجبت بشخص ما؟ منذ متى؟
    'Kalau boleh atau kalau mau, di grup/luar grup siapa yang akan kamu jadikan sahabat? (boleh beda/jenis sama)',
    'Apa ketakutan terbesar kamu?', // Biggest fear? / أكبر مخاوفك؟
    'Pernah suka sama orang dan merasa orang itu suka sama kamu juga?',
    'Siapa nama mantan pacar temanmu yang pernah kamu sukai diam-diam?',
    'Pernah nggak nyuri uang nyokap atau bokap? Alasannya?',
    'Hal yang bikin senang pas kamu lagi sedih apa?',
    'Pernah cinta bertepuk sebelah tangan? Kalau pernah, sama siapa? Rasanya gimana?',
    'Pernah jadi selingkuhan orang?',
    'Hal yang paling ditakuti?', // Most feared thing / أكثر شيء تخاف منه؟
    'Siapa orang yang paling berpengaruh pada kehidupanmu?', // Most influential person / الشخص الأكثر تأثيرًا في حياتك
    'Hal membanggakan apa yang kamu dapatkan di tahun ini?', // Proud achievement this year / إنجاز تفخر به هذا العام
    'Siapa orang yang bisa membuatmu sange?',
    'Siapa orang yang pernah buatmu sange?',
    '(Bagi yang muslim) pernah nggak salat seharian?',
    'Siapa yang paling mendekati tipe pasangan idealmu di sini?',
    'Suka mabar (main bareng) sama siapa?',
    'Pernah nolak orang? Alasannya kenapa?',
    'Sebutkan kejadian yang bikin kamu sakit hati yang masih diingat!',
    'Pencapaian yang sudah didapat apa aja di tahun ini?',
    'Kebiasaan terburukmu pas di sekolah apa?' // Worst habit in school / أسوأ عادة أثناء المدرسة
];

// ===== Function to handle the command / دالة لمعالجة الأمر =====
async function handle(sock, messageInfo) {
    const { remoteJid, message } = messageInfo;

    // Pick a random truth question / اختر سؤال Truth عشوائي
    const selectedTruth = truths[Math.floor(Math.random() * truths.length)];

    // Send message with image and caption / إرسال الصورة مع السؤال
    await sock.sendMessage(
        remoteJid,
        {
            image: buffer,
            caption: `*Truth*\n\n${selectedTruth}`,
        },
        { quoted: message }
    );
}

module.exports = {
    handle,
    Commands: ["truth"], // Command name / اسم الأمر
    OnlyPremium: false,
    OnlyOwner: false,
};