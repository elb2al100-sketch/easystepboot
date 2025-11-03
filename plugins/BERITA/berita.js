const ApiAutoresbot = require('api-autoresbot'); 
// Import autoresbot API client / استيراد عميل API لأوتوريسبوت
const config        = require("@config"); 
// Import configuration / استيراد إعدادات التكوين
const { logCustom } = require("@lib/logger"); 
// Custom logger / مسجل مخصص

async function handle(sock, messageInfo) {
    const { remoteJid, message, command, content } = messageInfo;
    // Destructure message information / فك خصائص الرسالة

    try {
        // Send processing reaction / إرسال رد فعل 😎 عند المعالجة
        await sock.sendMessage(remoteJid, { react: { text: "😎", key: message.key } });

        // Create API instance / إنشاء نسخة من API باستخدام مفتاح API
        const api = new ApiAutoresbot(config.APIKEY);

        // Call API based on the given command / استدعاء API بناءً على الأمر المرسل
        const response = await api.get(`/api/news/${command}`);
        
        if (response && response.data && response.data.posts && response.data.posts.length > 0) {
            const { link, title, description, thumbnail: image } = response.data.posts[0];
            const fulltext = `${title} \n\n${description} \n${link}`;

            // Send message with image and caption / إرسال رسالة مع الصورة والعنوان والوصف
            await sock.sendMessage(remoteJid, { image: { url: image }, caption: fulltext }, { quoted: message });
        } else {
            // Log if no data available / تسجيل الخطأ إذا لم تتوفر بيانات
            logCustom('info', content, `ERROR-COMMAND-${command}.txt`);
            // Notify user no data available / إعلام المستخدم بعدم وجود أخبار
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
    Commands: [
        'antara','cnn', 'cnbc', 'jpnn','kumparan','merdeka','okezone','republika', 'sindonews','tempo', 'tribun'
    ], // Supported news sources / المصادر المدعومة
    OnlyPremium     : false, // Not limited to premium users / غير مقيد بالمستخدمين المميزين
    OnlyOwner       : false, // Not limited to owner / غير مقيد بالمالك
    limitDeduction  : 1      // Amount to deduct from user limit / مقدار الخصم من حد استخدام المستخدم
};