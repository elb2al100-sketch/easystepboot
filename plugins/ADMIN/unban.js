const mess = require("@mess");
// Import predefined messages
// استدعاء الرسائل الجاهزة

const { removeUserFromBlock } = require("@lib/group");
// Import function to remove a user from the blocked list
// استدعاء دالة لإزالة مستخدم من قائمة المحظورين

const { getGroupMetadata } = require("@lib/cache");
// Import function to get group metadata
// استدعاء دالة للحصول على بيانات المجموعة

const { sendMessageWithMention, determineUser } = require("@lib/utils");
// Import helper functions to send message with mention & determine user
// استدعاء دوال مساعدة لإرسال رسالة مع منشن وتحديد المستخدم

async function handle(sock, messageInfo) {
  const {
    remoteJid,
    isGroup,
    message,
    sender,
    content,
    prefix,
    command,
    mentionedJid,
    isQuoted,
    senderType,
  } = messageInfo;

  if (!isGroup) return; // Only for groups
  // فقط للمجموعات

  // Get group metadata
  // الحصول على بيانات المجموعة
  const groupMetadata = await getGroupMetadata(sock, remoteJid);
  const participants = groupMetadata.participants;

  // Check if sender is admin
  // التحقق إذا كان المرسل مشرف في المجموعة
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

  // Determine which user to unban
  // تحديد المستخدم الذي سيتم رفع الحظر عنه
  const userToBan = determineUser(mentionedJid, isQuoted, content);
  if (!userToBan) {
    return await sock.sendMessage(
      remoteJid,
      {
        text: `_⚠️ Usage Format:_ \n\n_💬 Example:_ _*${
          prefix + command
        } 6285246154386*_\n_⚠️ صيغة الاستخدام:_ \n\n_💬 مثال:_ _*${
          prefix + command
        } 6285246154386*_`,
      },
      { quoted: message }
    );
  }
  const whatsappJid = userToBan;

  try {
    // Attempt to remove user from block list
    // محاولة إزالة المستخدم من قائمة المحظورين
    const result = await removeUserFromBlock(remoteJid, whatsappJid);
    if (result) {
      await sendMessageWithMention(
        sock,
        remoteJid,
        `✅ @${whatsappJid.split("@")[0]} _Successfully unbanned for this group_ / تم رفع الحظر عن هذا المستخدم بنجاح في هذه المجموعة`,
        message,
        senderType
      );
    } else {
      await sendMessageWithMention(
        sock,
        remoteJid,
        `⚠️ @${whatsappJid.split("@")[0]} _Not found in the ban list_ / لم يتم العثور على هذا المستخدم في قائمة الحظر`,
        message,
        senderType
      );
    }
  } catch (error) {
    console.log(error);
    await sendMessageWithMention(
      sock,
      remoteJid,
      `❌ _Cannot unban number_ @${whatsappJid.split("@")[0]} / لا يمكن رفع الحظر عن هذا الرقم`,
      message,
      senderType
    );
  }
}

module.exports = {
  handle,
  Commands: ["unban"],
  OnlyPremium: false,
  OnlyOwner: false,
};