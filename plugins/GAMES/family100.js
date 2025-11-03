// ===========================
// FAMILY100 GAME MODULE
// ===========================

// ===== IMPORTS / الاستيراد =====
const ApiAutoresbot = require('api-autoresbot'); // API client / مكتبة التعامل مع API
const config        = require("@config");        // Config file / ملف الإعدادات
const mess          = require('@mess');          // Predefined messages / رسائل جاهزة
const { logWithTime }  = require('@lib/utils');  // Logging utility / لتسجيل الأحداث مع الوقت
const { addUser, isUserPlaying } = require("@tmpDB/family100"); 
// Game session management / إدارة جلسات لعبة Family100

const api = new ApiAutoresbot(config.APIKEY); // Initialize API client / تهيئة API

// ===== HANDLE FUNCTION / دالة إدارة اللعبة =====
/**
 * Handle Family100 game command / إدارة أمر لعبة Family100
 * @param {Object} sock - Connection instance / كائن الاتصال
 * @param {Object} messageInfo - Message information / معلومات الرسالة
 */
async function handle(sock, messageInfo) {
    const { remoteJid, message } = messageInfo;

    try {
        // ===== CHECK IF USER IS ALREADY PLAYING / تحقق إن كان المستخدم يلعب بالفعل =====
        if (isUserPlaying(remoteJid)) {
            await sock.sendMessage(
                remoteJid,
                { text: mess.game.isPlaying }, // Message: user is already playing / رسالة: المستخدم يلعب حاليًا
                { quoted: message }
            );
            return;
        }

        // ===== GET GAME DATA FROM API / الحصول على بيانات اللعبة من API =====
        const response = await api.get(`/api/game/family100`);
        const gameData = response?.data;

        if (!gameData) {
            throw new Error('Failed to fetch game data / فشل جلب بيانات اللعبة');
        }

        const { soal, jawaban } = gameData; // soal = question / السؤال, jawaban = answers / الإجابات
        console.log(jawaban);

        logWithTime('Family100', `Jawaban / الإجابات: ${jawaban}`);

        // ===== ADD USER TO GAME DATABASE / إضافة المستخدم لقاعدة بيانات اللعبة =====
        addUser(remoteJid, {
            soal, // Question / السؤال
            answer: jawaban, // Correct answers / الإجابات الصحيحة
            terjawab: Array(jawaban.length).fill(false), 
            // Array to track which answers have been guessed / مصفوفة لتتبع الإجابات التي تم تخمينها
            hadiahPerJawabanBenar: 1, // Reward per correct answer / الجائزة لكل إجابة صحيحة
            hadiahJikaMenang: 20,      // Reward if all answers guessed / الجائزة إذا تم تخمين جميع الإجابات
        });

        // ===== FORMAT MESSAGE / تنسيق الرسالة =====
        const hasSpacedAnswer = jawaban.some(answer => answer.includes(' '));
        const messageText = `*Answer the following question / أجب على السؤال التالي:*\n${soal}\n\nThere are *${jawaban.length}* answers${hasSpacedAnswer ? ' (some answers contain spaces / بعض الإجابات تحتوي على مسافات)' : ''}.`;

        // ===== SEND QUESTION TO USER / إرسال السؤال للمستخدم =====
        await sock.sendMessage(
            remoteJid,
            { text: messageText },
            { quoted: message }
        );
    } catch (error) {
        // ===== ERROR HANDLING / التعامل مع الأخطاء =====
        const errorMessage = `Sorry, an error occurred while processing your request. / عذرًا، حدث خطأ أثناء معالجة طلبك.\nPlease try again later / يرجى المحاولة لاحقًا.\n\n${error || "Unknown error / خطأ غير معروف"}`;
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
    Commands: ["family100"], // Commands / الأوامر
    OnlyPremium: false,       // Available to all users / متاح لجميع المستخدمين
    OnlyOwner: false
};