const config = require('@config');

async function handle(sock, messageInfo) {
    const { remoteJid, message } = messageInfo;
    const rateLimitSeconds = config.rate_limit / 1000; // ⏱️ تحويل القيمة إلى ثواني / Convert rate limit to seconds

    // 📄 إنشاء نص الرسالة باللغتين العربية والإنجليزية
    // 📄 Create the message text in both Arabic and English
    const response = `⏱️ *معدل استخدام الأوامر / Bot Rate Limit*

🕒 _المدة المسموح بها بين كل أمر وآخر / Command usage interval_: *${rateLimitSeconds} ثوانٍ / seconds*

📌 *لماذا يوجد هذا الحد؟ / Why does this limit exist?*
للحفاظ على استقرار البوت ومنع الإرسال الزائد أو السبام.  
This helps prevent the bot from sending too many messages in a short time (anti-spam).  
لهذا، لا يمكن معالجة أمر جديد إلا بعد مرور ${rateLimitSeconds} ثانية.

🙏 *شكراً لتفهمك!* / *Thank you for your understanding!*`;

    // 📤 إرسال الرد إلى المستخدم / Send response to the user
    await sock.sendMessage(remoteJid, { text: response }, { quoted: message });
}

// ⚙️ إعدادات الأمر / Command settings
module.exports = {
    handle,
    Commands: ['ratelimit'],   // اسم الأمر المستخدم / Command name
    OnlyPremium: false,        // متاح للجميع / Available for everyone
    OnlyOwner: false           // ليس خاصاً بالمالك فقط / Not restricted to owner
};