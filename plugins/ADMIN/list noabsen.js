const { findAbsen } = require("@lib/absen"); 
// Function to find attendance / دالة للحصول على بيانات الحضور
const { sendMessageWithMention } = require("@lib/utils"); 
// Function to send messages with mentions / دالة لإرسال الرسائل مع الإشارة
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
    const totalMembers = participants.length;

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

    // Get attendance data / الحصول على بيانات الحضور
    const data = await findAbsen(remoteJid);
    const absenMembers = data?.member || [];

    // Get members who have not attended yet / الأعضاء الذين لم يحضروا بعد
    const noAbsenMembers = participants
      .filter((p) => !absenMembers.includes(p.id))
      .map((p, index) => `${index + 1}. @${p.id.split("@")[0]}`);

    let textNotif;
    if (noAbsenMembers.length > 0) {
      textNotif =
        `📋 *List of Members Who Haven't Checked In:*\n\n${noAbsenMembers.join("\n")}\n\n` +
        `⏳ *${noAbsenMembers.length} members have not checked in today.*`;
    } else {
      textNotif = "✅ All members have checked in today. / جميع الأعضاء قد سجلوا حضورهم اليوم";
    }

    // Send message with mentions / إرسال الرسالة مع الإشارة
    await sendMessageWithMention(
      sock,
      remoteJid,
      textNotif,
      message,
      senderType
    );
  } catch (error) {
    console.error("Error handling listnoabsen:", error);
    await sock.sendMessage(
      remoteJid,
      {
        text: "⚠️ An error occurred while displaying members who haven't checked in. / حدث خطأ أثناء عرض الأعضاء الذين لم يحضروا",
      },
      { quoted: message }
    );
  }
}

module.exports = {
  handle,
  Commands: ["listnoabsen"], // Command name / اسم الأمر
  OnlyPremium: false,         // Not restricted to premium users / ليس مقتصرًا على المستخدمين المميزين
  OnlyOwner: false,           // Not restricted to owner / ليس مقتصرًا على المالك
};