const mess = require("@mess");
// Import predefined messages
// استدعاء الرسائل الجاهزة

const { removeFiturFromBlock } = require("@lib/group");
// Import function to remove a feature from block list
// استدعاء دالة لإزالة ميزة من قائمة الحظر

const { getGroupMetadata } = require("@lib/cache");
// Import function to get group metadata
// استدعاء دالة للحصول على بيانات المجموعة

const { sendMessageWithMention, determineUser } = require("@lib/utils");
// Import helper functions for sending message with mentions
// استدعاء دوال مساعدة لإرسال رسالة مع منشنات

async function handle(sock, messageInfo) {
  const {
    remoteJid,
    isGroup,
    message,
    sender,
    content,
    prefix,
    command,
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

  // Validate content
  // التحقق من محتوى الرسالة
  if (!content) {
    return await sock.sendMessage(
      remoteJid,
      {
        text: `_⚠️ Usage Format:_ \n\n_💬 Example:_ _*${
          prefix + command
        } pin*_ / _⚠️ صيغة الاستخدام:_ \n\n_💬 مثال:_ _*${
          prefix + command
        } pin*_`,
      },
      { quoted: message }
    );
  }

  try {
    // Attempt to remove feature from block list
    // محاولة إزالة الميزة من قائمة الحظر
    const result = await removeFiturFromBlock(remoteJid, content);
    if (result) {
      await sendMessageWithMention(
        sock,
        remoteJid,
        `✅ _Feature ${content} has been successfully unblocked for this group_ / ✅ _الميزة ${content} تم تفعيلها بنجاح في هذه المجموعة_`,
        message,
        senderType
      );
    } else {
      await sendMessageWithMention(
        sock,
        remoteJid,
        `⚠️ _*${content}* not found in blocked features_ / ⚠️ _*${content}* لم يتم العثور عليها في قائمة الميزات المحظورة_`,
        message,
        senderType
      );
    }
  } catch (error) {
    console.log(error);
    await sendMessageWithMention(
      sock,
      remoteJid,
      `❌ _There was a problem_ / ❌ _حدثت مشكلة_`,
      message,
      senderType
    );
  }
}

module.exports = {
  handle,
  Commands: ["unbanfitur"],
  OnlyPremium: false,
  OnlyOwner: false,
};