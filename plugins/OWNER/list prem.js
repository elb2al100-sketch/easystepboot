const { readUsers } = require("@lib/users");
const { sendMessageWithMention } = require("@lib/utils");

async function handle(sock, messageInfo) {
  const { remoteJid, sender, message, senderType } = messageInfo;

  try {
    const users = await readUsers();

    // Filter only users who have a premium attribute and it's still valid
    // تصفية المستخدمين الذين لديهم اشتراك Premium وساري المفعول
    const premiumUsers = Object.entries(users)
      .filter(
        ([, value]) => value.premium && new Date(value.premium) > new Date()
      )
      .map(([key, value]) => ({ jid: key, ...value }));

    if (premiumUsers.length === 0) {
      // No premium users found / لا يوجد مستخدمون لديهم Premium حالياً
      return await sock.sendMessage(
        remoteJid,
        { text: "⚠️ No premium users at the moment / لا يوجد مستخدمون لديهم Premium حالياً." },
        { quoted: message }
      );
    }

    // Format the list of premium users / تنسيق قائمة المستخدمين الذين لديهم Premium
    const premiumList = premiumUsers
      .map(
        (user) =>
          `◧ @${user.jid.split("@")[0]} (Premium until: ${new Date(
            user.premium
          ).toLocaleDateString()} / Premium حتى: ${new Date(
            user.premium
          ).toLocaleDateString()})`
      )
      .join("\n");

    const textNotif = `📋 *LIST PREMIUM / قائمة المشتركين Premium:*\n\n${premiumList}\n\n_Total / الإجمالي:_ *${premiumUsers.length}*`;

    // Send message with mention to premium users / إرسال الرسالة مع منشن للمستخدمين Premium
    await sendMessageWithMention(
      sock,
      remoteJid,
      textNotif,
      message,
      senderType
    );
  } catch (error) {
    console.error("Error fetching users:", error);
    await sock.sendMessage(
      remoteJid,
      { text: "❌ An error occurred while processing user data / حدث خطأ أثناء معالجة بيانات المستخدمين." },
      { quoted: message }
    );
  }
}

module.exports = {
  handle,
  Commands: ["listprem", "listpremium"],
  OnlyPremium: false,
  OnlyOwner: true,
};