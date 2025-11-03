const mess = require("@mess");
// Import predefined messages
// استدعاء الرسائل الجاهزة

const { resetTotalChatPerGroup } = require("@lib/totalchat");
// Import function to reset total chat per group
// استدعاء دالة لإعادة ضبط إجمالي الرسائل لكل مجموعة

const { sendMessageWithMention } = require("@lib/utils");
// Import helper function to send message with mentions
// استدعاء دالة مساعدة لإرسال رسالة مع منشن للأعضاء

const { getGroupMetadata } = require("@lib/cache");
// Import function to get group metadata
// استدعاء دالة للحصول على بيانات المجموعة

async function handle(sock, messageInfo) {
  const { remoteJid, isGroup, message, sender, senderType } = messageInfo;
  if (!isGroup) return; // Only for groups
  // فقط للمجموعات

  try {
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

    // Reset total chat data for the group
    // إعادة ضبط بيانات إجمالي الرسائل للمجموعة
    await resetTotalChatPerGroup(remoteJid);

    // Send confirmation message with mentions
    // إرسال رسالة تأكيد مع منشن للأعضاء
    await sendMessageWithMention(
      sock,
      remoteJid,
      "_Total Chat in this group has been successfully reset_ / تم إعادة ضبط إجمالي الرسائل في هذه المجموعة بنجاح",
      message,
      senderType
    );
  } catch (error) {
    console.error("Error handling reset total chat command:", error);
    return await sock.sendMessage(
      remoteJid,
      { text: "⚠️ An error occurred while processing your request. / حدث خطأ أثناء معالجة طلبك." },
      { quoted: message }
    );
  }
}

module.exports = {
  handle,
  Commands: ["resettotalchat"],
  OnlyPremium: false,
  OnlyOwner: false,
};