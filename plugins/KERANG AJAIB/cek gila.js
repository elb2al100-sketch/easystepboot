// Import configuration and utility function
// استيراد الإعدادات والدالة المساعدة لإرسال الرسائل مع الإشارة
const config = require("@config");
const { sendMessageWithMention } = require("@lib/utils");

// Main handler function / الدالة الرئيسية للمعالجة
async function handle(sock, messageInfo) {
  const {
    remoteJid,   // Chat ID / رقم المحادثة
    message,     // Incoming message / الرسالة الواردة
    fullText,    // Full message text / النص الكامل للرسالة
    sender,      // Sender of the message / مرسل الرسالة
    content,     // Content of message / محتوى الرسالة
    mentionedJid,// Mentioned users / المستخدمون الذين تم الإشارة إليهم
    prefix,      // Command prefix / بادئة الأوامر
    command,     // Command name / اسم الأمر
    senderType,  // Type of sender (user/bot) / نوع المرسل (مستخدم أو بوت)
  } = messageInfo;

  // 🟡 Ensure someone is mentioned
  // 🟡 تأكد من أن هناك شخصًا تم الإشارة إليه
  if (!mentionedJid?.length) {
    return sock.sendMessage(
      remoteJid,
      {
        text: `_⚠️ Format Penggunaan:_ \n\n_💬 Contoh:_ _*${
          prefix + command
        } @TAG*_`, // Instruction example / مثال على طريقة الاستخدام
      },
      { quoted: message } // Reply to the same message / رد على نفس الرسالة
    );
  }

  // 🟢 Check if the mentioned person is the owner
  // 🟢 تحقق مما إذا كان الشخص الذي تم الإشارة إليه هو المالك (الأونر)
  const isOwner = config.owner_number
    .map((num) => `${num}@s.whatsapp.net`)
    .includes(mentionedJid[0]);

  // 🔹 Define possible answers
  // 🔹 تحديد قائمة الإجابات المحتملة
  const gan = isOwner
    ? ["Tidak Gila", "Dia Tidak Gila", "Owner masih waras"] // Special answers for owner / إجابات خاصة بالمالك
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

  // 🎲 Randomly pick one answer
  // 🎲 اختيار إجابة عشوائية من القائمة
  const selectedAnswer = gan[Math.floor(Math.random() * gan.length)];

  // 🧾 Format the response message mentioning the user
  // 🧾 تنسيق نص الرد مع ذكر المستخدم الذي تم الإشارة إليه
  const responseText = `*Pertanyaan:* ${fullText}\n\n*Jawaban:* ${selectedAnswer}`;

  try {
    // ✉️ Send the message mentioning the tagged user
    // ✉️ إرسال الرسالة مع ذكر المستخدم الذي تم الإشارة إليه
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

// Export the module configuration
// تصدير إعدادات الوحدة (الأمر والمحددات)
module.exports = {
  handle,                // Export main function / تصدير الدالة الرئيسية
  Commands: ["cekgila"], // Command name / اسم الأمر المستخدم في البوت
  OnlyPremium: false,    // Accessible for all users / متاح لجميع المستخدمين
  OnlyOwner: false,      // Not restricted to owner only / ليس مقتصرًا على المالك فقط
};