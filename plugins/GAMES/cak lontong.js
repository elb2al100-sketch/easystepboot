// ===========================
// CAK LONTONG GAME MODULE
// ===========================

// ===== IMPORTS / الاستيراد =====
const ApiAutoresbot    = require("api-autoresbot"); // API client / مكتبة التعامل مع API
const { logWithTime }  = require('@lib/utils');    // Logging helper / لتسجيل الأحداث مع الوقت
const config           = require("@config");       // Config file / ملف الإعدادات
const mess             = require("@mess");         // Predefined messages / رسائل جاهزة

const { addUser, removeUser, getUser, isUserPlaying } = require("@tmpDB/cak lontong"); 
// Manage game session / إدارة جلسات اللعبة

// ===== CONSTANTS / الثوابت =====
const WAKTU_GAMES   = 60; // 60 detik / 60 ثانية
const api = new ApiAutoresbot(config.APIKEY);

// ===== SEND MESSAGE FUNCTION / دالة إرسال الرسائل =====
/**
 * Send message to user / إرسال رسالة إلى المستخدم
 * @param {Object} sock - Connection instance / كائن الاتصال
 * @param {string} remoteJid - User ID / معرف المستخدم
 * @param {Object} content - Message content / محتوى الرسالة
 * @param {Object} options - Additional options / خيارات إضافية
 */
const sendMessage = async (sock, remoteJid, content, options = {}) => {
    try {
        await sock.sendMessage(remoteJid, content, options);
    } catch (error) {
        console.error(`Gagal mengirim pesan ke ${remoteJid}: / فشل إرسال الرسالة إلى ${remoteJid}`, error);
    }
};

// ===== HANDLE GAME / دالة إدارة اللعبة =====
/**
 * Handle Cak Lontong game / إدارة لعبة Cak Lontong
 * @param {Object} sock - Connection instance / كائن الاتصال
 * @param {Object} messageInfo - Message information / معلومات الرسالة
 */
const handle = async (sock, messageInfo) => {
    const { remoteJid, message, fullText } = messageInfo;

    // ===== CHECK MESSAGE CONTENT / تحقق من محتوى الرسالة =====
    if (!fullText.includes("lontong")) return true;

    // ===== CHECK IF USER IS ALREADY PLAYING / تحقق إن كان المستخدم يلعب بالفعل =====
    if (isUserPlaying(remoteJid)) {
        await sendMessage(sock, remoteJid, { text: mess.game.isPlaying }, { quoted: message });
        return;
    }

    try {
        // ===== GET QUESTION FROM API / الحصول على سؤال من API =====
        const response = await api.get("/api/game/caklontong");
        const { soal, jawaban, deskripsi } = response.data; 
        // soal = question / السؤال
        // jawaban = answer / الإجابة
        // deskripsi = description / الوصف

        // ===== TIMER 60s / مؤقت 60 ثانية =====
        const timer = setTimeout(async () => {
            if (isUserPlaying(remoteJid)) {
                removeUser(remoteJid);
                await sendMessage(
                    sock,
                    remoteJid,
                    {
                        text: `Waktu Habis / انتهى الوقت\nJawaban / الإجابة: ${jawaban}\nDeskripsi / الوصف: ${deskripsi}\n\nIngin bermain? Ketik .cak lontong / تريد اللعب مرة أخرى؟ اكتب .cak lontong`,
                    },
                    { quoted: message }
                );
            }
        }, WAKTU_GAMES * 1000);

        // ===== ADD USER TO GAME DATABASE / إضافة المستخدم لقاعدة بيانات اللعبة =====
        addUser(remoteJid, {
            answer: jawaban.toLowerCase(), // correct answer / الإجابة الصحيحة
            hadiah: 10,                    // reward points / نقاط الجائزة
            deskripsi,
            command : fullText,            // original command / الأمر الأصلي
            timer: timer
        });

        // ===== SEND QUESTION TO USER / إرسال السؤال للمستخدم =====
        await sendMessage(
            sock,
            remoteJid,
            { text: `*Jawablah Pertanyaan Berikut / أجب على السؤال التالي:*\n${soal}\n*Waktu : 60s / الوقت: 60 ثانية*` },
            { quoted: message }
        );

        // ===== LOG ANSWER / تسجيل الإجابة =====
        logWithTime('Caklontong', `Jawaban / الإجابة: ${jawaban}`);

    } catch (error) {
        // ===== ERROR HANDLING / التعامل مع الأخطاء =====
        const errorMessage = `Maaf, terjadi kesalahan saat memproses permintaan Anda. / عذرًا، حدث خطأ أثناء معالجة طلبك.\nMohon coba lagi nanti / يرجى المحاولة لاحقًا.\n\n${error || "Kesalahan tidak diketahui / خطأ غير معروف"}`;
        await sendMessage(sock, remoteJid, { text: errorMessage }, { quoted: message });
    }
};

// ===== EXPORT MODULE / تصدير الموديول =====
module.exports = {
    handle,
    Commands    : ["cak", "caklontong"], // Commands / الأوامر
    OnlyPremium : false,                  // Available to all users / متاح للجميع
    OnlyOwner   : false
};