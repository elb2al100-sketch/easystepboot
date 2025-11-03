// DEMOTE: Lower an admin to a regular user
// خفض صلاحيات المسؤول إلى عضو عادي
const mess = require("@mess"); 
// Message templates / قوالب الرسائل
const { sendMessageWithMention, determineUser } = require("@lib/utils"); 
// Utility functions: send message with mention, determine user / دوال مساعدة: إرسال رسالة مع منشن، تحديد العضو
const { getGroupMetadata } = require("@lib/cache"); 
// Function to get group metadata / دالة للحصول على بيانات المجموعة

async function handle(sock, messageInfo) {
  const {
    remoteJid,
    isGroup,
    message,
    sender,
    mentionedJid,
    content,
    isQuoted,
    prefix,
    command,
    senderType,
  } = messageInfo;

  if (!isGroup) return; // Only for groups / مخصص للمجموعات فقط

  try {
    // Get group metadata / الحصول على بيانات المجموعة
    const groupMetadata = await getGroupMetadata(sock, remoteJid);
    const participants = groupMetadata.participants;

    // Check if sender is admin / التحقق مما إذا كان المرسل مسؤول
    const isAdmin = participants.some(
      (participant) => participant.id === sender && participant.admin
    );
    if (!isAdmin) {
      await sock.sendMessage(
        remoteJid,
        { text: mess.general.isAdmin },
        { quoted: message }
      );
      return;
    }

    // Determine which user to demote / تحديد العضو الذي سيتم تخفيضه
    const userToDemote = determineUser(mentionedJid, isQuoted, content);
    if (!userToDemote) {
      return await sock.sendMessage(
        remoteJid,
        {
          text: `_⚠️ Usage Format:_ \n\n_💬 Example:_ _*${
            prefix + command
          } @NAME*_\n⚠️ صيغة الاستخدام: _*${
            prefix + command
          } @الاسم*_`,
        },
        { quoted: message }
      );
    }

    // Process demote / تنفيذ عملية التخفيض
    await sock.groupParticipantsUpdate(remoteJid, [userToDemote], "demote");

    // Send message with mention / إرسال رسالة مع منشن
    await sendMessageWithMention(
      sock,
      remoteJid,
      `@${userToDemote.split("@")[0]} _has been demoted from admin._\n@${userToDemote.split("@")[0]} _تم تخفيض صلاحياته من المسؤول إلى عضو عادي_`,
      message,
      senderType
    );
  } catch (error) {
    console.error("Error in demote command:", error);

    // Send error message / إرسال رسالة خطأ
    await sock.sendMessage(
      remoteJid,
      { text: "⚠️ An error occurred while trying to demote the admin.\n⚠️ حدث خطأ أثناء محاولة تخفيض صلاحيات المسؤول." },
      { quoted: message }
    );
  }
}

module.exports = {
  handle,
  Commands: ["demote"], // Command name / اسم الأمر
  OnlyPremium: false,   // Available for all users / متاح لجميع المستخدمين
  OnlyOwner: false,     // Not restricted to owner / ليس مقتصرًا على المالك
};