const mess = require('@mess'); // Message templates / قوالب الرسائل
const { logWithTime } = require('@lib/utils'); // Logging helper / مساعد تسجيل
const { addUser, removeUser, isUserPlaying } = require("@tmpDB/tebak angka"); // Temporary game DB / قاعدة بيانات مؤقتة للعبة

const WAKTU_GAMES = 60; // 60 seconds / 60 ثانية

// ===== MAIN HANDLE FUNCTION / الدالة الرئيسية =====
async function handle(sock, messageInfo) {
    const { remoteJid, message, content, fullText } = messageInfo;

    let level_tebakangka = ""; // Chosen level / المستوى المختار
    
    // Skip if command does not contain 'angka' / تخطي إذا لم يحتوي الأمر على 'angka'
    if (!fullText.includes("angka")) return true;

    const validLevels = ["easy", "normal", "hard", "expert", "setan"]; // Valid difficulty levels / مستويات الصعوبة
    const args = content.split(" ");
    const KATA_TERAKHIR = args[args.length - 1]; // Last word / الكلمة الأخيرة

    // Validate level / التحقق من صحة المستوى
    if (validLevels.includes(KATA_TERAKHIR)) {
        level_tebakangka = KATA_TERAKHIR;
    } else {
        return await sock.sendMessage(
            remoteJid,
            {
                text: `Enter a level / اختر مستوى اللعبة\n\nExample: *tebak angka easy* / مثال: *tebak angka easy*\n\n*Options / الخيارات*\neasy\nnormal\nhard\nexpert\nsetan`,
            },
            { quoted: message }
        );
    }

    // Map levels to max number / تحويل المستويات إلى أعلى رقم ممكن
    const levelMap = {
        easy: 10,
        normal: 100,
        hard: 1000,
        expert: 10000,
        setan: 10000000000,
    };

    const akhir_angkaAcak = levelMap[level_tebakangka]; // Maximum number / الرقم الأقصى
    const angkaAcak = Math.floor(Math.random() * akhir_angkaAcak) + 1; // Random number / الرقم العشوائي

    // Check if user is already playing / التحقق مما إذا كان المستخدم يلعب بالفعل
    if (isUserPlaying(remoteJid)) {
        return await sock.sendMessage(remoteJid, { text: mess.game.isPlaying }, { quoted: message });
    }

    // Create timer for user / إنشاء مؤقت للمستخدم
    const timer = setTimeout(async () => {
        if (!isUserPlaying(remoteJid)) return;

        removeUser(remoteJid); // Remove user from DB if time's up / حذف المستخدم من قاعدة البيانات عند انتهاء الوقت

        if (mess.game_handler.waktu_habis) {
            const messageWarning = mess.game_handler.waktu_habis.replace('@answer', angkaAcak);
            await sock.sendMessage(remoteJid, { text: messageWarning }, { quoted: message });
        }
    }, WAKTU_GAMES * 1000);

    // Add user to temporary DB / إضافة المستخدم للقاعدة المؤقتة
    addUser(remoteJid, {
        angkaAcak, // Random number / الرقم العشوائي
        level: level_tebakangka, // Level / المستوى
        angkaEnd: akhir_angkaAcak, // Max number / الرقم الأقصى
        attempts: 6, // Number of attempts / عدد المحاولات
        hadiah: 10, // Reward money if correct / الجائزة إذا نجح
        command: fullText, // Original command / الأمر الأصلي
        timer: timer, // Timer / المؤقت
    });

    // Send initial message / إرسال رسالة البداية
    await sock.sendMessage(
        remoteJid,
        {
            text: `Game started! Guess a number from 1 to ${akhir_angkaAcak} for level *${level_tebakangka}*.\nYou have ${WAKTU_GAMES}s / اللعبة بدأت! خمن رقماً من 1 إلى ${akhir_angkaAcak} للمستوى *${level_tebakangka}*.\nلديك ${WAKTU_GAMES} ثانية`,
        },
        { quoted: message }
    );

    // Log answer in console / تسجيل الإجابة في الكونسول
    logWithTime('Tebak Angka / تخمين الرقم', `Answer / الإجابة: ${angkaAcak}`);
}

// ===== EXPORT MODULE / تصدير الموديول =====
module.exports = {
    handle,
    Commands: ["tebak", "tebakangka"], // Commands / الأوامر
    OnlyPremium: false,
    OnlyOwner: false,
};