// استدعاء الرسائل العامة من ملف الرسائل / Import global message templates
const mess = require("@mess");

// استدعاء دالة لجلب بيانات المجموعة من الكاش / Import function to get group metadata from cache
const { getGroupMetadata } = require("@lib/cache");

// استدعاء أدوات المساعدة لإرسال الرسائل مع الإشارة وتتبع السجلات / Import utilities for message sending and tracking
const { sendMessageWithMention, logTracking } = require("@lib/utils");

async function handle(sock, messageInfo) {
  const { remoteJid, message, isGroup, sender, senderType } = messageInfo;

  // ✅ تحقق مما إذا كان الأمر يعمل فقط داخل المجموعات
  // ✅ Check if the command is group-only
  if (!isGroup) {
    const groupOnlyMessage = { text: mess.game.isGroup };
    return sock.sendMessage(remoteJid, groupOnlyMessage, { quoted: message });
  }

  try {
    // 🧾 تسجيل تتبع لملف اللعبة عند استدعاء بيانات المجموعة
    // 🧾 Log tracking for this feature when group metadata is fetched
    logTracking(`jadian.js - groupMetadata (${remoteJid})`);

    // 🔍 جلب بيانات المجموعة مثل الاسم والمشاركين
    // 🔍 Fetch group metadata such as name and participants
    const groupMetadata = await getGroupMetadata(sock, remoteJid);

    if (!groupMetadata) {
      console.error("فشل في جلب بيانات المجموعة / Failed to fetch group metadata");
      return;
    }

    const groupName = groupMetadata.subject; // 🏷️ اسم المجموعة / Group name
    const participants = groupMetadata.participants; // 👥 قائمة الأعضاء / Participants list

    // 🎲 اختيار شخص عشوائي من المجموعة (مع استثناء المرسل)
    // 🎲 Randomly select a participant (excluding the sender)
    let randomParticipant;
    do {
      randomParticipant =
        participants[Math.floor(Math.random() * participants.length)];
    } while (randomParticipant.id === sender);

    // 💬 مجموعة من الرسائل المضحكة أو العشوائية لعرضها
    // 💬 Funny or creative random messages to display
    const randomMessages = [
      "Cocok banget, jodoh sejati! 😍💖 Jangan lupa kasih tau teman-teman kalian yang lagi cari jodoh!", // مثاليين لبعض! 😍💖 لا تنسوا تخبروا أصدقائكم اللي لسه بيدوروا على حب!
      "Hati-hati, jangan sampai kalian baper ya! 😜", // احذروا لا تتأثروا بالمشاعر 😂
      "Wah, ini sih pasangan yang bikin iri banyak orang! 💕", // يا سلام! أنتم الثنائي اللي يخلي الناس تغار 💕
      "Saling cocok, jangan sampai lepas! 💘", // أنتم متناسقين جدًا، لا تفرّطوا ببعض 💘
      "Kalian cocok banget, siap-siap jadi couple goals! 🔥", // أنتم مثاليين! جاهزين تصيروا مثال الثنائي المثالي 🔥
      "Jangan lupa ngajak mereka jalan bareng ya! 🚶‍♂️🚶‍♀️", // لا تنسوا تطلعوا سوا قريبًا 😄
      "Buat kalian yang jomblo, jangan khawatir! Mungkin jodoh masih nunggu! 😂", // واللي لسه عازب لا تقلق، الحب في الطريق 😂
    ];

    // 🔀 اختيار رسالة عشوائية من القائمة / Pick a random message from the list
    const randomMessage =
      randomMessages[Math.floor(Math.random() * randomMessages.length)];

    // ❤️ تكوين الرسالة النهائية التي تحتوي على منشن للطرفين
    // ❤️ Create the final message mentioning both users
    const jadianMessage = `@${sender.split("@")[0]} ❤️ @${
      randomParticipant.id.split("@")[0]
    } \n\n${randomMessage}`;

    // 📤 إرسال الرسالة مع الإشارة إلى المستخدمين / Send the message with mentions
    await sendMessageWithMention(
      sock,
      remoteJid,
      jadianMessage,
      message,
      senderType
    );
  } catch (error) {
    console.error("خطأ أثناء جلب بيانات المجموعة / Error fetching group metadata:", error);
    const errorMessage = {
      text: "Terjadi kesalahan saat mengambil data grup. / حدث خطأ أثناء جلب بيانات المجموعة.",
    };
    await sock.sendMessage(remoteJid, errorMessage, { quoted: message });
  }
}

// 📦 تصدير الوحدة مع بيانات الأوامر / Export module with command details
module.exports = {
  handle,
  Commands: ["jadian"], // الأمر المستخدم / Command trigger
  OnlyPremium: false,   // ليس حصريًا للمستخدمين المميزين / Not premium-only
  OnlyOwner: false,     // ليس خاصًا بالمالك / Not owner-only
};