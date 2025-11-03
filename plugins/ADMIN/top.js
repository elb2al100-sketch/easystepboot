const { sendMessageWithMention } = require("@lib/utils");
// Import helper function to send a message with mentions
// استدعاء دالة مساعدة لإرسال رسالة مع عمل منشن للأعضاء

const { readUsers } = require("@lib/users");
// Import function to read user data
// استدعاء دالة لقراءة بيانات المستخدمين

const { getGroupMetadata } = require("@lib/cache");
// Import function to get group metadata
// استدعاء دالة للحصول على بيانات المجموعة

const mess = require("@mess");
// Import predefined messages
// استدعاء الرسائل الجاهزة

async function handle(sock, messageInfo) {
  const { remoteJid, isGroup, message, sender, senderType } = messageInfo;
  
  if (!isGroup) return; // Only Group
  // فقط للمجموعات
  

  try {
    // Get group metadata
    // الحصول على بيانات المجموعة
    const groupMetadata = await getGroupMetadata(sock, remoteJid);
    const participants = groupMetadata.participants;

    // Check if sender is an admin
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

    // Read user data from database or file
    // قراءة بيانات المستخدمين من قاعدة البيانات أو ملف
    const dataUsers = await readUsers();

    // Sort users by money (descending) and get top 10
    // ترتيب المستخدمين حسب المال (تنازلي) وأخذ أفضل 10
    const topUsers = Object.entries(dataUsers)
      .sort(([, a], [, b]) => b.money - a.money) // Sort by money
      .slice(0, 10); // Take top 10 users

    // Format user list
    // تنسيق قائمة المستخدمين
    const memberList = topUsers
      .map(
        ([id, userData], index) =>
          `┣ ⌬ @${id.split("@")[0]} - 💰 Money: ${userData.money}`
      )
      .join("\n");

    const textNotif = `┏━『 *TOP 10 MEMBER* 』\n┣\n${memberList}\n┗━━━━━━━━━━━━━━━`;
    // Notification text with top 10 users
    // نص الإشعار لأفضل 10 أعضاء

    // Send message with mentions
    // إرسال الرسالة مع عمل منشن للأعضاء
    await sendMessageWithMention(
      sock,
      remoteJid,
      textNotif,
      message,
      senderType
    );
  } catch (error) {
    console.error("Error in handle:", error);
    // Handle error and send message
    // معالجة الخطأ وإرسال رسالة
    await sock.sendMessage(
      remoteJid,
      { text: "⚠️ An error occurred while showing the user list. / حدث خطأ أثناء عرض قائمة المستخدمين." },
      { quoted: message }
    );
  }
}

module.exports = {
  handle,
  Commands: ["top"],
  OnlyPremium: false,
  OnlyOwner: false,
};