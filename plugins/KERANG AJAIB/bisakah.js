const fs = require("fs");
const path = require("path");
const { textToAudio } = require("@lib/features"); // English: Convert text to audio | العربية: تحويل النص إلى صوت
const {
  convertAudioToCompatibleFormat, // English: Convert audio to compatible format | العربية: تحويل الصوت إلى صيغة متوافقة
  generateUniqueFilename,          // English: Generate unique file name | العربية: توليد اسم ملف فريد
} = require("@lib/utils");
const { sendMessageWithMention } = require("@lib/utils"); // English: Send message mentioning user | العربية: إرسال رسالة مع ذكر المستخدم

async function handle(sock, messageInfo) {
  const {
    remoteJid,    // English: Chat ID | العربية: رقم الدردشة
    message,      // English: Original message | العربية: الرسالة الأصلية
    fullText,     // English: Full text of message | العربية: النص الكامل للرسالة
    content,      // English: Message content | العربية: محتوى الرسالة
    mentionedJid, // English: Mentioned user ID | العربية: معرف المستخدم المذكور
    prefix,       // English: Command prefix | العربية: بادئة الأمر
    command,      // English: Command name | العربية: اسم الأمر
    senderType,   // English: Sender type (user/group) | العربية: نوع المرسل (مستخدم/مجموعة)
  } = messageInfo;

  // English: Ensure content is not empty
  // العربية: تأكد من أن المحتوى ليس فارغًا
  if (!content || content.trim() === "") {
    const groupOnlyMessage = {
      text: `_⚠️ Usage Format | صيغة الاستخدام:_ \n\n_💬 Example | مثال:_ _*${
        prefix + command
      } flying cat | قطة تطير*_`,
    };
    return sock.sendMessage(remoteJid, groupOnlyMessage, { quoted: message });
  }

  // English: List of possible answers
  // العربية: قائمة الإجابات المحتملة
  const possibleAnswers = [
    "Bisa",           // English: Can | العربية: ممكن
    "Tidak Bisa",     // English: Cannot | العربية: لا يمكن
    "Mana Gua Tau",   // English: How would I know | العربية: كيف لي أن أعرف
    "Mungkin",        // English: Maybe | العربية: ربما
    "Tentu Saja",     // English: Of course | العربية: بالطبع
    "Tidak Pasti",    // English: Not sure | العربية: غير متأكد
    "Tentu Tidak",    // English: Definitely not | العربية: بالتأكيد لا
    "Tidak Mungkin",  // English: Impossible | العربية: مستحيل
    "Tidak",          // English: No | العربية: لا
  ];

  // English: Select a random answer
  // العربية: اختيار إجابة عشوائية
  const randomAnswer =
    possibleAnswers[Math.floor(Math.random() * possibleAnswers.length)];

  // English: Create response message
  // العربية: إنشاء رسالة الرد
  const responseText = `*Question | السؤال:* ${fullText}\n\n*Answer | الإجابة:* ${randomAnswer}`;

  try {
    // English: Convert text to audio
    // العربية: تحويل النص إلى صوت
    const bufferAudio = await textToAudio(randomAnswer);

    const baseDir = process.cwd();
    const inputPath = path.join(baseDir, generateUniqueFilename());
    fs.writeFileSync(inputPath, bufferAudio);

    let bufferOriginal = bufferAudio;

    try {
      // English: Convert audio to compatible format
      // العربية: تحويل الصوت إلى صيغة متوافقة
      bufferOriginal = await convertAudioToCompatibleFormat(inputPath);
    } catch {}

    // English: Send audio message
    // العربية: إرسال رسالة صوتية
    await sock.sendMessage(
      remoteJid,
      { audio: { url: bufferOriginal }, mimetype: "audio/mp4", ptt: true },
      { quoted: message }
    );
  } catch (error) {
    // English: If audio fails, send text with mention
    // العربية: إذا فشل الصوت، إرسال النص مع ذكر المستخدم
    await sendMessageWithMention(
      sock,
      remoteJid,
      responseText,
      message,
      senderType
    );
  }
}

module.exports = {
  handle,
  Commands: ["bisakah"], // English: "Can it?" command | العربية: أمر "هل يمكن؟"
  OnlyPremium: false,
  OnlyOwner: false,
};