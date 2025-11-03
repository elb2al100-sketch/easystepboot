// PROMOTE: Make a user an admin
// ترقية: تحويل المستخدم إلى مشرف

const mess = require("@mess");
const { sendMessageWithMention, determineUser } = require("@lib/utils");
const { getGroupMetadata } = require("@lib/cache");

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

  if (!isGroup) return; // Only group messages
  // الرسائل من المجموعات فقط

  try {
    // Get group metadata
    // الحصول على بيانات المجموعة
    const groupMetadata = await getGroupMetadata(sock, remoteJid);
    const participants = groupMetadata.participants;

    // Check if sender is admin
    // التحقق إذا كان المرسل مشرف
    const isAdmin = participants.some(
      (participant) => participant.id === sender && participant.admin
    );

    if (!isAdmin) {
      await sock.sendMessage(
        remoteJid,
        { text: mess.general.isAdmin }, // "You must be admin"
        { quoted: message }
      );
      return;
    }

    // Determine the user to be promoted
    // تحديد المستخدم المراد ترقيته
    const userToAction = determineUser(mentionedJid, isQuoted, content);
    if (!userToAction) {
      // If user not mentioned, send usage guide
      // إذا لم يتم تحديد المستخدم، أرسل دليل الاستخدام
      return await sock.sendMessage(
        remoteJid,
        {
          text: `_⚠️ Usage Format:_ \n\n_💬 Example:_ _*${
            prefix + command
          } @NAME*_`,
        },
        { quoted: message }
      );
    }

    // Promote the user to admin
    // ترقية المستخدم إلى مشرف
    await sock.groupParticipantsUpdate(remoteJid, [userToAction], "promote");

    // Send message with mention
    // إرسال رسالة مع عمل mention للمستخدم
    await sendMessageWithMention(
      sock,
      remoteJid,
      `@${userToAction.split("@")[0]} is now an admin of the group\n@${userToAction.split("@")[0]} أصبح مشرفًا في المجموعة`,
      message,
      senderType
    );
  } catch (error) {
    console.error("Error in promote command:", error);

    // Send error message
    // إرسال رسالة خطأ في حالة الفشل
    await sock.sendMessage(
      remoteJid,
      { text: "⚠️ An error occurred while trying to promote the user.\n⚠️ حدث خطأ أثناء محاولة ترقية المستخدم." },
      { quoted: message }
    );
  }
}

module.exports = {
  handle,
  Commands: ["promote"], // Command trigger
  OnlyPremium: false,
  OnlyOwner: false,
};