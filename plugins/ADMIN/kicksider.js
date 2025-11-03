const mess = require("@mess"); 
// Template messages / قوالب الرسائل
const config = require("@config"); 
// Bot configuration / إعدادات البوت
const { getActiveUsers } = require("@lib/users"); 
// Get list of active users / جلب قائمة المستخدمين النشطين
const { sendMessageWithMention } = require("@lib/utils"); 
// Send message with mentions / إرسال رسالة مع الإشارة
const { getGroupMetadata } = require("@lib/cache"); 
// Get group metadata / الحصول على بيانات المجموعة

const TOTAL_HARI_SIDER = 30; // Total days to consider inactive / الحد الأقصى لعدد الأيام لاعتبار العضو غير نشط
const DELAY_KICK = 3000; // Delay between kicks in ms / التأخير بين كل طرد بالمللي ثانية

let inProccess = false; // Flag to prevent multiple simultaneous kicks / مؤشر لمنع تنفيذ الطرد أكثر من مرة في نفس الوقت

async function handle(sock, messageInfo) {
  const { remoteJid, isGroup, message, sender, content, senderType } = messageInfo;
  if (!isGroup) return; // Only for groups / مخصص للمجموعات فقط

  try {
    // Get group metadata / الحصول على بيانات المجموعة
    const groupMetadata = await getGroupMetadata(sock, remoteJid);
    const participants = groupMetadata.participants;

    // Check if sender is admin / التحقق من أن المرسل مشرف
    const isAdmin = participants.some((p) => p.id === sender && p.admin);
    if (!isAdmin) {
      await sock.sendMessage(remoteJid, { text: mess.general.isAdmin }, { quoted: message });
      return;
    }

    // Prevent multiple simultaneous kick processes / منع تكرار تنفيذ الطرد
    if (inProccess) {
      await sendMessageWithMention(
        sock,
        remoteJid,
        `_Member Sider cleaning process is ongoing, please wait until it finishes._ / عملية تنظيف الأعضاء الغائبين جارية، يرجى الانتظار حتى الانتهاء`,
        message,
        senderType
      );
      return;
    }

    // Get list of active users / جلب قائمة الأعضاء النشطين
    const listNotSider = await getActiveUsers(TOTAL_HARI_SIDER);

    // Filter out active users, get inactive members / تصفية الأعضاء النشطين للحصول على الأعضاء الغائبين
    const memberList = participants
      .filter((p) => !listNotSider.some((active) => active.id === p.id))
      .map((p) => p.id);

    const countSider = memberList.length;
    const totalMember = participants.length;

    if (countSider === 0) {
      return await sock.sendMessage(
        remoteJid,
        { text: "📋 _No Sider members in this group._ / لا يوجد أعضاء غائبين في هذه المجموعة" },
        { quoted: message }
      );
    }

    const input = content.toLowerCase().trim();

    // Handle input: all or number / معالجة الإدخال: all أو رقم
    if (input === "all" || (!isNaN(input) && Number(input) > 0)) {
      const jumlahKick =
        input === "all"
          ? memberList.length
          : Math.min(Number(input), memberList.length);

      // React with ⏰ to indicate processing / رمز ساعة للإشارة إلى أن العملية جارية
      await sock.sendMessage(remoteJid, {
        react: { text: "⏰", key: message.key },
      });
      inProccess = true;

      let successCount = 0;
      let failedCount = 0;

      // Kick members with delay / طرد الأعضاء مع تأخير
      for (const [index, member] of memberList.entries()) {
        if (index >= jumlahKick) break;
        await new Promise((resolve) => setTimeout(resolve, DELAY_KICK));

        if (member === `${config.phone_number_bot}@s.whatsapp.net`) continue; // Skip bot itself / تجاهل البوت

        try {
          await sock.groupParticipantsUpdate(remoteJid, [member], "remove");
          successCount++;
        } catch (error) {
          failedCount++;
        }
      }

      inProccess = false;

      // Send result message / إرسال رسالة النتيجة
      if (successCount === jumlahKick) {
        await sendMessageWithMention(
          sock,
          remoteJid,
          `_Successfully kicked ${successCount} Sider members._ / تم طرد ${successCount} عضو غائب بنجاح`,
          message,
          senderType
        );
      } else {
        await sendMessageWithMention(
          sock,
          remoteJid,
          `_Successfully kicked ${successCount} of ${jumlahKick} Sider members._ / تم طرد ${successCount} من ${jumlahKick} عضو غائب`,
          message,
          senderType
        );
      }

      return;
    }

    // Default info if no valid argument / رسالة معلومات افتراضية إذا لم يتم إدخال قيمة صحيحة
    await sendMessageWithMention(
      sock,
      remoteJid,
      `_Total Sider members: *${countSider}* of ${totalMember} in ${groupMetadata.subject}._\n\n_To proceed kicking, type:_ / إجمالي الأعضاء الغائبين: *${countSider}* من ${totalMember} في ${groupMetadata.subject}\n• *.kicksider all* — kick all / لطرد الجميع\n• *.kicksider <number>* — kick some / لطرد جزء\n\nExample: *.kicksider 5* / مثال: *.kicksider 5*`,
      message,
      senderType
    );
  } catch (error) {
    console.error("Error handling kick sider command:", error);

    await sock.sendMessage(
      remoteJid,
      { text: "⚠️ An error occurred while processing your request. / حدث خطأ أثناء معالجة طلبك" },
      { quoted: message }
    );
  }
}

module.exports = {
  handle,
  Commands: ["kicksider"], // Command name / اسم الأمر
  OnlyPremium: false,       // Not restricted to premium users / ليس مقتصرًا على المستخدمين المميزين
  OnlyOwner: false,         // Not restricted to owner / ليس مقتصرًا على المالك
};