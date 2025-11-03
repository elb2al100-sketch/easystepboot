// DEMOTE ALL: Demote all admins to regular users
// خفض صلاحيات جميع المسؤولين إلى أعضاء عاديين
const mess = require("@mess");
// Message templates / قوالب الرسائل
const { sendMessageWithMention } = require("@lib/utils");
// Utility function: send message with mention / دالة مساعدة: إرسال رسالة مع منشن
const { getGroupMetadata } = require("@lib/cache");
// Function to get group metadata / دالة للحصول على بيانات المجموعة

async function handle(sock, messageInfo) {
  const { remoteJid, isGroup, message, sender, senderType } = messageInfo;

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

    const members = participants;

    // Filter only members who are admins / تصفية الأعضاء الذين هم مسؤولون فقط
    const admins = members
      .filter((participant) => participant.admin)
      .map((participant) => participant.id);

    if (admins.length === 0) {
      return await sock.sendMessage(
        remoteJid,
        { text: "No admins to demote.\nلا يوجد مسؤولين يمكن تخفيضهم." },
        { quoted: message }
      );
    }

    // Demote all admins to regular users / تخفيض جميع المسؤولين إلى أعضاء عاديين
    await sock.groupParticipantsUpdate(remoteJid, admins, "demote");

    // Send success message with number of demoted admins / إرسال رسالة نجاح مع عدد المسؤولين الذين تم تخفيضهم
    await sendMessageWithMention(
      sock,
      remoteJid,
      `*${admins.length}* _admins have been demoted to regular users._\n*${admins.length}* _تم تخفيض صلاحياتهم من مسؤول إلى عضو عادي._`,
      message,
      senderType
    );
  } catch (error) {
    console.error("Error in demoteall command:", error);

    // Send error message / إرسال رسالة خطأ
    await sock.sendMessage(
      remoteJid,
      {
        text: "⚠️ An error occurred while trying to demote admins to regular users.\n⚠️ حدث خطأ أثناء محاولة تخفيض صلاحيات المسؤولين إلى أعضاء عاديين.",
      },
      { quoted: message }
    );
  }
}

module.exports = {
  handle,
  Commands: ["demoteall"], // Command name / اسم الأمر
  OnlyPremium: false,       // Available for all users / متاح لجميع المستخدمين
  OnlyOwner: false,         // Not restricted to owner / ليس مقتصرًا على المالك
};