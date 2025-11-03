// 📦 استدعاء ملف الإعدادات العامة للبوت / Import the bot's global configuration file
const config = require("@config");

// ⚙️ استدعاء أداة إرسال الرسائل مع الإشارة إلى المستخدم / Import utility to send messages with user mentions
const { sendMessageWithMention } = require("@lib/utils");


// 🧠 الدالة الأساسية التي تنفذ عند استدعاء الأمر / Main function executed when the command is triggered
async function handle(sock, messageInfo) {
  const {
    remoteJid,     // 🆔 معرف الدردشة (المجموعة أو الخاص) / Chat ID (group or private)
    message,        // 💬 الرسالة الأصلية / Original message
    fullText,       // 🧾 النص الكامل للأمر المرسل / Full command text
    sender,         // 👤 رقم أو معرف المرسل / Sender identifier
    content,        // 📩 محتوى الرسالة / Message content
    mentionedJid,   // 👥 المستخدمون الذين تم ذكرهم (@) / Mentioned users (@tagged)
    prefix,         // 🔤 بادئة الأوامر مثل (!) أو (.) / Command prefix such as ! or .
    command,        // 🪄 اسم الأمر المستخدم (cekganteng) / Command name (cekganteng)
    senderType,     // 👥 نوع المرسل (فردي أو مجموعة) / Type of sender (user or group)
  } = messageInfo;

  // ✅ تحقق من أن المستخدم قام بذكر شخص ما / Ensure someone was mentioned
  if (!mentionedJid?.length) {
    return sock.sendMessage(
      remoteJid,
      {
        // ⚠️ إذا لم يتم ذكر أحد، أرسل تنسيق الاستخدام الصحيح / If no one is tagged, show proper usage example
        text: `_⚠️ Format Penggunaan:_ \n\n_💬 Contoh:_ _*${
          prefix + command
        } @TAG*_`,
      },
      { quoted: message } // 🔁 اقتبس الرسالة الأصلية في الرد / Quote the original message in reply
    );
  }

  // 🕵️‍♂️ تحقق مما إذا كان المستخدم المذكور أحد المالكين / Check if the mentioned user is one of the owners
  const isOwner = config.owner_number
    .map((num) => `${num}@s.whatsapp.net`) // 🔄 تحويل رقم المالك إلى تنسيق واتساب / Convert owner number to WhatsApp format
    .includes(mentionedJid[0]);             // 🔍 تحقق إذا كان هو المستخدم المُشار إليه / Check if it's the mentioned user

  // 📊 تحديد مجموعة الإجابات الممكنة / Define an array of possible answers
  const gan = isOwner
    ? ["83", "97", "100", "102", "120", "9999", "127", "86"] // 👑 إجابات خاصة إذا كان المذكور هو المالك / Special answers for the owner
    : [
        "10", "30", "20", "40", "50", "60",
        "70", "62", "74", "83", "97", "100",
        "29", "94", "75", "82", "41", "39",
      ]; // 💪 إجابات عادية لبقية المستخدمين / Standard random answers for normal users

  // 🎲 اختيار إجابة عشوائية من القائمة / Randomly pick one answer from the array
  const selectedAnswer = gan[Math.floor(Math.random() * gan.length)];

  // 📝 إنشاء نص الرد النهائي مع السؤال والإجابة / Format the final response text
  const responseText = `*Pertanyaan:* ${fullText}\n\n*Jawaban:* ${selectedAnswer}`;
  // 💬 "Pertanyaan" = السؤال / "Jawaban" = الجواب

  try {
    // 📤 إرسال الرد مع الإشارة إلى الشخص المذكور / Send the reply mentioning the tagged user
    await sendMessageWithMention(
      sock,          // ✅ جلسة البوت / Bot session instance
      remoteJid,     // 💬 مكان إرسال الرسالة / Chat destination
      responseText,  // 🧾 نص الرد النهائي / The final reply text
      message,       // 🔁 اقتباس الرسالة الأصلية / Quoting the original message
      senderType     // 👥 نوع المرسل (فردي أو مجموعة) / Sender type
    );
  } catch (error) {
    // ❌ في حال حدوث خطأ أثناء إرسال الرسالة / Handle any sending error
    console.error("Error sending message:", error);
  }
}

// 🚀 تصدير تفاصيل الأمر حتى يمكن للبوت استخدامه / Export the command details so the bot can use it
module.exports = {
  handle,                 // 🧩 دالة تنفيذ الأمر / The main handler function
  Commands: ["cekganteng"], // 😎 اسم الأمر المستخدم / Command name used
  OnlyPremium: false,      // 🌍 متاح لجميع المستخدمين / Available for all users
  OnlyOwner: false,        // 👑 ليس مخصصًا للمالك فقط / Not restricted to owners only
};