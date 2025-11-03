const { sendMessageWithMention } = require("@lib/utils"); 
// Function to send message with mentions / دالة لإرسال رسالة مع الإشارة
const mess = require("@mess"); 
// Template messages / قوالب الرسائل
const { getGroupMetadata } = require("@lib/cache"); 
// Function to get group metadata / دالة للحصول على بيانات المجموعة

async function handle(sock, messageInfo) {
  const { remoteJid, isGroup, message, sender, senderType } = messageInfo;
  if (!isGroup) return; // Only for groups / مخصص للمجموعات فقط

  try {
    // Get group metadata / الحصول على بيانات المجموعة
    const groupMetadata = await getGroupMetadata(sock, remoteJid);
    const participants = groupMetadata.participants;

    // Check if sender is admin / التحقق من أن المرسل مشرف
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

    // List all group members / إنشاء قائمة جميع أعضاء المجموعة
    const memberList = participants
      .map((member, index) => `◧ @${member.id.split("@")[0]}`)
      .join("\n");

    // Check if no members exist / التحقق إذا لم يكن هناك أعضاء
    if (!memberList) {
      return await sock.sendMessage(
        remoteJid,
        { text: "⚠️ _No members in this group._ / لا يوجد أعضاء في هذه المجموعة" },
        { quoted: message }
      );
    }

    // Notification text for all members / نص إعلام لجميع الأعضاء
    const textNotif = `📋 *List of All Group Members: ${participants.length}*\n\n${memberList}`;

    // Send message with mentions / إرسال الرسالة مع الإشارة
    await sendMessageWithMention(
      sock,
      remoteJid,
      textNotif,
      message,
      senderType
    );
  } catch (error) {
    console.error("Error handling listalluser:", error);

    // Send error message / إرسال رسالة خطأ
    await sock.sendMessage(
      remoteJid,
      { text: "⚠️ An error occurred while displaying all group members. / حدث خطأ أثناء عرض جميع أعضاء المجموعة" },
      { quoted: message }
    );
  }
}

module.exports = {
  handle,
  Commands: ["listalluser"], // Command name / اسم الأمر
  OnlyPremium: false,         // Not restricted to premium users / ليس مقتصرًا على المستخدمين المميزين
  OnlyOwner: false,           // Not restricted to owner / ليس مقتصرًا على المالك
};