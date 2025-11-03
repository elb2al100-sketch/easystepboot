// Import required modules / استيراد الوحدات المطلوبة
const { removeUser, getUser, isUserPlaying } = require("@tmpDB/family100");
const { sendMessageWithMention } = require("@lib/utils");
const { addUser, updateUser, deleteUser, findUser } = require("@lib/users");

/**
 * Main process function for the Family 100 game
 * الدالة الرئيسية لمعالجة لعبة "فاميلي 100"
 */
async function process(sock, messageInfo) {
  const { remoteJid, fullText, message, sender, senderType } = messageInfo;

  // Check if the user is currently playing
  // التحقق مما إذا كان المستخدم يلعب حاليًا
  if (!isUserPlaying(remoteJid)) {
    return true; // Continue to the next plugin / المتابعة إلى الإضافة التالية
  }

  const data = getUser(remoteJid); // Retrieve current game data / جلب بيانات اللعبة الحالية

  // Validate data structure / التحقق من صحة هيكل البيانات
  if (!data || !data.answer || !Array.isArray(data.answer)) {
    console.error("Invalid user data or answers not found:", data);
    console.error("بيانات المستخدم غير صالحة أو لم يتم العثور على الإجابات:", data);
    return true; // Continue if data is invalid / المتابعة إذا كانت البيانات غير صالحة
  }

  let isSurrender = fullText.toLowerCase().includes("nyerah"); // “nyerah” means surrender / تعني “nyerah” الاستسلام
  let isWin = false; // Whether all answers are found / هل تم العثور على كل الإجابات

  // If the player gives up / إذا استسلم اللاعب
  if (isSurrender) {
    // Show all answers when surrendering / عرض جميع الإجابات عند الاستسلام
    data.terjawab = data.terjawab.map((item) => item || ""); // Mark unanswered as empty / وضع فراغ للإجابات غير المكتملة
  } else {
    // Check if the submitted answer matches one of the correct ones
    // التحقق مما إذا كانت الإجابة المدخلة تطابق إحدى الإجابات الصحيحة
    const normalizedAnswer = fullText.toLowerCase().replace(/[^\w\s\-]+/, "");
    const index = data.answer.findIndex(
      (answer) =>
        answer.toLowerCase().replace(/[^\w\s\-]+/, "") === normalizedAnswer
    );

    // Validate index and answer / التحقق من صلاحية الفهرس والإجابة
    if (index === -1 || data.terjawab[index]) {
      return true; // Invalid or already answered / غير صالحة أو تمت الإجابة عليها مسبقًا
    }

    // Mark the answer as answered by the sender / وضع علامة أن هذا المستخدم أجاب على هذا العنصر
    data.terjawab[index] = sender;

    // Check if all answers are complete / التحقق مما إذا كانت جميع الإجابات قد اكتملت
    isWin = data.terjawab.every(Boolean);
  }

  // Build the result message / إنشاء نص النتيجة
  const hasSpacedAnswer = data.answer.some((answer) => answer.includes(" "));
  const caption = `
*Jawablah Pertanyaan Berikut :* / *أجب على السؤال التالي :*
${data.soal}

Terdapat ${data.answer.length} Jawaban ${
    hasSpacedAnswer ? `(beberapa jawaban terdapat spasi)` : ""
  }
/ يوجد ${data.answer.length} إجابة ${
    hasSpacedAnswer ? "(بعض الإجابات تحتوي على فراغات)" : ""
  }

${
  isWin
    ? `🎉 Semua jawaban telah terjawab! / 🎉 تم العثور على جميع الإجابات!`
    : isSurrender
    ? "😢 Menyerah! Berikut semua jawabannya: / 😢 لقد استسلمت! وهذه جميع الإجابات:"
    : ""
}
${data.answer
  .map((jawaban, index) =>
    // Show all answers if surrendered, or only answered ones while playing
    // عرض كل الإجابات عند الاستسلام أو فقط المجابات أثناء اللعب
    isSurrender || data.terjawab[index]
      ? `(${index + 1}) ${jawaban} ${
          data.terjawab[index] ? `@${data.terjawab[index].split("@")[0]}` : ""
        }`
      : null
  )
  .filter(Boolean)
  .join("\n")}`.trim();

  // Prize amounts / قيم الجوائز
  const hadiahPerJawabanBenar = data.hadiahPerJawabanBenar; // per correct answer / لكل إجابة صحيحة
  const hadiahJikaMenang = data.hadiahJikaMenang; // total if all correct / المجموع في حالة الفوز الكامل
  let MoneyClaim;

  if (!isSurrender) {
    // Reward only if not surrendered / الجائزة تُمنح فقط إذا لم يستسلم المستخدم

    // Find user / البحث عن المستخدم
    const user = await findUser(sender);

    if (isWin) {
      MoneyClaim = hadiahJikaMenang; // Full win reward / جائزة الفوز الكاملة
    } else {
      MoneyClaim = hadiahPerJawabanBenar; // Partial reward / جائزة جزئية
    }

    if (user) {
      const moneyAdd = (user.money || 0) + MoneyClaim; // Default 0 if undefined / تعيين 0 إذا لم يكن موجودًا
      await updateUser(sender, { money: moneyAdd }); // Update balance / تحديث الرصيد
    } else {
      await addUser(sender, {
        money: MoneyClaim,
        role: "user",
        status: "active",
      });
    }
  }

  // If all answers are correct / إذا كانت جميع الإجابات صحيحة
  if (isWin) {
    await sendMessageWithMention(
      sock,
      remoteJid,
      `🎉 Selamat! Semua Jawaban telah terjawab. Anda mendapatkan ${MoneyClaim} Money.
      🎉 مبروك! تم العثور على جميع الإجابات. ربحت ${MoneyClaim} عملة.`,
      message,
      senderType
    );
  } else {
    if (!isSurrender) {
      const captionNew = `✅ Jawaban Benar! Anda dapat ${MoneyClaim} Money.
      ✅ إجابتك صحيحة! ربحت ${MoneyClaim} عملة.\n\n${caption}`;
      await sendMessageWithMention(sock, remoteJid, captionNew, message, senderType);
      return true;
    }

    // If surrender / إذا استسلم المستخدم
    await sendMessageWithMention(sock, remoteJid, caption, message, senderType);
  }

  // If finished or surrendered / إذا انتهت اللعبة أو استسلم المستخدم
  if (isWin || isSurrender) {
    removeUser(remoteJid); // Remove from active games / إزالة المستخدم من قائمة الألعاب النشطة
  }

  return true; // Continue to next plugin / المتابعة إلى الإضافة التالية
}

/**
 * Export plugin configuration
 * تصدير إعدادات الإضافة
 */
module.exports = {
  name: "Family 100", // Plugin name / اسم الإضافة
  priority: 10, // Execution priority / أولوية التنفيذ
  process, // Main handler function / الدالة الرئيسية
};