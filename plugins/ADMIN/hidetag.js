const mess = require("@mess"); 
// Template messages / قوالب الرسائل
const { downloadQuotedMedia, downloadMedia } = require("@lib/utils"); 
// Functions to download media / دوال لتحميل الوسائط
const fs = require("fs").promises; 
// Node.js File System module / وحدة نظام الملفات
const { getGroupMetadata } = require("@lib/cache"); 
// Get group metadata / جلب بيانات المجموعة
const { sendImageAsSticker } = require("@lib/exif"); 
// Function to send sticker / دالة لإرسال ستكر
const { isOwner } = require("@lib/users"); 
// Check if user is owner / التحقق من أن المستخدم مالك
const config = require("@config"); 
// Bot configuration / إعدادات البوت

// Get text from media content / استخراج النص من محتوى الوسائط
function getMediaContent(media) {
  if (media.type === "video" || media.type === "image") {
    return media.content.caption; // caption for image/video / التعليق للصورة أو الفيديو
  }
  return media.content || media.text; // text content for other types / محتوى النص للوسائط الأخرى
}

async function handle(sock, messageInfo) {
  const { remoteJid, isGroup, message, sender, content, isQuoted, type } = messageInfo;
  if (!isGroup) return; // Only for groups / مخصص للمجموعات فقط

  try {
    // Get group metadata / الحصول على بيانات المجموعة
    const groupMetadata = await getGroupMetadata(sock, remoteJid);
    const participants = groupMetadata.participants;

    // Check if sender is admin / التحقق من أن المرسل مشرف
    const isAdmin = participants.some(participant => participant.id === sender && participant.admin);
    const isOwnerUsers = await isOwner(sender); // Check if sender is owner / التحقق من أن المرسل مالك

    if (!isAdmin && !isOwnerUsers) {
      await sock.sendMessage(remoteJid, { text: mess.general.isAdmin }, { quoted: message });
      return;
    }

    // Download media / تحميل الوسائط
    const media = isQuoted
      ? await downloadQuotedMedia(message) // from quoted message / من الرسالة المقتبسة
      : await downloadMedia(message); // from current message / من الرسالة الحالية

    const mediaType = isQuoted ? `${isQuoted.type}Message` : `${type}Message`;
    let mediaContent = "";

    if (isQuoted) {
      mediaContent = getMediaContent(isQuoted);
    }

    if (content && content.trim() !== "") {
      mediaContent = content.trim(); // override content if exists / استبدال النص إذا كان موجود
    }

    // Send media or text / إرسال وسائط أو نص
    if (media) {
      const mediaPath = `tmp/${media}`;
      await checkFileExists(mediaPath); // Validate file exists / التأكد من وجود الملف
      await sendMedia(sock, remoteJid, mediaType, mediaPath, mediaContent, message, participants);
    } else {
      await sendTextMessage(sock, remoteJid, mediaContent, message, participants);
    }
  } catch (error) {
    console.error("Error:", error.message);
    await sendTextMessage(sock, remoteJid, "⚠️ An error occurred: " + error.message, message, participants);
  }
}

// Validate if file exists / التحقق من وجود الملف
async function checkFileExists(path) {
  try {
    await fs.access(path);
  } catch {
    throw new Error(`Media file not found / الملف غير موجود: ${path}`);
  }
}

// Send text message with mentions / إرسال نص مع الإشارة لجميع الأعضاء
async function sendTextMessage(sock, remoteJid, text, quoted, participants) {
  text = typeof text === "string" ? text : "";
  await sock.sendMessage(remoteJid, { text: text, mentions: participants.map((p) => p.id) }, { quoted });
}

// Send media message / إرسال وسائط
async function sendMedia(sock, remoteJid, type, mediaPath, caption, message, participants) {
  const mediaOptions = {
    audioMessage: { audio: await fs.readFile(mediaPath) },
    imageMessage: { image: await fs.readFile(mediaPath), caption, mentions: participants.map(p => p.id) },
    videoMessage: { video: await fs.readFile(mediaPath), caption, mentions: participants.map(p => p.id) },
    documentMessage: { document: await fs.readFile(mediaPath), caption, mentions: participants.map(p => p.id) },
    stickerMessage: { stickerMessage: await fs.readFile(mediaPath), caption, mentions: participants.map(p => p.id) },
  };

  const options = mediaOptions[type];
  if (!options) throw new Error(`Unsupported media type / نوع الوسائط غير مدعوم: ${type}`);

  // If sticker, send with pack info / إذا كان ستكر، أرسل مع معلومات الحزمة
  if (type == "stickerMessage") {
    const options2 = {
      packname: config.sticker_packname,
      author: config.sticker_author,
      mentions: options.mentions,
    };
    const buffer = options.stickerMessage;
    await sendImageAsSticker(sock, remoteJid, buffer, options2, message);
    return;
  }
  await sock.sendMessage(remoteJid, options, { quoted: message });
}

module.exports = {
  handle,
  Commands: ["hidetag", "h", "hidetak"], // Command aliases / أسماء الأوامر
  OnlyPremium: false, // Available to all users / متاح لجميع المستخدمين
  OnlyOwner: false, // Not restricted to owner / ليس مقتصرًا على المالك
};