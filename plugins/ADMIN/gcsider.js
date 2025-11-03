const { sendMessageWithMention } = require("@lib/utils");
// Function to send messages mentioning users / دالة لإرسال رسالة مع ذكر المستخدمين
const mess = require("@mess");
// Template messages / قوالب الرسائل
const { getActiveUsers } = require("@lib/users");
// Function to get active users / دالة لجلب المستخدمين النشطين
const { getGroupMetadata } = require("@lib/cache");
// Function to get group metadata / دالة لجلب بيانات المجموعة

const TOTAL_HARI_SIDER = 30; // Max inactive days / الحد الأقصى لعدد الأيام الغير نشطة

async function handle(sock, messageInfo) {
  const { remoteJid, isGroup, message, sender, senderType } = messageInfo;
  if (!isGroup) return; // Only for groups / مخصص للمجموعات فقط

  try {
    // Get group metadata / الحصول على بيانات المجموعة
    const groupMetadata = await getGroupMetadata(sock, remoteJid);
    const { participants, size } = groupMetadata;

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

    // Get active users in the last TOTAL_HARI_SIDER days / جلب المستخدمين النشطين في آخر TOTAL_HARI_SIDER يوم
    const listNotSider = await getActiveUsers(TOTAL_HARI_SIDER);

    // Check if there are no inactive members in the group / التحقق إذا لم يوجد أعضاء غير نشطين
    if (listNotSider.length === 0) {
      return await sock.sendMessage(
        remoteJid,
        { text: "📋 _No inactive members in this group._\n📋 لا يوجد أعضاء غير نشطين في هذه المجموعة." },
        { quoted: message }
      );
    }

    // List of inactive members in the group / قائمة الأعضاء الغائبين أو غير النشطين
    const memberList = participants
      .filter(
        (participant) =>
          !listNotSider.some((active) => active.id === participant.id)
      ) // Only take members not in active list / فقط الأعضاء غير الموجودين في قائمة النشطين
      .map((participant) => `◧ @${participant.id.split("@")[0]}`) // Format output / صيغة عرض الأعضاء
      .join("\n");

    // Count inactive members / عدد الأعضاء الغائبين
    const countSider = participants.filter(
      (participant) =>
        !listNotSider.some((active) => active.id === participant.id)
    ).length;

    // Message text / نص الرسالة
    const teks_sider = `_*${countSider} of ${participants.length}* Members of Group ${groupMetadata.subject} are inactive_
        
_*Reason:*_
➊ _Not active for more than ${TOTAL_HARI_SIDER} days / لم ينشط لأكثر من ${TOTAL_HARI_SIDER} يوم_
➋ _Joined but never participated / انضم ولم يشارك أبدًا_

_Please be active in the group, as members may be cleaned up anytime / يرجى النشاط في المجموعة لأنه سيتم تنظيف الأعضاء في أي وقت_

_*List of inactive members / قائمة الأعضاء غير النشطين*_
${memberList}`;

    // Send message with mentions / إرسال رسالة مع ذكر الأعضاء
    await sendMessageWithMention(
      sock,
      remoteJid,
      teks_sider,
      message,
      senderType
    );
  } catch (error) {
    console.error("Error handling listalluser:", error);
    await sock.sendMessage(
      remoteJid,
      { text: "⚠️ Failed to display all group members / فشل في عرض جميع أعضاء المجموعة." },
      { quoted: message }
    );
  }
}

module.exports = {
  handle,
  Commands: ["gcsider"],
  OnlyPremium: false, // Available to all users / متاح لجميع المستخدمين
  OnlyOwner: false,   // Not restricted to owner / ليس مقتصرًا على المالك
};