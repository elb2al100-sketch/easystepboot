const mess = require("@mess");
// Import predefined messages
// استدعاء الرسائل الجاهزة

const { getTotalChatPerGroup } = require("@lib/totalchat");
// Import function to get total chat per group
// استدعاء دالة للحصول على إجمالي الرسائل لكل مجموعة

const { sendMessageWithMention } = require("@lib/utils");
// Import helper function to send message with mentions
// استدعاء دالة مساعدة لإرسال رسالة مع عمل منشن للأعضاء

const { getGroupMetadata } = require("@lib/cache");
// Import function to get group metadata
// استدعاء دالة للحصول على بيانات المجموعة

async function handle(sock, messageInfo) {
  const { remoteJid, message, sender, isGroup, senderType } = messageInfo;
  if (!isGroup) return; // Only for groups
  // فقط للمجموعات

  try {
    // Get group metadata
    // الحصول على بيانات المجموعة
    const groupMetadata = await getGroupMetadata(sock, remoteJid);
    const participants = groupMetadata.participants;

    // Check if sender is admin
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

    // Get total chat per group
    // الحصول على إجمالي الرسائل لكل عضو في المجموعة
    const totalChatData = await getTotalChatPerGroup(remoteJid);

    // Merge participants with their chat count
    // دمج بيانات الأعضاء مع عدد الرسائل لكل عضو
    const chatWithParticipants = participants.map((participant) => ({
      id: participant.id,
      totalChat: totalChatData[participant.id] || 0,
    }));

    if (chatWithParticipants.length === 0) {
      return await sock.sendMessage(
        remoteJid,
        { text: "_No chat data available for this group._ / لا توجد بيانات رسائل لهذه المجموعة." },
        { quoted: message }
      );
    }

    // Calculate total chat in the group
    // حساب إجمالي الرسائل في المجموعة
    const totalChatCount = chatWithParticipants.reduce(
      (sum, p) => sum + p.totalChat,
      0
    );

    // Sort members by total chat
    // ترتيب الأعضاء حسب عدد الرسائل
    const sortedMembers = chatWithParticipants.sort(
      (a, b) => b.totalChat - a.totalChat
    );

    // Format message to send
    // تنسيق الرسالة للإرسال
    let response = `══✪〘 *👥 Total Chat* 〙✪══:\n\n`;
    sortedMembers.forEach(({ id, totalChat }, index) => {
      response += `◧  @${id.split("@")[0]}: ${totalChat} chat\n`;
    });

    response += `\n\n📊 _Total chat in this group:_ *${totalChatCount}* / إجمالي الرسائل في هذه المجموعة`;

    // Send message with mentions
    // إرسال الرسالة مع عمل منشن للأعضاء
    await sendMessageWithMention(
      sock,
      remoteJid,
      response,
      message,
      senderType
    );
  } catch (error) {
    console.error("Error handling total chat command:", error);
    return await sock.sendMessage(
      remoteJid,
      { text: "⚠️ An error occurred while processing your request. / حدث خطأ أثناء معالجة طلبك." },
      { quoted: message }
    );
  }
}

module.exports = {
  handle,
  Commands: ["totalchat"],
  OnlyPremium: false,
  OnlyOwner: false,
};