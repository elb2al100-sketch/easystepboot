const mess = require("@mess");
const { sendMessageWithMention } = require("@lib/utils");

async function handle(sock, messageInfo) {
  const {
    remoteJid,
    message,
    fullText,
    sender,
    content,
    mentionedJid,
    prefix,
    command,
    senderType,
  } = messageInfo;

  // ✅ Ensure that user entered some content after the command
  // ✅ تأكد أن المستخدم كتب محتوى بعد الأمر
  if (!content || content.trim() === "") {
    const usageMessage = {
      text: `_⚠️ Usage Format / تنسيق الاستخدام:_ \n\n_💬 Example / مثال:_ _*${prefix + command} I am handsome / أنا وسيم*_`,
    };
    return sock.sendMessage(remoteJid, usageMessage, { quoted: message });
  }

  // 📋 List of possible answers (time-related responses)
  // 📋 قائمة الإجابات المحتملة (ردود تتعلق بالوقت)
  const possibleAnswers = [
    "Tomorrow / غدًا",
    "The day after tomorrow / بعد غد",
    "A while ago / قبل قليل",
    "In 3 days / بعد 3 أيام",
    "In 4 days / بعد 4 أيام",
    "In 5 days / بعد 5 أيام",
    "In 6 days / بعد 6 أيام",
    "In 1 week / بعد أسبوع",
    "In 2 weeks / بعد أسبوعين",
    "In 3 weeks / بعد 3 أسابيع",
    "In 1 month / بعد شهر",
    "In 2 months / بعد شهرين",
    "In 3 months / بعد 3 أشهر",
    "In 4 months / بعد 4 أشهر",
    "In 5 months / بعد 5 أشهر",
    "In 6 months / بعد 6 أشهر",
    "In 1 year / بعد سنة",
    "In 2 years / بعد سنتين",
    "In 3 years / بعد 3 سنوات",
    "In 4 years / بعد 4 سنوات",
    "In 5 years / بعد 5 سنوات",
    "In 6 years / بعد 6 سنوات",
    "In one century / بعد قرن",
  ];

  // 🎲 Pick a random answer
  // 🎲 اختيار إجابة عشوائية
  const randomAnswer =
    possibleAnswers[Math.floor(Math.random() * possibleAnswers.length)];

  // 🧾 Create bilingual response
  // 🧾 إنشاء رد ثنائي اللغة
  const responseText = `*🧐 Question / السؤال:*\n${fullText}\n\n*💬 Answer / الإجابة:*\n${randomAnswer}`;

  // 📤 Send the message mentioning the user
  // 📤 إرسال الرسالة مع منشن المستخدم
  await sendMessageWithMention(
    sock,
    remoteJid,
    responseText,
    message,
    senderType
  );
}

module.exports = {
  handle,
  Commands: ["kapankah"], // The command name / اسم الأمر
  OnlyPremium: false,      // Not limited to premium users / غير حصري للمميزين
  OnlyOwner: false,        // Anyone can use / متاح للجميع
};