const fs = require('fs').promises; 
// File system with promises / نظام الملفات مع دعم الوعود
const path = require('path'); 
// Path module / وحدة التعامل مع المسارات
const ApiAutoresbot = require('api-autoresbot'); 
// Import autoresbot API client / استيراد عميل API لأوتوريسبوت
const config = require("@config"); 
// Import configuration / استيراد إعدادات التكوين
const { textToAudio } = require('@lib/features'); 
// Function to convert text to audio / دالة لتحويل النص إلى صوت
const { logCustom } = require("@lib/logger"); 
// Custom logger / مسجل مخصص
const { convertAudioToCompatibleFormat, generateUniqueFilename } = require('@lib/utils'); 
// Utility functions / دوال مساعدة

async function handle(sock, messageInfo) {
    const { remoteJid, message, content, prefix, command, isQuoted } = messageInfo;
    // Destructure message information / فك خصائص الرسالة

    // Determine text from message or quoted message / تحديد النص من الرسالة أو الرسالة المقتبسة
    const text = content && content.trim() !== '' ? content : isQuoted?.text ?? null;

    try {
        // Check if text is valid / التحقق من صحة النص
        if (!text || text.trim().length < 1) {
            return await sock.sendMessage(remoteJid, {
                text: `_⚠️ Format Usage:_ \n\n_💬 Example:_ _*${prefix + command} halo google*_`
            }, { quoted: message });
        }

        // Convert text to audio / تحويل النص إلى صوت
        let bufferOriginal = await textToAudio(text);
        
        // If textToAudio fails, use external API / إذا فشلت الدالة، استخدم API خارجي
        if (!bufferOriginal) {
            const api = new ApiAutoresbot(config.APIKEY);
            bufferOriginal = await api.getBuffer('/api/tts', { text: text });
        }

        // Save audio temporarily / حفظ الصوت مؤقتًا
        const inputPath = path.join(process.cwd(), generateUniqueFilename());
        await fs.writeFile(inputPath, bufferOriginal);

        let bufferFinal = bufferOriginal; // Default use original buffer / استخدام الصوت الأصلي افتراضيًا

        try {
            // Convert audio to compatible format / تحويل الصوت لصيغة متوافقة
            const convertedPath = await convertAudioToCompatibleFormat(inputPath);
            bufferFinal = await fs.readFile(convertedPath);
        } catch (err) {
            // Ignore conversion errors / تجاهل أخطاء التحويل
        }

        // Send voice note to user / إرسال الرسالة الصوتية للمستخدم
        await sock.sendMessage(remoteJid, {
            audio: bufferFinal,
            mimetype: 'audio/mp4',
            ptt: true
        }, { quoted: message });

    } catch (error) {
        // Log error / تسجيل الخطأ
        logCustom('error', text, `ERROR-COMMAND-${command}.txt`);
        console.error('⚠️ Error occurred:', error);

        // Notify user of error / إخطار المستخدم بوجود خطأ
        await sock.sendMessage(remoteJid, {
            text: `Sorry, an error occurred while processing your request. Please try again later.\n\n${error.message}`
        }, { quoted: message });
    }
}

module.exports = {
    handle,
    Commands: ['vn'],      // Command trigger / اسم الأمر
    OnlyPremium: false,     // Not limited to premium users / غير مقيد بالمستخدمين المميزين
    OnlyOwner: false        // Not limited to owner / غير مقيد بالمالك
};