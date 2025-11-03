// PROMOTEALL: Promote all members to admin
// ترقية_الكل: ترقية جميع الأعضاء ليصبحوا مشرفين

const mess = require("@mess");
const { sendMessageWithMention } = require("@lib/utils");
const { getGroupMetadata } = require("@lib/cache");

async function handle(sock, messageInfo) {
  const { remoteJid, isGroup, message, sender, senderType } = messageInfo;

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

    // Filter members who are not admin
    // تصفية الأعضاء غير المشرفين
    const nonAdmins = participants
      .filter((participant) => !participant.admin)
      .map((participant) => participant.id);

    // If all members are already admin
    // إذا كان جميع الأعضاء مشرفين بالفعل
    if (nonAdmins.length === 0) {
      return await sock.sendMessage(
        remoteJid,
        { text: "_All members are already admins._\n_جميع الأعضاء مشرفين بالفعل._" },
        { quoted: message }
      );
    }

    // Promote all non-admin members
    // ترقية جميع الأعضاء غير المشرفين
    await sock.groupParticipantsUpdate(remoteJid, nonAdmins, "promote");

    // Send success message with count
    // إرسال رسالة نجاح مع عدد الأعضاء الذين تمت ترقيتهم
    await sendMessageWithMention(
      sock,
      remoteJid,
      `*${nonAdmins.length}* members have been promoted to admin.\n*${nonAdmins.length}* أعضاء تم ترقيةهم إلى مشرفين.`,
      message,
      senderType
    );

  } catch (error) {
    console.error("Error in promoteall command:", error);

    // Send error message
    // إرسال رسالة خطأ
    await sock.sendMessage(
      remoteJid,
      {
        text: "⚠️ An error occurred while promoting members to admin.\n⚠️ حدث خطأ أثناء ترقية الأعضاء إلى مشرفين.",
      },
      { quoted: message }
    );
  }
}

module.exports = {
  handle,
  Commands: ["promoteall"], // Command trigger
  OnlyPremium: false,
  OnlyOwner: false,
};