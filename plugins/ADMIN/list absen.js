const { findAbsen } = require("@lib/absen"); 
// Function to get attendance data / دالة للحصول على بيانات الحضور
const { sendMessageWithMention } = require("@lib/utils"); 
// Send message with mentions / إرسال رسالة مع الإشارة
const mess = require("@mess"); 
// Template messages / قوالب الرسائل
const { getGroupMetadata } = require("@lib/cache"); 
// Get group metadata / الحصول على بيانات المجموعة

async function handle(sock, messageInfo) {
  const { remoteJid, isGroup, message, sender, senderType } = messageInfo;
  if (!isGroup) return; // Only for groups / مخصص للمجموعات فقط

  try {
    // Get group metadata / الحصول على بيانات المجموعة
    const groupMetadata = await getGroupMetadata(sock, remoteJid);
    const participants = groupMetadata.participants;
    const totalMembers = participants.length; // Total members in group / إجمالي أعضاء المجموعة

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

    // Get attendance data for the group / جلب بيانات الحضور للمجموعة
    const data = await findAbsen(remoteJid);

    let textNotif;

    if (data && data.member.length > 0) {
      const absenteesCount = data?.member?.length || 0; // Number of members who attended / عدد الأعضاء الذين حضروا
      const remainingCount = totalMembers - absenteesCount; // Number of members who haven't attended yet / عدد الأعضاء الذين لم يحضروا بعد

      // Create numbered list of members who attended / إنشاء قائمة مرقمة بالأعضاء الذين حضروا
      const memberList = data.member
        .map((member, index) => `${index + 1}. @${member.split("@")[0]}`)
        .join("\n");

      textNotif =
        `📋 *Today's Attendance List:*\n\n${memberList}\n\n` +
        `✔️ *${absenteesCount} members have attended.*\n` +
        `⏳ *${remainingCount} members have not attended yet.* / لم يحضر بعد ${remainingCount} عضو`;
    } else {
      // If no members have attended yet / إذا لم يحضر أي عضو بعد
      textNotif =
        "⚠️ No one has attended today yet. / لم يحضر أحد اليوم بعد\n" +
        `⏳ *${totalMembers} members have not attended yet.* / لم يحضر بعد ${totalMembers} عضو`;
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
    console.error("Error handling listabsen:", error);

    // Send error message / إرسال رسالة خطأ
    await sock.sendMessage(
      remoteJid,
      { text: "⚠️ An error occurred while displaying the attendance list. / حدث خطأ أثناء عرض قائمة الحضور" },
      { quoted: message }
    );
  }
}

module.exports = {
  handle,
  Commands: ["listabsen"], // Command name / اسم الأمر
  OnlyPremium: false,       // Not restricted to premium users / ليس مقتصرًا على المستخدمين المميزين
  OnlyOwner: false,         // Not restricted to owner / ليس مقتصرًا على المالك
};