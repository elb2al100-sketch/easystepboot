// Import required functions / استيراد الدوال المطلوبة
const { findUser, updateUser } = require("@lib/users");
const { sendMessageWithMention } = require("@lib/utils");
const { getGroupMetadata } = require("@lib/cache");

// Flag to prevent multiple processes at the same time / علامة لمنع تشغيل العملية مرتين في نفس الوقت
let inProccess = false;

// Main handler function / الدالة الرئيسية لمعالجة الأمر
async function handle(sock, messageInfo) {
  const { remoteJid, message, content, prefix, command, senderType } = messageInfo;

  try {
    // Check if a process is already running / التحقق إذا كانت عملية أخرى تعمل
    if (inProccess) {
      await sendMessageWithMention(
        sock,
        remoteJid,
        `_Process is already running, please wait until it finishes_`
        // _العملية جارية، يرجى الانتظار حتى تنتهي_
        ,
        message,
        senderType
      );
      return;
    }

    // Validate input / التحقق من محتوى الإدخال
    if (!content || !content.includes("chat.whatsapp.com")) {
      const tex = `_⚠️ Usage Format:_ \n\n_💬 Example:_ \n_*${
        prefix + command
      }*_ https://chat.whatsapp.com/xxx`
      // _⚠️ تنسيق الاستخدام:_ \n\n_💬 مثال:_ \n_*${
      // prefix + command
      // }*_ https://chat.whatsapp.com/xxx
      return await sock.sendMessage(
        remoteJid,
        { text: tex },
        { quoted: message }
      );
    }

    inProccess = true;

    // Send reaction while processing / إرسال رمز أثناء المعالجة
    await sock.sendMessage(remoteJid, {
      react: { text: "🧹", key: message.key },
    });

    // Extract group invite code / استخراج كود دعوة المجموعة
    const idFromGc = content.split("https://chat.whatsapp.com/")[1];

    // Query WhatsApp for group info / استعلام عن معلومات المجموعة
    const res = await sock.query({
      tag: "iq",
      attrs: { type: "get", xmlns: "w:g2", to: "@g.us" },
      content: [{ tag: "invite", attrs: { code: idFromGc } }],
    });

    // Check if the group ID is valid / التحقق من صحة معرف المجموعة
    if (!res.content[0]?.attrs?.id) {
      const tex = `⚠️ _Group link is invalid or make sure the bot has joined_`
      // ⚠️ _رابط المجموعة غير صالح أو تأكد أن البوت موجود في المجموعة_
      inProccess = false;
      return await sock.sendMessage(
        remoteJid,
        { text: tex },
        { quoted: message }
      );
    }

    const groupId = res.content[0].attrs.id + "@g.us";

    // Get group metadata / جلب بيانات المجموعة
    const groupMetadata = await getGroupMetadata(sock, groupId);
    const participants = groupMetadata.participants;

    let successCount = 0;
    let failedCount = 0;

    // Loop through group members / المرور على كل أعضاء المجموعة
    for (const member of participants) {
      try {
        const id_users = member.id;
        let userData = await findUser(id_users);

        // Remove premium if user has it / إزالة حالة المميز إذا كان موجوداً
        if (userData && userData.premium) {
          userData.premium = null; 
          await updateUser(id_users, userData);
          successCount++;
        }
      } catch (error) {
        console.error(`Failed to remove premium for ${member.id}:`, error);
        failedCount++;
      }
    }

    inProccess = false;

    // Send result message / إرسال رسالة النتيجة
    const responseText = `✅ Successfully removed premium from ${successCount} users.\n❌ Failed: ${failedCount}`
    // ✅ تم إزالة المميز من ${successCount} مستخدم.\n❌ فشل: ${failedCount}
    await sendMessageWithMention(
      sock,
      remoteJid,
      responseText,
      message,
      senderType
    );
  } catch (error) {
    console.error("Error during premium removal:", error);
    inProccess = false;

    // Send error message / رسالة الخطأ
    await sock.sendMessage(
      remoteJid,
      { text: "❌ An error occurred while processing the data." }
      // ❌ حدث خطأ أثناء معالجة البيانات
      ,
      { quoted: message }
    );
  }
}

// Export module info / تصدير بيانات الموديول
module.exports = {
  handle,
  Commands: ["delpremgrub", "delpremiumgrub"], // command names / أسماء الأوامر
  OnlyPremium: false, // only premium users? / للمميزين فقط؟ لا
  OnlyOwner: true, // only owner? / للمالك فقط؟ نعم
};