// ===========================
// MATH QUIZ MODULE
// ===========================

// ===== IMPORTS / الاستيراد =====
const mess = require('@mess'); 
// Predefined messages / رسائل جاهزة

const { addUser, removeUser, isUserPlaying } = require("@tmpDB/math"); 
// Manage Math quiz sessions / إدارة جلسات لعبة الرياضيات

let { genMath, modes } = require("@games/math"); 
// Generate math problems / توليد مسائل رياضية, modes = available difficulties / المستويات المتاحة

const { logWithTime }  = require('@lib/utils'); 
// Logging utility / لتسجيل الأحداث مع الوقت

// ===== HANDLE FUNCTION / دالة إدارة اللعبة =====
/**
 * Handle Math quiz command / إدارة أمر لعبة الرياضيات
 * @param {Object} sock - Connection instance / كائن الاتصال
 * @param {Object} messageInfo - Message information / معلومات الرسالة
 */
async function handle(sock, messageInfo) {
    const { remoteJid, message, fullText, content } = messageInfo;

    // ===== CHECK IF USER IS ALREADY PLAYING / تحقق إن كان المستخدم يلعب بالفعل =====
    const isPlaying = isUserPlaying(remoteJid);
    if (isPlaying) {
        return sock.sendMessage(
            remoteJid,
            { text: mess.game.isPlaying }, // Message: user is already playing / رسالة: المستخدم يلعب حاليًا
            { quoted: message }
        );
    }

    // ===== CHECK IF MODE PROVIDED / تحقق من إدخال الوضع =====
    if (!content || content.trim() === "") {
        return sock.sendMessage(
            remoteJid,
            { text: `Example usage: *math medium* / مثال على الاستخدام: *math medium*\n\nAvailable modes / المستويات المتاحة: ${Object.keys(modes).join(' | ')}` },
            { quoted: message }
        );
    }

    const mode = content.trim().toLowerCase();
    if (!modes[mode]) {
        return sock.sendMessage(
            remoteJid,
            { text: `Invalid mode! / وضع غير صالح!\n\nAvailable modes / المستويات المتاحة: ${Object.keys(modes).join(' | ')}` },
            { quoted: message }
        );
    }

    // ===== GENERATE MATH PROBLEM / توليد المسألة الرياضية =====
    let result;
    try {
        result = await genMath(mode);
    } catch (err) {
        return sock.sendMessage(
            remoteJid,
            { text: "An error occurred while starting the game. / حدث خطأ أثناء بدء اللعبة. Please try again later / يرجى المحاولة لاحقًا." },
            { quoted: message }
        );
    }

    // ===== SET TIMER / ضبط المؤقت =====
    const timer = setTimeout(async () => {
        if (isUserPlaying(remoteJid)) {
            removeUser(remoteJid); // Remove user if time runs out / إزالة المستخدم إذا انتهى الوقت
            await sock.sendMessage(
                remoteJid,
                { text: `Time's up! / انتهى الوقت! The answer is / الإجابة: ${result.jawaban}` },
                { quoted: message }
            );
        }
    }, result.waktu); // Use time from result / استخدم الوقت المحدد في المسألة

    result.timer = timer;
    result.command = fullText;

    // ===== ADD USER TO GAME / إضافة المستخدم للعبة =====
    addUser(remoteJid, result);

    // ===== SEND QUESTION / إرسال السؤال =====
    const waktuDetik = (result.waktu / 1000).toFixed(2); // Convert milliseconds to seconds / تحويل المللي ثانية إلى ثوانٍ
    await sock.sendMessage(
        remoteJid,
        { text: `*What is the result of / ما نتيجة: ${result.soal.toLowerCase()}*?\n\nTime / الوقت: ${waktuDetik} seconds / ثواني` },
        { quoted: message }
    );

    console.log(`Jawaban / الإجابة : ${result.jawaban}`);
    logWithTime('Math', `Jawaban / الإجابة : ${result.jawaban}`);
}

// ===== EXPORT MODULE / تصدير الموديول =====
module.exports = {
    handle,
    Commands: ["kuismath", "math"], // Commands / الأوامر
    OnlyPremium: false,               // Available to all users / متاح لجميع المستخدمين
    OnlyOwner: false
};