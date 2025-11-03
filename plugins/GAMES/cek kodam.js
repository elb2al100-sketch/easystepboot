// ===========================
// KODAM VOICE MODULE
// ===========================

// ===== IMPORTS / الاستيراد =====
const fs = require('fs').promises; // File system promises / نظام الملفات مع وعود
const path = require('path');      // Path utilities / أدوات المسارات
const ApiAutoresbot = require('api-autoresbot'); // API client / مكتبة التعامل مع API
const config = require("@config");   // Config file / ملف الإعدادات

const api = new ApiAutoresbot(config.APIKEY); // Initialize API client / تهيئة API

const { textToAudio } = require('@lib/features'); 
// Convert text to audio / تحويل النص إلى صوت

const { convertAudioToCompatibleFormat, generateUniqueFilename } = require('@lib/utils'); 
// Utilities: convert audio format & generate unique filename / تحويل صيغة الصوت و توليد اسم ملف فريد

// ===== HANDLE FUNCTION / دالة التشغيل =====
async function handle(sock, messageInfo) {
    const { remoteJid, message, content, fullText, pushName } = messageInfo;

    // ===== CHECK COMMAND / تحقق من الأمر =====
    if (!fullText.includes("odam")) return true; // Ignore if not related / تجاهل إذا لم يكن مرتبطًا

    // ===== GET NAME / الحصول على الاسم =====
    const nameCekodam = content.trim() || pushName; // Use message content or user name / استخدم محتوى الرسالة أو اسم المستخدم

    try {
        // ===== REACT TO USER / إرسال رد فعل =====
        await sock.sendMessage(remoteJid, { react: { text: "💚", key: message.key } });

        // ===== CALL KODAM API / استدعاء API Kodam =====
        const response = await api.get(`/api/game/kodam`);
        if (!response?.data) {
            console.error("⚠️ API response is empty or invalid / استجابة API فارغة أو غير صالحة:", response);
            return false;
        }

        const kodam = response.data; // Get Kodam data / جلب بيانات Kodam
        const resultKodam = `Name: ${nameCekodam} | Kodam: ${kodam}`; 
        // Construct result text / تكوين النص النهائي

        // ===== CONVERT TEXT TO AUDIO / تحويل النص إلى صوت =====
        let bufferAudio = await textToAudio(resultKodam);
        if (!bufferAudio) {
            console.error("⚠️ Failed to generate audio from text / فشل توليد الصوت من النص.");
            return false;
        }

        // ===== SAVE TEMP FILE / حفظ الملف المؤقت =====
        const inputPath = path.join(process.cwd(), generateUniqueFilename());
        await fs.writeFile(inputPath, bufferAudio);

        let bufferFinal = bufferAudio; // Default use original buffer / افتراضياً استخدام الصوت الأصلي

        // ===== CONVERT AUDIO FORMAT IF NEEDED / تحويل صيغة الصوت إذا لزم الأمر =====
        try {
            const convertedPath = await convertAudioToCompatibleFormat(inputPath);
            bufferFinal = await fs.readFile(convertedPath);
        } catch (err) {
            // Ignore conversion error / تجاهل خطأ التحويل
        }

        // ===== SEND AUDIO TO USER / إرسال الصوت للمستخدم =====
        await sock.sendMessage(remoteJid, {
            audio: bufferFinal,
            mimetype: 'audio/mp4',
            ptt: true // push-to-talk format / صيغة PTT
        }, { quoted: message });

    } catch (error) {
        console.error("⚠️ An error occurred / حدث خطأ:", error);

        // ===== SEND ERROR MESSAGE / إرسال رسالة خطأ =====
        const errorMessage = `Sorry, an error occurred while processing your request. / عذرًا، حدث خطأ أثناء معالجة طلبك.\nPlease try again later / يرجى المحاولة لاحقًا.\n\n${error.message || "Unknown error / خطأ غير معروف"}`;
        await sock.sendMessage(remoteJid, { text: errorMessage }, { quoted: message });
    }
}

// ===== EXPORT MODULE / تصدير الموديول =====
module.exports = {
    handle,
    Commands: ["kodam", "cekkodam", "cekkhodam", "cekodam"], // Commands / الأوامر
    OnlyPremium: false, // Available to all users / متاح لجميع المستخدمين
    OnlyOwner: false
};