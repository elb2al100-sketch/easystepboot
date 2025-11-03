// Import the helper function to send messages with mentions
// استيراد الدالة المساعدة لإرسال الرسائل مع الإشارة إلى المستخدم
const { sendMessageWithMention } = require("@lib/utils");

// Main handler function / الدالة الرئيسية لمعالجة الأمر
async function handle(sock, messageInfo) {
  const {
    remoteJid,    // Chat ID / رقم المحادثة
    message,      // Message object / كائن الرسالة
    fullText,     // Full message text / النص الكامل للرسالة
    sender,       // Sender information / معلومات المرسل
    content,      // Message content / محتوى الرسالة
    mentionedJid, // Mentioned users / المستخدمون الذين تم الإشارة إليهم
    prefix,       // Command prefix / بادئة الأمر
    command,      // Command name / اسم الأمر
    senderType,   // Sender type (user/bot) / نوع المرسل (مستخدم أو بوت)
  } = messageInfo;

  // 🟡 Ensure that someone is mentioned
  // 🟡 تأكد من أن هناك شخصًا تم الإشارة إليه
  if (!mentionedJid?.length) {
    return sock.sendMessage(
      remoteJid,
      {
        text: `_⚠️ Format Penggunaan:_ \n\n_💬 Contoh:_ _*${
          prefix + command
        } @TAG*_`, // Usage format example / مثال على تنسيق الاستخدام الصحيح
      },
      { quoted: message } // Reply to the same message / الرد على نفس الرسالة
    );
  }

  // 🔢 Generate a random age between 20 and 50
  // 🔢 إنشاء عمر عشوائي بين 20 و50 سنة
  const random_cekmati = Math.floor(Math.random() * 31) + 20;

  // 🧾 Create a formatted response message with some fun and warning
  // 🧾 إنشاء رسالة رد بتنسيق جذاب تحتوي على تحذير طريف
  const responseText = `🔮 *Nama:* ${content}\n🕒 *Mati Pada Umur:* ${random_cekmati} Tahun\n\n⚠️ _Cepet-cepet Tobat, karena mati itu tak ada yang tahu!_\n⚠️ _تب إلى الله بسرعة، فالموت لا يعرف وقتًا!_`;

  try {
    // ✉️ Send the message with a mention
    // ✉️ إرسال الرسالة مع الإشارة إلى الشخص المذكور
    await sendMessageWithMention(
      sock,
      remoteJid,
      responseText,
      message,
      senderType
    );
  } catch (error) {
    // ❌ Handle any sending errors
    // ❌ التعامل مع أي خطأ أثناء الإرسال
    console.error("Error sending message:", error);
  }
}

// Export command configuration
// تصدير إعدادات الأمر ليعمل داخل نظام الأوامر في البوت
module.exports = {
  handle,                // Main handler function / الدالة الأساسية
  Commands: ["cekmati"], // Command trigger name / اسم الأمر المستخدم في المحادثة
  OnlyPremium: false,    // Not restricted to premium users / ليس مخصصًا للمستخدمين المميزين فقط
  OnlyOwner: false,      // Not restricted to the owner / ليس مقتصرًا على الأونر فقط
};