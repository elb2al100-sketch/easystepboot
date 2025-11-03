// Import configuration and helper function
// استيراد ملف الإعدادات والدالة المساعدة لإرسال الرسائل مع الإشارة
const config = require("@config");
const { sendMessageWithMention } = require("@lib/utils");

// Main handler function / الدالة الرئيسية لمعالجة الأمر
async function handle(sock, messageInfo) {
  const {
    remoteJid,    // Chat ID / رقم المحادثة
    message,      // Incoming message object / كائن الرسالة الواردة
    fullText,     // Full text of the command / النص الكامل للأمر
    sender,       // Message sender / المرسل
    content,      // Message content / محتوى الرسالة
    mentionedJid, // Mentioned users / المستخدمون الذين تم الإشارة إليهم
    prefix,       // Command prefix / بادئة الأمر
    command,      // Command name / اسم الأمر
    senderType,   // Sender type (user/bot) / نوع المرسل (مستخدم أو بوت)
  } = messageInfo;

  // ⚠️ Ensure that someone is mentioned
  // ⚠️ تأكد من أن هناك شخصًا تم الإشارة إليه
  if (!mentionedJid?.length) {
    return sock.sendMessage(
      remoteJid,
      {
        text: `_⚠️ Format Penggunaan:_ \n\n_💬 Contoh:_ _*${
          prefix + command
        } @TAG*_`, // Usage example / مثال على الاستخدام الصحيح
      },
      { quoted: message } // Reply to the original message / الرد على الرسالة الأصلية
    );
  }

  // 🧠 Check if the mentioned user is the owner
  // 🧠 تحقق مما إذا كان الشخص المذكور هو الأونر (المالك)
  const isOwner = config.owner_number
    .map((num) => `${num}@s.whatsapp.net`)
    .includes(mentionedJid[0]);

  // 🔹 Define possible answers
  // 🔹 تحديد قائمة الإجابات المحتملة
  const gan = isOwner
    ? ["Tidak Tolol", "Dia Tidak Tolol"] // Special answers for the owner / إجابات خاصة بالأونر
    : [
        "10",
        "30",
        "20",
        "40",
        "50",
        "60",
        "70",
        "62",
        "74",
        "83",
        "97",
        "100",
        "29",
        "94",
        "75",
        "82",
        "41",
        "39",
      ]; // Standard answers / إجابات عشوائية عادية

  // 🎲 Randomly select one answer
  // 🎲 اختيار إجابة عشوائية من القائمة
  const selectedAnswer = gan[Math.floor(Math.random() * gan.length)];

  // 🧾 Format the response message with a mention
  // 🧾 تنسيق رسالة الرد مع ذكر المستخدم الذي تم الإشارة إليه
  const responseText = `*Pertanyaan:* ${fullText}\n\n*Jawaban:* ${selectedAnswer}`;

  try {
    // ✉️ Send message mentioning the tagged user
    // ✉️ إرسال الرسالة مع ذكر المستخدم الذي تم الإشارة إليه
    await sendMessageWithMention(
      sock,
      remoteJid,
      responseText,
      message,
      senderType
    );
  } catch (error) {
    // ❌ Handle sending errors
    // ❌ التعامل مع الأخطاء أثناء الإرسال
    console.error("Error sending message:", error);
  }
}

// Export command module
// تصدير إعدادات الأمر ليتمكن النظام من استخدامه
module.exports = {
  handle,                // Main handler / الدالة الأساسية
  Commands: ["cektolol"],// Command trigger name / اسم الأمر المستخدم في البوت
  OnlyPremium: false,    // Not restricted to premium users / متاح للجميع
  OnlyOwner: false,      // Not limited to the owner / ليس مخصصًا للأونر فقط
};