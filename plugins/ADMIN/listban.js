const mess = require("@mess"); 
// Template messages / قوالب الرسائل
const { getUserBlockList } = require("@lib/group"); 
// Function to get blocked users in the group / دالة لجلب قائمة الأعضاء المحظورين في المجموعة
const { getGroupMetadata } = require("@lib/cache"); 
// Function to get group metadata / دالة للحصول على بيانات المجموعة
const { sendMessageWithMention } = require("@lib/utils"); 
// Function to send message with mentions / دالة لإرسال الرسائل مع الإشارة

async function handle(sock, messageInfo) {
  const { remoteJid, isGroup, message, sender, senderType } = messageInfo;

  if (!isGroup) return; // Only for groups / مخصص للمجموعات فقط

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

  try {
    // Get list of banned users / جلب قائمة الأعضاء المحظورين
    const listBaned = await getUserBlockList(remoteJid);

    if (listBaned.length > 0) {
      // Format banned members list / تنسيق قائمة الأعضاء المحظورين
      const memberList = listBaned
        .map((member) => `◧ @${member.split("@")[0]}`)
        .join("\n");

      const textNotif = `📋 *LIST BAN: ${listBaned.length}*\n\n${memberList}`;
      
      // Send message with mentions / إرسال الرسالة مع الإشارة
      await sendMessageWithMention(
        sock,
        remoteJ