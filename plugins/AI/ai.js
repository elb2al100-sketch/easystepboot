const ApiAutoresbot = require('api-autoresbot'); 
// Import the autoresbot API client / استيراد عميل API لأوتوريسبوت
const config        = require("@config");       
// Import configuration / استيراد إعدادات التكوين
const api           = new ApiAutoresbot(config.APIKEY); 
// Initialize API with key / تهيئة API باستخدام المفتاح
const { logCustom } = require("@lib/logger");   
// Import custom logger / استيراد مسجل مخصص

async function handle(sock, messageInfo) {
    const { remoteJid, message, prefix, command, content } = messageInfo;
    // Destructure message information / فك خصائص الرسالة

    try {

        // Check if user provided content / التحقق من إرسال المستخدم للمحتوى
        if (!content.trim()) {
            return await sock.sendMessage(remoteJid, { 
                text: `_⚠️ Format Usage:_ \n\n_💬 Example:_ _*${prefix + command} siapa jokowi*_` 
            }, { quoted: message });
        }
    
        // Send loading reaction / إرسال رمز التحميل
        await sock.sendMessage(remoteJid, { react: { text: "🤔", key: message.key } });

        // Call the API with error handling / استدعاء API مع التعامل مع الأخطاء
        const response = await api.get('/api/gemini', { text: content });
        
        if (response && response.data) {
            // Send message if data is available / إرسال رسالة إذا كانت البيانات متوفرة
            await sock.sendMessage(remoteJid, { text: response.data }, { quoted: message });
        } else {
            // Send default message if response is empty / إرسال رسالة افتراضية إذا لم توجد بيانات
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
    Commands        : ['ai'],   // Command trigger / اسم الأمر
    OnlyPremium     : false,    // Not limited to premium users / غير مقيد بالمستخدمين المميزين
    OnlyOwner       : false,    // Not limited to owner / غير مقيد بالمالك
    limitDeduction  : 1,        // Amount to deduct from user limit / مقدار الخصم من حد استخدام المستخدم
};