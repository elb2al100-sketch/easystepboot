const {
  sendMessageWithMention,
  getCurrentTime,
  getCurrentDate,
  reply,
  getSenderType,
} = require("@lib/utils");
const { getGroupMetadata } = require("@lib/cache");
const { sendImageAsSticker } = require("@lib/exif");
const { checkMessage } = require("@lib/participants");
const mess = require("@mess");
const config = require("@config");
const fs = require("fs");

async function handle(sock, messageInfo) {
  const { m, remoteJid, sender, message, isQuoted } = messageInfo;

  try {
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
        { text: "⚠️ You must be an admin to use this command. / يجب أن تكون مشرفًا لاستخدام هذا الأمر" },
        { quoted: message }
      );
      return;
    }

    // Validate if message is a reply / التحقق من أن الرسالة رد
    if (!isQuoted) {
      return await reply(m, "⚠️ _Reply to a text order message / قم بالرد على رسالة نصية_");
    }

    // Check if a custom "setdone" template exists / التحقق من وجود قالب مخصص "setdone"
    const first_checksetdone = await checkMessage(remoteJid, "setdone");

    // Get current date and time / الحصول على التاريخ والوقت الحالي
    const date = getCurrentDate();
    const time = getCurrentTime();

    const groupName = groupMetadata.subject || "Group / المجموعة";

    // Get note from quoted message / الحصول على الملاحظة من الرسالة المقتبسة
    const note = isQuoted.content?.caption
      ? isQuoted.content.caption
      : isQuoted.text;

    const quotedSender = `@${isQuoted.sender.split("@")[0]}`;
    const statusJid = getSenderType(isQuoted.sender);

    if (first_checksetdone) {
      try {
        if (first_checksetdone.endsWith(".webp")) {
          // Send as sticker / إرسال كستكر
          const buffer = fs.readFileSync(first_checksetdone);
          const options = {
            packname: config.sticker_packname,
            author: config.sticker_author,
          };
          await sendImageAsSticker(sock, remoteJid, buffer, options, message);
          return;
        } else {
          // Replace placeholders with real values / استبدال العناصر النائبة بالقيم الحقيقية
          const messageSetdone = first_checksetdone
            .replace(/@time/g, time)
            .replace(/@tanggal/g, date)
            .replace(/@grub/g, groupName)
            .replace(/@catatan/g, note)
            .replace(/@sender/g, quotedSender);

          await sendMessageWithMention(
            sock,
            remoteJid,
            messageSetdone,
            message,
            statusJid
          );
          return;
        }
      } catch (error) {
        console.error("Error processing setdone / خطأ في معالجة setdone:", error);
      }
    }

    // Default success message template / قالب الرسالة الافتراضية لإتمام الطلب
    const templateMessage = `_*TRANSACTION SUCCESSFUL 「 ✅ 」 / العملية ناجحة 「 ✅ 」*_

⏰ Time / الوقت      : ${time} WIB
📅 Date / التاريخ     : ${date}
📂 Group / المجموعة   : ${groupName}
📝 Note / الملاحظة    : ${note}

${quotedSender} _Thank you for your order! / شكرًا على طلبك!_`;

    // Send message with mention / إرسال الرسالة مع التنويه للمرسل
    await sendMessageWithMention(
      sock,
      remoteJid,
      templateMessage,
      message,
      statusJid
    );
  } catch (error) {
    console.error("Error occurred / حدث خطأ:", error);
  }
}

module.exports = {
  handle,
  Commands: ["done", "d", "selesai"],
  OnlyPremium: false,
  OnlyOwner: false,
};