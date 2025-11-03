// 📦 استدعاء ملفات الإعدادات العامة / Import global configuration file
const config = require("@config");

// ⚙️ استدعاء أداة لإرسال الرسائل مع الإشارة / Import helper for sending messages with mentions
const { sendMessageWithMention } = require("@lib/utils");


// 🧠 الدالة الأساسية التي تتعامل مع الأمر / Main function that handles the command
async function handle(sock, messageInfo) {
  const {
    remoteJid,      // 🆔 معرف الدردشة (المجموعة أو الخاص) / Chat ID (group or private)
    message,         // 💬 الرسالة الأصلية / The original message
    fullText,        // 🧾 النص الكامل للأمر المرسل / Full command text
    mentionedJid,    // 👥 المستخدمون الذين تم ذكرهم @ / Mentioned users
    prefix,          // 🔤 بادئة الأوامر مثل (!) أو (.) / Command prefix like ! or .
    command,         // 🪄 اسم الأمر الحالي (cekbucin) / The command name (cekbucin)
    senderType,      // 👤 نوع المرسل (شخص أو مجموعة) / Sender type (user or group)
  } = messageInfo;

  // ✅ تحقق مما إذا كان هناك شخص تم الإشارة إليه / Check if someone was mentioned
  if (!mentionedJid?.length) {
    return sock.sendMessage(
      remoteJid,
      {
        // ⚠️ إذا لم يُذكر أحد، أرسل طريقة الاستخدام الصحيحة / If no one mentioned, send usage example
        text: `_⚠️ Format Penggunaan:_ \n\n_💬 Contoh:_ _*${
          prefix + command
        } @TAG*_`,
      },
      { quoted: message } // 🔁 اقتبس الرسالة الأصلية عند الرد / Quote the original message in reply
    );
  }

  // 🕵️‍♂️ تحقق إذا كان المستخدم الذي تم الإشارة إليه هو المالك / Check if the mentioned user is the owner
  const isOwner = config.owner_number
    .map((num) => `${num}@s.whatsapp.net`) // 🔄 تحويل رقم المالك إلى صيغة واتساب / Convert owner number to WhatsApp format
    .includes(mentionedJid[0]);             // 🔍 تحقق إذا كان هو الشخص المُشار إليه / Check if it's the mentioned user

  // 📊 تحديد مجموعة الإجابات الممكنة / Define the possible answers
  const gan = isOwner
    ? ["Tidak Bucin", "Dia Tidak Bucin"] // ⭐ إجابة خاصة إذا كان الشخص هو المالك / Special answers for owner
    : [
        "10", "30", "20", "40", "50", "60", 
        "70", "62", "74", "83", "97", "100", 
        "29", "94", "75", "82", "41", "39",
      ]; // 🔢 إجابات عادية للأشخاص الآخرين / Standard random answers for others

  // 🎲 اختيار إجابة عشوائية من القائمة / Randomly select one answer from the array
  const selectedAnswer = gan[Math.floor(Math.random() * gan.length)];

  // 📝 صياغة نص الرد النهائي / Format the final response message
  const responseText = `*Pertanyaan:* ${fullText}\n\n*Jawaban:* ${selectedAnswer}`;
  // 💬 "Pertanyaan" = السؤال، "Jawaban" = الجواب / "Pertanyaan" = Question, "Jawaban" = Answer

  try {
    // 📤 إرسال الرسالة مع الإشارة للشخص المذكور / Send the message mentioning the tagged user
    await sendMessageWithMention(
      sock,          // ✅ جلسة البوت / Bot session object
      remoteJid,     // 💬 المكان الذي تُرسل فيه الرسالة / The chat where the message will be sent
      responseText,  // 🧾 نص الرد النهائي / The formatted reply text
      message,       // 🔁 اقتباس الرسالة الأصلية / Quoting the original message
      senderType     // 👤 نوع المرسل (شخص أو مجموعة) / Sender type (user or group)
    );
  } catch (error) {
    // ❌ في حالة حدوث خطأ أثناء الإرسال / Handle any error that occurs while sending
    console.error("Error sending message:", error);
  }
}

// 🚀 تصدير الدالة والأوامر / Export the function and command settings
module.exports = {
  handle,                 // 🧩 الدالة الأساسية التي تُشغّل الأمر / The main handler function
  Commands: ["cekbucin"], // 💡 اسم الأمر الذي يستدعي هذا الكود / The command name trigger
  OnlyPremium: false,     // 🌍 يمكن للجميع استخدامه وليس فقط المميزين / Available to all users, not premium only
  OnlyOwner: false,       // 👑 ليس مقتصرًا على المالك فقط / Not restricted to the bot owner
};