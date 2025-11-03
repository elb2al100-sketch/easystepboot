const ApiAutoresbot     = require('api-autoresbot'); 
// Import autoresbot API client / استيراد عميل API لأوتوريسبوت
const { textToAudio }   = require('@lib/features'); 
// Function to convert text to audio / دالة لتحويل النص إلى صوت
const config            = require("@config"); 
// Import configuration / استيراد إعدادات التكوين
const { logCustom }     = require("@lib/logger"); 
// Custom logger / مسجل مخصص
const api               = new ApiAutoresbot(config.APIKEY); 
// Initialize API client / تهيئة عميل API

async function handle(sock, messageInfo) {
    const { remoteJid, message, prefix, command, content } = messageInfo;
    // Destructure message information / فك خصائص الرسالة

    try {
        // Check if user sent text / التحقق من إرسال المستخدم للنص
        if (!content.trim()) {
            return await sock.sendMessage(remoteJid, { 
                text: `_⚠️ Format Usage:_ \n\n_💬 Example:_ _*${prefix + command} penemu facebook*_` 
            }, { quoted: message });
        }

        // Send loading reaction / إرسال رمز التفكير
        await sock.sendMessage(remoteJid, { react: { text: "🤔", key: message.key } });

        // Call the API with error handling / استدعاء API مع التعامل مع الأخطاء
        const contentShort = `${content} dan tulis sesingkat mungkin`; 
        // Modify text to request short answer / تعديل النص ليكون مختصرًا
        const response = await api.get('/api/gemini', { text: contentShort });
        
        if (response && response.data) {
            let bufferAudioResult;

            try {
                // Try converting response to audio / محاولة تحويل الرد إلى صوت
                const bufferAudio = await textToAudio(response.data);
                if(bufferAudio) {
                    bufferAudioResult = bufferAudio;
                }
            } catch {
                // If failed, use API TTS / إذا فشل، استخدام API لتحويل النص إلى صوت
                const buffer = await api.getBuffer('/api/tts', { text: response.data });
                bufferAudioResult = buffer;
            }

            // Send audio as PTT / إرسال الصوت كرسالة صوتية
            await sock.sendMessage(remoteJid, { 
                audio: bufferAudioResult, 
                mimetype: 'audio/mp4', 
                ptt: true 
            }, { quoted: message });

        } else {
            // Send default message if API response is empty / إرسال رسالة افتراضية إذا لم توجد بيانات من API
            await sock.sendMessage(remoteJid, { text: "Sorry, no response from the server." }, { quoted: message });
        }
    } catch (error) {
        // Log error / تسجيل الخطأ
        logCustom('info', content, `ERROR-COMMAND-${command}.txt`);
        
        // Notify user of error / إخطار المستخدم بوجود خطأ
        await sock.sendMessage(remoteJid, { 
            text: `Sorry, an error occurred while processing your request. Please try again later.\n\n${error}` 
        }, { quoted: message });
    }
}

module.exports = {
    handle,
    Commands        : ['voiceai'],   // Command trigger / اسم الأمر
    OnlyPremium     : false,          // Not limited to premium users / غير مقيد بالمستخدمين المميزين
    OnlyOwner       : false,          // Not limited to owner / غير مقيد بالمالك
    limitDeduction  : 1               // Amount to deduct from user limit / مقدار الخصم من حد استخدام المستخدم
};