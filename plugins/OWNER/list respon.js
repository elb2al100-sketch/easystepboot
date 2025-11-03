const { getDataByGroupId } = require("@lib/list");
const { sendMessageWithMention } = require("@lib/utils");

async function handle(sock, messageInfo) {
  const { remoteJid, message, senderType } = messageInfo;

  try {
    // Get the custom response list for the owner
    // جلب قائمة الردود المخصصة للـOwner
    const currentList = await getDataByGroupId("owner");

    // If there is no list / إذا لم توجد قائمة
    if (!currentList || !currentList.list) {
      await sock.sendMessage(remoteJid, {
        text: "⚠️ _No response list found, type *addrespon* to create one_\n\n_Only *owner* can add or remove responses_\n⚠️ _لا توجد قائمة ردود، اكتب *addrespon* لإنشاء واحدة_\n\n_يمكن فقط للـ*Owner* إضافة أو حذف الردود_",
      });
      return;
    }

    const keywordList = Object.keys(currentList.list);

    if (keywordList.length === 0) {
      await sock.sendMessage(remoteJid, {
        text: "⚠️ _No response list found, type *addrespon* to create one_\n\n_Only *owner* can add or remove responses_\n⚠️ _لا توجد قائمة ردود، اكتب *addrespon* لإنشاء واحدة_\n\n_يمكن فقط للـ*Owner* إضافة أو حذف الردود_",
      });
    } else {
      const formattedList = keywordList
        .map((keyword) => `◧ ${keyword.toUpperCase()}`)
        .join("\n");

      // Template message / قالب الرسالة
      const templateMessage = `╭✄ *HERE IS THE RESPONSE LIST / فيما يلي قائمة الردود*\n\n${formattedList}\n╰──────────◇`;

      // Send message with mention / إرسال الرسالة مع منشن
      await sendMessageWithMention(
        sock,
        remoteJid,
        templateMessage,
        message,
        senderType
      );
    }
  } catch (error) {
    console.error(error);
    // Optional: Send error message to user / إرسال رسالة خطأ للمستخدم (اختياري)
    await sock.sendMessage(remoteJid, {
      text: "❌ An error occurred while fetching the response list / حدث خطأ أثناء جلب قائمة الردود.",
    }, { quoted: message });
  }
}

module.exports = {
  handle,
  Commands: ["listrespon"],
  OnlyPremium: false,
  OnlyOwner: true,
};