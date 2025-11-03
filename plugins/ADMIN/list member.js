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
    console.log(groupMetadata);
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

    // Filter non-admin members / تصفية الأعضاء غير المشرفين
    const memberList = participants
      .filter((participant) => participant.admin === null)
      .map((member, index) => `◧ @${member.id.split("@")[0]}`)
      .join("\n");

    // Check if no non-admin members / التحقق إذا لم يكن هناك أعضاء غير مشرفين
    if (!memberList) {
      return await sock.sendMessage(
        remoteJid,
        { text: "⚠️ No non-admin members in this group. / لا يوجد أعضاء غير مشرفين في هذه المجموعة" },
        { quoted: message }
      );
    }

    // Notification text for non-admin members / نص إعلام للأعضاء غير المشرفين
    const textNotif = `📋 *List of Non-Admin Members:*\n\n${memberList}`;

    // Send message with mentions / إرسال الرسالة مع الإشارة
    await sendMessageWithMention(
      sock,
      remoteJid,
      textNotif,
      message,
      senderType
    );
  } catch (error) {
    console.error("Error handling listmember:", error);

    // Send error message / إرسال رسالة خطأ
    await sock.sendMessage(
      remoteJid,
      {
        text: "⚠️ An error occurred while displaying non-admin members. / حدث خطأ أثناء عرض الأعضاء غير المشرفين",
      },
      { quoted: message }
    );
  }
}

module.exports = {
  handle,
  Commands: ["listmember"], // Command name / اسم الأمر
  OnlyPremium: false,         // Not restricted to premium users / ليس مقتصرًا على المستخدمين المميزين
  OnlyOwner: false,           // Not restricted to owner / ليس مقتصرًا على المالك
};