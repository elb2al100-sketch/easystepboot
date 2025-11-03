const {
  sendMessageWithMention, // To send message with mention / لإرسال رسالة مع ذكر
  getCurrentTime,         // Get current time / الحصول على الوقت الحالي
  getCurrentDate,         // Get current date / الحصول على التاريخ الحالي
  reply,                  // Reply to messages / الرد على الرسائل
} = require("@lib/utils");

const { getGroupMetadata } = require("@lib/cache"); // Get group metadata / الحصول على بيانات المجموعة
const { sendImageAsSticker } = require("@lib/exif"); // Send image as sticker / إرسال الصورة كملصق
const { checkMessage } = require("@lib/participants"); // Check for existing template / التحقق من وجود قالب معين
const mess = require("@mess"); // Predefined messages / رسائل جاهزة
const config = require("@config"); // Bot configuration / إعدادات البوت
const fs = require("fs");

async function handle(sock, messageInfo) {
  const { m, remoteJid, sender, message, isQuoted, senderType } = messageInfo;

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
        { text: mess.general.isAdmin }, // ⚠️ Only admin can use this command / ⚠️ فقط المشرف يمكنه استخدام هذا الأمر
        { quoted: message }
      );
      return;
    }

    // Validate that user replied to a message / التحقق من أن المستخدم رد على رسالة
    if (!isQuoted) {
      return await reply(
        m,
        "⚠️ _Reply to a text order / الرجاء الرد على أمر نصي_"
      );
    }

    // Check custom "setproses" template / التحقق من وجود قالب "setproses"
    const first_checksetdone = await checkMessage(remoteJid, "setproses");

    // Get current date and time / الحصول على التاريخ والوقت الحالي
    const date = getCurrentDate();
    const time = getCurrentTime();

    // Group name / اسم المجموعة
    const groupName = groupMetadata.subject || "Group / المجموعة";

    // Prepare note from quoted message / تحضير الملاحظة من الرسالة المقتبسة
    const note = isQuoted.content?.caption ? isQuoted.content.caption : isQuoted.text;

    // Quoted sender mention / ذكر المرسل الذي اقتبس
    const quotedSender = `@${isQuoted.sender.split("@")[0]}`;

    if (first_checksetdone) {
      // If custom "setproses" template exists / إذا كان هناك قالب "setproses" مخصص
      try {
        if (first_checksetdone.endsWith(".webp")) {
          // Send as sticker / إرسال كملصق
          const buffer = fs.readFileSync(first_checksetdone);

          const options = {
            packname: config.sticker_packname, // Sticker pack name / اسم حزمة الملصقات
            author: config.sticker_author,     // Author name / اسم المؤلف
          };

          await sendImageAsSticker(sock, remoteJid, buffer, options, message);
          return;
        } else {
          // Replace placeholders with actual values / استبدال المتغيرات بالقيم الفعلية
          const messageSetdone = first_checksetdone
            .replace(/@time/g, time)
            .replace(/@tanggal/g, date)
            .replace(/@grub/g, groupName)
            .replace(/@catatan/g, note)
            .replace(/@sender/g, quotedSender);

          await sendMessageWithMention(sock, remoteJid, messageSetdone, message, senderType);
          return;
        }
      } catch (error) {
        console.error("Error processing setproses:", error);
      }
    }

    // Default pending transaction message / الرسالة الافتراضية للمعاملة قيد التنفيذ
    const templateMessage = `_*TRANSACTION PENDING ✅ / المعاملة قيد التنفيذ ✅*_  

⏰ Time / الوقت : ${time} WIB  
📅 Date / التاريخ : ${date}  
📂 Group / المجموعة : ${groupName}  
📝 Note / الملاحظة : ${note}

${quotedSender} _Thank you for your order! / شكراً على طلبك_`;

    // Send message with mention / إرسال الرسالة مع Mention
    await sendMessageWithMention(sock, remoteJid, templateMessage, message, senderType);

  } catch (error) {
    console.error("An error occurred / حدث خطأ:", error);
  }
}

module.exports = {
  handle,
  Commands: ["proses"],   // Command name / اسم الأمر
  OnlyPremium: false,      // Available to all users / متاح لجميع المستخدمين
  OnlyOwner: false,        // Not limited to owner / لا يقتصر على المالك
};