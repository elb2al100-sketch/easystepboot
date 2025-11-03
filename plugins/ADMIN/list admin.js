const { sendMessageWithMention } = require("@lib/utils"); 
// Function to send message with mentions / دالة لإرسال رسالة مع الإشارة
const { getGroupMetadata } = require("@lib/cache"); 
// Function to get group metadata / دالة للحصول على بيانات المجموعة
const mess = require("@mess"); 
// Template messages / قوالب الرسائل

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

    // Filter participants with admin status / تصفية الأعضاء الذين لديهم صلاحية مشرف
    const adminList = participants
      .filter((participant) => participant.admin !== null)
      .map((admin, index) => `◧ @${admin.id.split("@")[0]}`)
      .join("\n");

    // Check if no admin exists / التحقق إذا لم يكن هناك أي مشرف
    if (!adminList) {
      return await sock.sendMessage(
        remoteJid,
        { text: "⚠️ _No admins in this group._ / لا يوجد مشرفون في هذه المجموعة" },
        { quoted: message }
      );
    }

    // Notification text for admin list / نص إعلام قائمة المشرفين
    const textNotif = `📋 *Group Admin List:*\n\n${adminList}`;

    // Send message with mentions / إرسال الرسالة مع الإشارة
    await sendMessageWithMention(
      sock,
      remoteJid,
      textNotif,
      message,
      senderType
    );
  } catch (error) {
    console.error("Error handling listadmin:", error);

    // Send error message / إرسال رسالة خطأ
    await sock.sendMessage(
      remoteJid,
      { text: "⚠️ An error occurred while displaying the admin list. / حدث خطأ أثناء عرض قائمة المشرفين" },
      { quoted: message }
    );
  }
}

module.exports = {
  handle,
  Commands: ["listadmin"], // Command name / اسم الأمر
  OnlyPremium: false,       // Not restricted to premium users / ليس مقتصرًا على المستخدمين المميزين
  OnlyOwner: false,         // Not restricted to owner / ليس مقتصرًا على المالك
};