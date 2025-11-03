const mess = require("@mess"); // Messages and response templates
// الرسائل والقوالب المستخدمة للرد
const { addUserBlock } = require("@lib/group"); // Function to block user in group
// دالة لإضافة المستخدم إلى قائمة الحظر في المجموعة
const { getGroupMetadata } = require("@lib/cache"); // Get group metadata
// الحصول على بيانات المجموعة
const { sendMessageWithMention, determineUser } = require("@lib/utils"); 
// إرسال رسالة مع الإشارة للمستخدم / تحديد المستخدم من الرد أو الرقم
// إرسال رسالة مع الإشارة للمستخدم / تحديد المستخدم من الرد أو الرقم

async function handle(sock, messageInfo) {
  const {
    remoteJid,   // Group ID or chat ID
    isGroup,     // Boolean if message is from group
    message,     // Message object
    sender,      // Sender ID
    isQuoted,    // Boolean if message is reply
    content,     // Text content
    prefix,      // Command prefix
    command,     // Command name
    mentionedJid,// Mentioned user JID
    senderType,  // Sender type
  } = messageInfo;

  // Only proceed if it's a group chat
  // نفذ فقط إذا كانت المحادثة مجموعة
  if (!isGroup) return;

  // Get metadata for the group
  // الحصول على بيانات المجموعة
  const groupMetadata = await getGroupMetadata(sock, remoteJid);
  const participants = groupMetadata.participants;

  // Check if sender is an admin
  // التحقق مما إذا كان المرسل مسؤولاً في المجموعة
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

  // Determine which user to ban (by mention, reply, or number)
  // تحديد المستخدم الذي سيتم حظره (عن طريق الإشارة أو الرد أو الرقم)
  const userToBan = determineUser(mentionedJid, isQuoted, content);
  if (!userToBan) {
    return await sock.sendMessage(
      remoteJid,
      {
        text: `_⚠️ Format Usage:_ \n\n_💬 Example:_ _*${
          prefix + command
        } 6285246154386*_`,
        // Usage example / مثال على الاستخدام
      },
      { quoted: message }
    );
  }

  const whatsappJid = userToBan;

  try {
    // Add the user to the group's blocked list
    // إضافة المستخدم إلى قائمة الحظر في المجموعة
    await addUserBlock(remoteJid, whatsappJid);

    // Send success message mentioning the banned user
    // إرسال رسالة نجاح مع الإشارة للمستخدم المحظور
    await sendMessageWithMention(
      sock,
      remoteJid,
      `✅ @${whatsappJid.split("@")[0]} _Successfully banned from this group_\n✅ تم حظر هذا المستخدم من المجموعة`,
      message,
      senderType
    );
  } catch (error) {
    console.log(error);
    // Send failure message mentioning the user
    // إرسال رسالة فشل مع الإشارة للمستخدم
    await sendMessageWithMention(
      sock,
      remoteJid,
      `❌ @${whatsappJid.split("@")[0]} _Unable to ban user_\n❌ لم يتمكن من حظر هذا المستخدم`,
      message,
      senderType
    );
  }
}

module.exports = {
  handle,
  Commands: ["ban"],   // Command name
  OnlyPremium: false,  // Available for all users
  OnlyOwner: false,    // Not restricted to owner
};