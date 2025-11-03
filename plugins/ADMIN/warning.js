const batasPeringatan = 3;
// Maximum warning limit
// الحد الأقصى للتحذيرات

const mess = require("@mess");
// Import predefined messages
// استدعاء الرسائل الجاهزة

const { getGroupMetadata } = require("@lib/cache");
// Import function to get group metadata
// استدعاء دالة للحصول على بيانات المجموعة

const { sendMessageWithMention, determineUser } = require("@lib/utils");
// Import helper functions for sending messages with mentions and determining user
// استدعاء دوال مساعدة لإرسال الرسائل مع منشنات وتحديد المستخدم

// Warning list stored in memory (RAM)
// قائمة التحذيرات مخزنة في الذاكرة (RAM)
const warningList = {};

async function handle(sock, messageInfo) {
  const {
    remoteJid,
    isGroup,
    message,
    sender,
    content,
    prefix,
    command,
    mentionedJid,
    isQuoted,
    senderType,
  } = messageInfo;

  if (!isGroup) return; // Only for groups
  // فقط للمجموعات

  // Get group metadata
  // الحصول على بيانات المجموعة
  const groupMetadata = await getGroupMetadata(sock, remoteJid);
  const participants = groupMetadata.participants;

  // Check if sender is admin
  // التحقق إذا كان المرسل مشرف في المجموعة
  const isAdmin = participants.some((p) => p.id === sender && p.admin);
  if (!isAdmin) {
    await sock.sendMessage(
      remoteJid,
      { text: mess.general.isAdmin },
      { quoted: message }
    );
    return;
  }

  // Internal RAM debug for warning list
  // فحص داخلي لقائمة التحذيرات في الذاكرة
  if (command === "debugwarn") {
    console.log("🔧 Debug warningList:", warningList);
    return await sock.sendMessage(
      remoteJid,
      {
        text: "📦 Debug log sent to console. / سجل التصحيح تم إرساله إلى الكونسول.",
      },
      { quoted: message }
    );
  }

  // Display list of warnings
  // عرض قائمة التحذيرات
  if (command === "listwarning" || command === "listwarn") {
    let warningText = "⚠️ *Warning List: / قائمة التحذيرات:*\n\n";
    let mentions = [];
    let found = false;

    for (const user in warningList) {
      if (warningList[user] > 0) {
        warningText += `👤 @${user.split("@")[0]}: ${
          warningList[user]
        }/${batasPeringatan} warning(s) / تحذير\n`;
        mentions.push(user);
        found = true;
      }
    }

    if (!found)
      warningText =
        "✅ No user has warnings. / لا يوجد مستخدم لديه تحذيرات.";

    await sock.sendMessage(
      remoteJid,
      {
        text: warningText,
        mentions: mentions,
      },
      { quoted: message }
    );
    return;
  }

  // Delete user's warning
  // حذف تحذير المستخدم
  if (command === "deletewarning" || command === "delwarning") {
    const userToDelete = determineUser(mentionedJid, isQuoted, content);
    if (!userToDelete) {
      return await sock.sendMessage(
        remoteJid,
        {
          text: `_⚠️ Usage Format:_ \n\n_💬 Example:_ *${
            prefix + command
          } 628xxxx* / صيغة الاستخدام: *${
            prefix + command
          } 628xxxx*`,
        },
        { quoted: message }
      );
    }

    if (warningList[userToDelete]) {
      delete warningList[userToDelete];
      await sendMessageWithMention(
        sock,
        remoteJid,
        `✅ Warning for @${userToDelete.split("@")[0]} has been removed. / تم حذف التحذير للمستخدم @${userToDelete.split("@")[0]}.`,
        message,
        senderType
      );
    } else {
      await sendMessageWithMention(
        sock,
        remoteJid,
        `❌ @${userToDelete.split("@")[0]} has no warnings. / لا يوجد للمستخدم @${userToDelete.split("@")[0]} أي تحذيرات.`,
        message,
        senderType
      );
    }
    return;
  }

  // If the command is warn
  // إذا كان الأمر تحذير
  if (command === "warn" || command === "warning") {
    const userToWarn = determineUser(mentionedJid, isQuoted, content);
    if (!userToWarn) {
      return await sock.sendMessage(
        remoteJid,
        {
          text: `_⚠️ Usage Format:_ \n\n_💬 Example:_ *${
            prefix + command
          } 628xxxx* / صيغة الاستخدام: *${
            prefix + command
          } 628xxxx*`,
        },
        { quoted: message }
      );
    }

    const whatsappJid = userToWarn;

    try {
      // Increase warning count
      // زيادة عدد التحذيرات
      warningList[whatsappJid] = (warningList[whatsappJid] || 0) + 1;

      // Check if user reached the limit
      // التحقق إذا وصل المستخدم للحد الأقصى
      if (warningList[whatsappJid] >= batasPeringatan) {
        await sendMessageWithMention(
          sock,
          remoteJid,
          `❌ @${whatsappJid.split("@")[0]} has reached the warning limit and will be removed from the group. / وصل المستخدم @${whatsappJid.split("@")[0]} للحد الأقصى من التحذيرات وسيتم إزالته من المجموعة.`,
          message,
          senderType
        );
        await sock.groupParticipantsUpdate(remoteJid, [whatsappJid], "remove");
        delete warningList[whatsappJid];
        return;
      }

      await sendMessageWithMention(
        sock,
        remoteJid,
        `⚠️ @${whatsappJid.split("@")[0]} has been warned (${warningList[whatsappJid]}/${batasPeringatan}) / تم تحذير المستخدم (${warningList[whatsappJid]}/${batasPeringatan})`,
        message,
        senderType
      );
    } catch (error) {
      console.error(error);
      await sendMessageWithMention(
        sock,
        remoteJid,
        `❌ Cannot warn number @${whatsappJid.split("@")[0]} / لا يمكن تحذير المستخدم @${whatsappJid.split("@")[0]}`,
        message,
        senderType
      );
    }
  }
}

module.exports = {
  handle,
  Commands: [
    "warn",
    "warning",
    "listwarning",
    "listwarn",
    "deletewarning",
    "delwarning",
    "debugwarn",
  ],
  OnlyPremium: false,
  OnlyOwner: false,
};