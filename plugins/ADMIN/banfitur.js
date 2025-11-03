const mess = require("@mess"); 
// Messages and response templates
// الرسائل والقوالب المستخدمة للرد
const { addFiturBlock } = require("@lib/group"); 
// Function to block a feature in the group
// دالة لحظر ميزة في المجموعة
const { getGroupMetadata } = require("@lib/cache"); 
// Get group metadata
// الحصول على بيانات المجموعة
const { sendMessageWithMention } = require("@lib/utils"); 
// Send message with mention
// إرسال رسالة مع الإشارة للمستخدم

async function handle(sock, messageInfo) {
  const {
    remoteJid,   // Group ID or chat ID
    isGroup,     // Boolean if message is from a group
    message,     // Message object
    sender,      // Sender ID
    isQuoted,    // Boolean if message is reply
    content,     // Text content
    prefix,      // Command prefix
    command,     // Command name
    mentionedJid,// Mentioned user JID
    senderType,  // Sender type
  } = messageInfo;

  // Only execute if it's a group
  // نفذ فقط إذا كانت المحادثة مجموعة
  if (!isGroup) return;

  // Get group metadata
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
      { text: mess.general.isAdmin }, // "You must be admin" / يجب أن تكون مسؤولاً
      { quoted: message }
    );
    return;
  }

  // Validate input content
  // التحقق من صحة محتوى الرسالة
  if (!content) {
    return await sock.sendMessage(
      remoteJid,
      {
        text: `_⚠️ Format Usage:_ \n\n_💬 Example:_ _*${
          prefix + command
        } pin*_`,
        // Usage example / مثال على الاستخدام
      },
      { quoted: message }
    );
  }

  try {
    // Block the specified feature in the group
    // حظر الميزة المحددة في المجموعة
    await addFiturBlock(remoteJid, content.trim());

    // Send success message mentioning the feature
    // إرسال رسالة نجاح مع ذكر الميزة
    await sendMessageWithMention(
      sock,
      remoteJid,
      `_Feature *${content}* successfully banned in this group_\n\n_To unblock type *.unbanfitur*_` +
      `\n_الميزة *${content}* تم حظرها بنجاح في هذه المجموعة_\n_لفك الحظر اكتب *.unbanfitur*_`,
      message,
      senderType
    );
  } catch (error) {
    console.log(error);

    // Send failure message if cannot ban
    // إرسال رسالة فشل إذا لم يتمكن من الحظر
    await sendMessageWithMention(
      sock,
      remoteJid,
      `❌ _Unable to ban feature_ *${content}*\n❌ لم يتمكن من حظر الميزة *${content}*`,
      message,
      senderType
    );
  }
}

module.exports = {
  handle,
  Commands: ["banfitur"], // Command name / اسم الأمر
  OnlyPremium: false,      // Available for all users / متاح لجميع المستخدمين
  OnlyOwner: false,        // Not restricted to owner / ليس مقتصرًا على المالك
};