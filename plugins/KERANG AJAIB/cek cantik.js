// 📦 استدعاء ملف الإعدادات العامة للبوت / Import the bot’s global configuration file
const config = require("@config");

// ⚙️ استدعاء أداة لإرسال الرسائل مع الإشارة إلى المستخدم / Import a helper for sending messages with mentions
const { sendMessageWithMention } = require("@lib/utils");


// 🧠 الدالة الرئيسية التي تنفذ عند استخدام الأمر / The main function executed when the command is triggered
async function handle(sock, messageInfo) {
  const {
    remoteJid,     // 🆔 معرف الدردشة (المجموعة أو الخاص) / Chat ID (group or private)
    message,        // 💬 الرسالة الأصلية / The original message
    fullText,       // 🧾 النص الكامل للأمر المرسل / Full command text
    sender,         // 👤 رقم أو معرف المرسل / Sender’s identifier
    content,        // 📩 محتوى الرسالة / Message content
    mentionedJid,   // 👥 المستخدمون الذين تم ذكرهم @ / Mentioned users (@tagged)
    prefix,         // 🔤 بادئة الأوامر مثل (!) أو (.) / Command prefix like ! or .
    command,        // 🪄 اسم الأمر المستخدم (cekcantik) / The command name (cekcantik)
    senderType,     // 👥 نوع المرسل (شخص أو مجموعة) / Type of sender (user or group)
  } = messageInfo;

  // ✅ تحقق من أن المستخدم قام بذكر شخص ما / Ensure that a user was mentioned
  if (!mentionedJid?.length) {
    return sock.sendMessage(
      remoteJid,
      {
        // ⚠️ إذا لم يتم ذكر أي شخص، أرسل رسالة توضيحية لكيفية الاستخدام / If no one is tagged, show proper usage format
        text: `_⚠️ Format Penggunaan:_ \n\n_💬 Contoh:_ _*${
          prefix + command
        } @TAG*_`,
      },
      { quoted: message } // 🔁 اقتبس الرسالة الأصلية للرد عليها / Quote the original message to reply to it
    );
  }

  // 🕵️‍♂️ تحقق مما إذا كان الشخص المذكور هو المالك / Check if the mentioned user is the owner
  const isOwner = config.owner_number
    .map((num) => `${num}@s.whatsapp.net`) // 🔄 تحويل رقم المالك إلى تنسيق واتساب / Convert owner number to WhatsApp ID format
    .includes(mentionedJid[0]);             // 🔍 تحقق إذا كان هو المستخدم المذكور / Check if it's the mentioned user

  // 📊 تحديد مجموعة الإجابات الممكنة / Define possible answer values
  const gan = isOwner
    ? ["83", "97", "100", "102", "120", "9999", "127", "86"] // 👑 إجابات خاصة إذا كان المذكور هو المالك / Special answers if the mentioned user is the owner
    : [
        "10", "30", "20", "40", "50", "60",
        "70", "62", "74", "83", "97", "100",
        "29", "94", "75", "82", "41", "39",
      ]; // 💅 إجابات عادية لبقية المستخدمين / Standard answers for other users

  // 🎲 اختيار رقم عشوائي من القائمة / Randomly select one answer from the array
  const selectedAnswer = gan[Math.floor(Math.random() * gan.length)];

  // 📝 إنشاء نص الرد النهائي مع إدراج السؤال والإجابة / Format the final response text including question & answer
  const responseText = `*Pertanyaan:* ${fullText}\n\n*Jawaban:* ${selectedAnswer}`;
  // 💬 "Pertanyaan" = السؤال / "Jawaban" = الجواب

  try {
    // 📤 إرسال الرد مع الإشارة إلى الشخص المذكور / Send the reply while mentioning the tagged user
    await sendMessageWithMention(
      sock,          // ✅ جلسة البوت / Bot session
      remoteJid,     // 💬 المكان الذي يتم إرسال الرد فيه / Chat destination
      responseText,  // 🧾 نص الرد / The reply text
      message,       // 🔁 اقتباس الرسالة الأصلية / Quoted original message
      senderType     // 👥 نوع المرسل (شخص أو مجموعة) / Type of sender
    );
  } catch (error) {
    // ❌ في حال حدوث خطأ أثناء إرسال الرسالة / Handle any sending errors
    console.error("Error sending message:", error);
  }
}

// 🚀 تصدير بيانات الأمر / Export command information
module.exports = {
  handle,                 // 🧩 دالة تنفيذ الأمر / The handler function
  Commands: ["cekcantik"], // 💄 اسم الأمر المستخدم / Command name
  OnlyPremium: false,      // 🌍 متاح للجميع وليس للحسابات المميزة فقط / Available to all users, not just premium
  OnlyOwner: false,        // 👑 ليس مقتصرًا على المالك فقط / Not restricted to owner only
};