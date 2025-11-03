const ApiAutoresbot = require('api-autoresbot'); // API helper / مساعد API
const config        = require("@config");       // Configuration / الإعدادات
const api           = new ApiAutoresbot(config.APIKEY);
const mess          = require('@mess');         // Message templates / قوالب الرسائل
const { logWithTime }  = require('@lib/utils'); // Logging helper / مساعد تسجيل

const WAKTU_GAMES   = 60; // 60 seconds / 60 ثانية

const { addUser, removeUser, isUserPlaying } = require("@tmpDB/tebak kalimat"); // Temporary DB / قاعدة بيانات مؤقتة

// ===== MAIN HANDLE FUNCTION / الدالة الرئيسية =====
async function handle(sock, messageInfo) {
    const { remoteJid, message, fullText } = messageInfo;

    // Skip if message does not contain 'kalimat' / تخطي إذا لم تحتوي الرسالة على 'kalimat'
    if (!fullText.includes("kalimat")) {
        return true;
    }

    try {
        // Call API for guessing sentence / استدعاء API للحصول على سؤال الجملة
        const response = await api.get(`/api/game/tebakkalimat`);

        const soal      = response.data.soal;     // Question / السؤال
        const jawaban   = response.data.jawaban;  // Correct answer / الإجابة الصحيحة
    
        // Check if user is already playing / التحقق مما إذا كان المستخدم يلعب بالفعل
        if (isUserPlaying(remoteJid)) {
            return await sock.sendMessage(
                remoteJid,
                { text: mess.game.isPlaying },
                { quoted: message }
            );
        }

        // Create a timer for the user / إنشاء مؤقت للمستخدم
        const timer = setTimeout(async () => {
            if (!isUserPlaying(remoteJid)) return;

            removeUser(remoteJid); // Remove user from DB if time is up / إزالة المستخدم إذا انتهى الوقت

            if (mess.game_handler.waktu_habis) {
                const messageWarning = mess.game_handler.waktu_habis.replace('@answer', jawaban);
                await sock.sendMessage(remoteJid, { text: messageWarning }, { quoted: message });
            }
        }, WAKTU_GAMES * 1000);
    
        // Add user to temporary DB / إضافة المستخدم للقاعدة المؤقتة
        addUser(remoteJid, {
            answer: jawaban.toLowerCase(), // Save correct answer / حفظ الإجابة الصحيحة
            hadiah  : 10,                 // Reward money if win / الجائزة عند الفوز
            command : fullText,           // Original command / الأمر الأصلي
            timer: timer                  // Timer / المؤقت
        });
    
        // Send the question to the user / إرسال السؤال للمستخدم
        await sock.sendMessage(
            remoteJid,
            { text: `Please answer the following question / الرجاء الإجابة على السؤال التالي\n\n${soal}\nTime / الوقت : ${WAKTU_GAMES}s` },
            { quoted: message }
        );

        // Log the correct answer / تسجيل الإجابة الصحيحة
        logWithTime('Tebak Kalimat / تخمين الجملة', `Answer / الإجابة : ${jawaban}`);
    
    } catch(error){
        const errorMessage = `Sorry, there was an error processing your request / عذراً، حدث خطأ أثناء معالجة طلبك.\n\n${error || "Unknown error / خطأ غير معروف"}`;
        await sock.sendMessage(
            remoteJid,
            { text: errorMessage },
            { quoted: message }
        );
    }
}

// ===== EXPORT MODULE / تصدير الموديول =====
module.exports = {
    handle,
    Commands: ["tebak", "tebakkalimat"], // Commands / الأوامر
    OnlyPremium: false,
    OnlyOwner: false,
};