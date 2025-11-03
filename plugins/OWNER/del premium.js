const { findUser, updateUser } = require("@lib/users");
const { sendMessageWithMention } = require("@lib/utils");

async function handle(sock, messageInfo) {
  const { remoteJid, message, sender, content, prefix, command, senderType } =
    messageInfo;

  try {
    // Validate input | التحقق من الإدخال
    if (!content || content.trim() === "") {
      const tex = `_⚠️ Usage Format | صيغة الاستخدام:_ \n\n_💬 Example | مثال:_ _*${
        prefix + command
      } 6285246154386*_`;
      return await sock.sendMessage(
        remoteJid,
        { text: tex },
        { quoted: message }
      );
    }

    let nomorHp = content;

    // Further input validation | التحقق الإضافي من الإدخال
    if (!nomorHp) {
      const tex = "_⚠️ Make sure the format is correct | تأكد من صحة الصيغة : .delprem 6285246154386_";
      return await sock.sendMessage(
        remoteJid,
        { text: tex },
        { quoted: message }
      );
    }

    // Remove all non-digit characters | إزالة جميع الأحرف غير الرقمية
    nomorHp = nomorHp.replace(/\D/g, "");

    // Add @s.whatsapp.net to the number | أضف @s.whatsapp.net إلى الرقم
    nomorHp = `${nomorHp}@s.whatsapp.net`;

    // Get user data | جلب بيانات المستخدم
    let userData = await findUser(nomorHp);

    // If user not found | إذا لم يتم العثور على المستخدم
    if (!userData) {
      return await sock.sendMessage(
        remoteJid,
        { text: "_❌ User not found | لم يتم العثور على المستخدم_" },
        { quoted: message }
      );
    }

    // Remove premium status | إزالة حالة البريميوم
    userData.premium = null;

    // Update user data in database | تحديث بيانات المستخدم في قاعدة البيانات
    await updateUser(nomorHp, userData);

    const responseText = `_✅ User_ @${
      nomorHp.split("@")[0]
    } _has been removed from premium | تم إزالة المستخدم من البريميوم:_`;

    // Send message with mention | إرسال رسالة مع الإشارة
    await sendMessageWithMention(
      sock,
      remoteJid,
      responseText,
      message,
      senderType
    );
  } catch (error) {
    console.error("Error processing premium removal:", error);

    // Send error message to user | إرسال رسالة خطأ للمستخدم
    await sock.sendMessage(
      remoteJid,
      {
        text: "_❌ An error occurred while processing the data. Please try again later | حدث خطأ أثناء معالجة البيانات. حاول مرة أخرى لاحقًا._",
      },
      { quoted: message }
    );
  }
}

module.exports = {
  handle,
  Commands: ["delprem", "delpremium"],
  OnlyPremium: false,
  OnlyOwner: true, // Only owner can access | فقط المالك يمكنه الوصول
};