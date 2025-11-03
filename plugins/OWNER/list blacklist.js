const { readUsers } = require("@lib/users");
const { sendMessageWithMention } = require("@lib/utils");

async function handle(sock, messageInfo) {
  const { remoteJid, sender, message, senderType } = messageInfo;

  try {
    const users = await readUsers();

    // Filter only users with status 'blacklist' / تصفية المستخدمين الذين وضعوا في القائمة السوداء
    const blockedUsers = Object.entries(users)
      .filter(([key, value]) => value.status === "blacklist")
      .map(([key, value]) => ({ jid: key, ...value }));

    if (blockedUsers.length === 0) {
      // No users are blacklisted / لا يوجد مستخدمون في القائمة السوداء حالياً
      return await sock.sendMessage(
        remoteJid,
        { text: "⚠️ No users are blacklisted at the moment / لا يوجد مستخدمون محظورون حالياً." },
        { quoted: message }
      );
    }

    // Format the list of blocked users / تنسيق قائمة المستخدمين المحظورين
    const blockedList = blockedUsers
      .map((user, index) => `◧ @${user.jid.split("@")[0]}`)
      .join("\n");

    const textNotif = `📋 *BLACKLIST / القائمة السوداء:*\n\n${blockedList}\n\n_Total / الإجمالي:_ *${blockedUsers.length}*`;

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
  Commands: ["listblacklist"],
  OnlyPremium: false,
  OnlyOwner: true,
};