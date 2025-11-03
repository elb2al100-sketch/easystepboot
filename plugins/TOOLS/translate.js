const { reply }     = require("@lib/utils");
const ApiAutoresbot = require("api-autoresbot");
const config        = require("@config");
const { logCustom } = require("@lib/logger");

async function handle(sock, messageInfo) {
    const { m, remoteJid, message, content, prefix, command } = messageInfo;

    // Validasi input: pastikan ada teks untuk diterjemahkan
    // Input validation: make sure there is text to translate
    // التحقق من الإدخال: تأكد من وجود نص للترجمة
    if (!content) {
        await reply(m, `_⚠️ Usage Format:_ \n\n_💬 Example:_ _*${prefix + command} I am from Indonesia*_ \n_⚠️ صيغة الاستخدام:_ \n_💬 مثال:_ _*${prefix + command} أنا من إندونيسيا*_`);
        return;
    }

    try {
        // Kirim reaksi "Processing"
        // Send "Processing" reaction
        // إرسال رمز تعبيري "جارٍ المعالجة"
        await sock.sendMessage(remoteJid, { react: { text: "🤌🏻", key: message.key } });

        // Inisialisasi API
        // Initialize API
        // تهيئة API
        const api = new ApiAutoresbot(config.APIKEY);

        // Jalankan dua permintaan API secara paralel untuk terjemahan dua arah
        // Run two API requests in parallel for two-way translation
        // تشغيل طلبين API بشكل متوازي للترجمة ذهاباً وإياباً
        const [data1, data2] = await Promise.all([
            api.get('/api/translate/en-id', { text: content }), // English → Indonesian / الإنجليزية → الإندونيسية
            api.get('/api/translate/id-en', { text: content })  // Indonesian → English / الإندونيسية → الإنجليزية
        ]);

        // Kirim hasil terjemahan
        // Send translation result
        // إرسال نتيجة الترجمة
        await reply(m, `◧ Indonesia / الإندونيسية: ${data1.data}\n\n◧ English / الإنجليزية: ${data2.data}`);

    } catch (error) {
        console.error("Error in translation handler:", error);
        logCustom('info', content, `ERROR-COMMAND-${command}.txt`);

        // Kirim pesan kesalahan jika terjadi error
        // Send error message if an error occurs
        // إرسال رسالة خطأ في حالة حدوث خطأ
        await sock.sendMessage(
            remoteJid,
            { text: "⚠️ Sorry, an error occurred. Please try again later! / عذراً، حدث خطأ. حاول مرة أخرى لاحقاً!" },
            { quoted: message }
        );
    }
}

module.exports = {
    handle,
    Commands    : ["ts", "translate"], // Perintah untuk menerjemahkan teks / Command to translate text / أمر لترجمة النص
    OnlyPremium : false,                // Tersedia untuk semua pengguna / Available to all users / متاح لجميع المستخدمين
    OnlyOwner   : false,
    limitDeduction  : 1,                // Jumlah limit yang akan dikurangi / Number of usage limits to deduct / عدد الحدود التي سيتم خصمها
};