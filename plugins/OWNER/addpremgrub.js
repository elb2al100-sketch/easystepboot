const { findUser, updateUser, addUser } = require("@lib/users");
const { sendMessageWithMention, determineUser } = require("@lib/utils");
const { getGroupMetadata } = require("@lib/cache");

// Flag to prevent overlapping process
// علم لمنع تنفيذ العمليات المتداخلة
let inProccess = false;

async function handle(sock, messageInfo) {
  const { remoteJid, message, sender, content, prefix, command, senderType } =
    messageInfo;

  try {
    // If a process is already running, notify the user
    // إذا كانت هناك عملية جارية بالفعل، أرسل إشعارًا
    if (inProccess) {
      await sendMessageWithMention(
        sock,
        remoteJid,
        `_⚠️ A process is currently running, please wait until it finishes._\n_⚠️ العملية جارية، يرجى الانتظار حتى الانتهاء_`,
        message,
        senderType
      );
      return;
    }

    // Validate input
    // التحقق من المدخلات
    if (!content || content.trim() === "") {
      const tex = `_⚠️ Usage Format:_ \n\n_💬 Example:_ \n_*${
        prefix + command
      }*_ https://chat.whatsapp.com/xxx 30`;
      return await sock.sendMessage(
        remoteJid,
        { text: tex },
        { quoted: message }
      );
    }

    let [linkgrub, jumlahHariPremium] = content.split(" ");

    // Validate group link and premium days
    // التحقق من الرابط وعدد أيام البريميوم
    if (!linkgrub.includes("chat.whatsapp.com") || isNaN(jumlahHariPremium)) {
      const tex = `⚠️ _Ensure correct format:_ ${
        prefix + command
      } https://chat.whatsapp.com/xxx 30\n⚠️ تأكد من صحة الصياغة`;
      return await sock.sendMessage(
        remoteJid,
        { text: tex },
        { quoted: message }
      );
    }

    // Send loading reaction
    // إرسال رد فعل التحميل
    await sock.sendMessage(remoteJid, {
      react: { text: "⏰", key: message.key },
    });

    inProccess = true;
    jumlahHariPremium = parseInt(jumlahHariPremium);

    const idFromGc = linkgrub.split("https://chat.whatsapp.com/")[1];

    // Query to get group ID
    // طلب للحصول على معرف المجموعة
    const res = await sock.query({
      tag: "iq",
      attrs: { type: "get", xmlns: "w:g2", to: "@g.us" },
      content: [{ tag: "invite", attrs: { code: idFromGc } }],
    });

    if (!res.content[0]?.attrs?.id) {
      const tex = `⚠️ _Invalid group link or ensure bot is already joined_\n⚠️ الرابط غير صالح أو تأكد أن البوت موجود في المجموعة`;
      return await sock.sendMessage(
        remoteJid,
        { text: tex },
        { quoted: message }
      );
    }

    const groupId = res.content[0].attrs.id + "@g.us";

    // Get group metadata
    // الحصول على بيانات المجموعة
    const groupMetadata = await getGroupMetadata(sock, groupId);
    const participants = groupMetadata.participants;

    let successCount = 0;
    let failedCount = 0;
    let totalsize = participants.length;

    // Loop through all group members
    // التكرار على جميع أعضاء المجموعة
    for (const [index, member] of participants.entries()) {
      try {
        const id_users = member.id;

        // Fetch user data
        // جلب بيانات المستخدم
        let userData = await findUser(id_users);

        // Calculate new premium time from today
        // حساب مدة البريميوم الجديدة من اليوم
        const currentDate = new Date();
        currentDate.setDate(currentDate.getDate() + jumlahHariPremium);

        // If user does not exist, add new user
        // إذا لم يكن المستخدم موجودًا، أضف مستخدم جديد
        if (!userData) {
          userData = {
            money: 0,
            role: "user",
            status: "active",
            premium: currentDate.toISOString(), // Save premium end time
          };
          await addUser(id_users, userData);
        }

        // Update premium
        // تحديث وقت البريميوم
        userData.premium = currentDate.toISOString();
        await updateUser(id_users, userData);

        successCount++;
      } catch (error) {
        console.error(`Failed to add premium for ${member.id}:`, error);
        failedCount++;
      }
    }

    inProccess = false;

    // Send result message
    // إرسال رسالة بالنتيجة
    const responseText = `✅ Successfully added ${successCount} users to premium members.\n❌ Failed: ${failedCount}\n✅ تم إضافة ${successCount} مستخدم للبريميوم.\n❌ فشل: ${failedCount}`;
    await sendMessageWithMention(
      sock,
      remoteJid,
      responseText,
      message,
      senderType
    );
  } catch (error) {
    console.error("Error processing premium addition:", error);
    inProccess = false;
    await sock.sendMessage(
      remoteJid,
      { text: "❌ An error occurred while processing the data. / حدث خطأ أثناء معالجة البيانات." },
      { quoted: message }
    );
  }
}

module.exports = {
  handle,
  Commands: ["addpremgrub", "addpremiumgrub"],
  OnlyPremium: false,
  OnlyOwner: true, // Only owner can access
};