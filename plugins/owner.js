const { sendMessageWithMention } = require("@lib/utils");
const { listOwner } = require("@lib/users");
const config = require("@config");

/**
 * Handle the "owner" command
 * معالجة أمر "المالك"
 */
async function handle(sock, messageInfo) {
  const { remoteJid, message, sender, senderType } = messageInfo;

  // Get the list of owners from the database
  // الحصول على قائمة المالكين من قاعدة البيانات
  const data = await listOwner();

  let list = [];
  let no = 1;

  for (const item of data) {
    // Prepare vCard for each owner
    // تحضير بطاقة vCard لكل مالك
    const vcard = `BEGIN:VCARD
VERSION:3.0
N:Owner ${no}
FN:Owner ${no}
TEL;waid=${item.split("@")[0]}:${item.split("@")[0]}
EMAIL;type=INTERNET:${config.owner_email}
URL:https://autoresbot.com
ADR:;;${config.region};;;
END:VCARD`;

    list.push({
      displayName: `Owner ${no}`, // Owner display name / اسم المالك للعرض
      vcard: vcard,
    });
    no++;
  }

  // If no owners are registered
  // إذا لم يكن هناك مالكين مسجلين
  if (data.length === 0) {
    return await sendMessageWithMention(
      sock,
      remoteJid,
      "Owner belum terdaftar! / لم يتم تسجيل أي مالك!",
      message,
      senderType
    );
  }

  // Send contact message
  // إرسال رسالة تحتوي على جهات الاتصال
  const chatId = await sock.sendMessage(
    remoteJid,
    {
      contacts: {
        displayName: data,
        contacts: list,
      },
    },
    { quoted: message }
  );

  // Send message with mention
  // إرسال رسالة مع منشن
  await sendMessageWithMention(
    sock,
    remoteJid,
    `Hai Kak @${sender.split("@")[0]}, berikut adalah daftar owner bot ini / مرحباً @${sender.split("@")[0]}، هذه قائمة مالكي هذا البوت`,
    chatId,
    senderType
  );
}

// Export module
// تصدير الوحدة
module.exports = {
  handle,
  Commands: ["owner"],  // Command trigger / الكلمات المفتاحية للأمر
  OnlyPremium: false,    // Not limited to premium users / غير مقتصر على المستخدمين المميزين
  OnlyOwner: false,      // Not limited to owner / غير مقتصر على المالك
};