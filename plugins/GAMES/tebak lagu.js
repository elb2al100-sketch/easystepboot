const ApiAutoresbot = require('api-autoresbot'); // API helper / مساعد API
const config        = require("@config");       // Configuration / الإعدادات
const api           = new ApiAutoresbot(config.APIKEY);
const mess          = require('@mess');         // Message templates / قوالب الرسائل
const { logWithTime }  = require('@lib/utils'); // Logging helper / مساعد تسجيل

const WAKTU_GAMES   = 60; // 60 seconds / 60 ثانية

const { addUser, removeUser, isUserPlaying } = require("@tmpDB/tebak lagu"); // Temporary DB / قاعدة بيانات مؤقتة

// ===== MAIN HANDLE FUNCTION / الدالة الرئيسية =====
async function handle(sock, messageInfo) {
    const { remoteJid, message, fullText } = messageInfo;

    // Skip if message does not contain 'lagu' / تخطي إذا لم تحتوي الرسالة على 'lagu'
    if (!fullText.includes("lagu")) {
        return true;
    }

    try {
        // Call API to get song / استدعاء API للحصول على الأغنية
        const response = await api.get(`/api/game/tebaklagu`);

        const UrlData = response.data.link_song;   // Song URL / رابط الأغنية
        const answer  = response.data.jawaban;     // Correct answer / الإجابة الصحيحة
        const artist  = response.data.artist;      // Artist name / اسم الفنان

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
                const messageWarning = mess.game_handler.waktu_habis.replace('@answer', answer);
                await sock.sendMessage(remoteJid, { text: messageWarning }, { quoted: message });
            }
        }, WAKTU_GAMES * 1000);

        // Add user to temporary DB / إضافة المستخدم للقاعدة المؤقتة
        addUser(remoteJid, {
            answer: answer.toLowerCase(), // Save correct answer / حفظ الإجابة الصحيحة
            hadiah  : 10,                 // Reward money if win / الجائزة عند الفوز
            command : fullText,           // Original command / الأمر الأصلي
            timer: timer                  // Timer / المؤقت
        });

        // Send song audio to user / إرسال رابط الأغنية للمستخدم
        await sock.sendMessage(remoteJid, { audio: { url: UrlData }, mimetype: 'audio/mp4' }, { quoted: message });

        // Send question with artist info / إرسال السؤال مع معلومات الفنان
        await sock.sendMessage(
            remoteJid,
            { text: `Which song is this? / ما هي هذه الأغنية؟\n\nArtist / الفنان : ${artist}\nTime / الوقت : ${WAKTU_GAMES}s` },
            { quoted: message }
        );

        // Log the correct answer / تسجيل الإجابة الصحيحة
        logWithTime('Tebak Lagu / تخمين الأغنية', `Answer / الإجابة : ${answer}`);

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
    Commands: ["tebak", "tebaklagu"], // Commands / الأوامر
    OnlyPremium: false,
    OnlyOwner: false,
};