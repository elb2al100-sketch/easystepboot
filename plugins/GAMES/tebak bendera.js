const ApiAutoresbot = require('api-autoresbot'); // API client / عميل API
const config        = require("@config");        // Configurations / إعدادات
const api           = new ApiAutoresbot(config.APIKEY); // Initialize API / تهيئة API
const mess          = require('@mess');         // Message templates / قوالب الرسائل
const { logWithTime }  = require('@lib/utils'); // Logging helper / مساعد تسجيل

const WAKTU_GAMES   = 60; // 60 seconds / 60 ثانية

const { addUser, removeUser, isUserPlaying } = require("@tmpDB/tebak bendera"); // Temporary game DB / قاعدة بيانات مؤقتة للعبة

// ===== MAIN HANDLE FUNCTION / الدالة الرئيسية =====
async function handle(sock, messageInfo) {
    const { remoteJid, message, fullText } = messageInfo;

    // Skip if command does not contain 'bendera' / تخطي إذا لم يحتوي الأمر على 'bendera'
    if (!fullText.includes("bendera")) return true;

    try {
        // Get flag data from API / الحصول على بيانات العلم من API
        const response = await api.get(`/api/game/bendera`);

        const UrlData = response.data.url_download; // Flag image URL / رابط صورة العلم
        const answer = response.data.name;          // Country name / اسم الدولة
    
        // Check if user is already playing / التحقق مما إذا كان المستخدم يلعب بالفعل
        if (isUserPlaying(remoteJid)) {
            return await sock.sendMessage(
                remoteJid,
                { text: mess.game.isPlaying },
                { quoted: message }
            );
        }

        // Set 60-second timer / تعيين مؤقت 60 ثانية
        const timer = setTimeout(async () => {
            if (!isUserPlaying(remoteJid)) return;

            removeUser(remoteJid); // Remove user from DB if time's up / حذف المستخدم من قاعدة البيانات عند انتهاء الوقت

            if (mess.game_handler.waktu_habis) {
                const messageWarning = mess.game_handler.waktu_habis.replace('@answer', answer);
                await sock.sendMessage(remoteJid, { text: messageWarning }, { quoted: message });
            }
        }, WAKTU_GAMES * 1000);
    
        // Add user to temporary DB / إضافة المستخدم للقاعدة المؤقتة
        addUser(remoteJid, {
            answer: answer.toLowerCase(), // Expected answer / الإجابة المتوقعة
            hadiah: 10,                    // Reward money if correct / الجائزة إذا نجح
            command: fullText,             // Original command / الأمر الأصلي
            timer: timer,                  // Timer / المؤقت
        });

        // Send flag image with instructions / إرسال صورة العلم مع التعليمات
        await sock.sendMessage(
            remoteJid,
            { 
                image: { url: UrlData }, 
                caption: `Guess the country of the flag above / سمي الدولة الموجودة في العلم أعلاه\n\nTime / الوقت: ${WAKTU_GAMES}s` 
            },
            { quoted: message }
        );
    
        // Log answer in console / تسجيل الإجابة في الكونسول
        logWithTime('Tebak Bendera / تخمين العلم', `Answer / الإجابة: ${answer}`);

    } catch(error) {
        const errorMessage = `Sorry, an error occurred while processing your request. Please try again later.\n\n${error || "Unknown error"} / عذراً، حدث خطأ أثناء معالجة طلبك. حاول مرة أخرى لاحقاً.\n\n${error || "خطأ غير معروف"}`;
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
    Commands: ["tebak", "tebakbendera"], // Commands / الأوامر
    OnlyPremium: false,
    OnlyOwner: false,
};