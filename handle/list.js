// Import required libraries / استيراد المكتبات المطلوبة
const { getDataByGroupId } = require("@lib/list"); // Get list data by group ID / الحصول على بيانات القائمة حسب معرف المجموعة
const fs = require("fs").promises; // File system promises / مكتبة نظام الملفات
const {
  getCurrentDate,
  sendMessageWithMention,
  sendImagesWithMention,
  getCurrentTime,
  getGreeting,
  getHari,
} = require("@lib/utils"); // Utility functions / دوال مساعدة
const { getGroupMetadata } = require("@lib/cache"); // Get cached group metadata / الحصول على بيانات المجموعة المخزنة مؤقتًا
const config = require("@config"); // Configuration / إعدادات
const { sendImageAsSticker } = require("@lib/exif"); // Send image as sticker / إرسال الصورة كملصق
const chalk = require("chalk"); // Console styling / لتنسيق الطباعة على الكونسول
const { logTracking } = require("@lib/utils"); // Logging function / دالة لتسجيل التتبع

// Object to track last message timestamps per group / كائن لتتبع آخر وقت إرسال رسالة لكل مجموعة
const lastMessageTime = {};

// Main list handler function / الدالة الرئيسية لمعالجة القوائم
async function process(sock, messageInfo) {
  const { remoteJid, sender, isGroup, message, fullText, senderType } =
    messageInfo;

  if (!isGroup || !fullText) return true; // Skip if not a group or no text / تخطي إذا لم تكن رسالة من مجموعة أو لا يوجد نص

  try {
    const keyword = fullText.trim(); // Get the trimmed text / الحصول على النص بعد إزالة الفراغات
    if (!keyword) return;

    const currentList = await getDataByGroupId(remoteJid); 
    // Get current list for the group / الحصول على القائمة الحالية للمجموعة
    if (!currentList) return;

    const searchResult = Object.keys(currentList.list).filter(
      (item) => item.toLowerCase().trim() === keyword.toLowerCase().trim()
    ); 
    // Search for exact keyword match / البحث عن تطابق النص بالضبط

    if (searchResult.length === 0) return; // No match found / لا يوجد تطابق

    // RATE LIMIT
    const now = Date.now();
    if (lastMessageTime[remoteJid]) {
      if (now - lastMessageTime[remoteJid] < config.rate_limit) {
        console.log(chalk.redBright(`Rate limit list : ${keyword}`)); 
        // Rate limit reached / تم الوصول إلى الحد المسموح به
        return false;
      }
    }
    lastMessageTime[remoteJid] = now; // Update last message timestamp / تحديث آخر وقت إرسال رسالة

    const { text, media } = currentList.list[searchResult[0]].content; 
    // Get text and media from list / الحصول على النص والوسائط من القائمة

    const groupMetadata = await getGroupMetadata(sock, remoteJid); 
    // Fetch group metadata / الحصول على بيانات المجموعة
    if (!groupMetadata) {
      console.error("Failed to fetch group metadata"); // Log error / تسجيل خطأ
      return;
    }

    const { subject, desc, size } = groupMetadata; // Group info / معلومات المجموعة
    const date = getCurrentDate(); // Current date / التاريخ الحالي
    const time = getCurrentTime(); // Current time / الوقت الحالي
    const greeting = getGreeting(); // Greeting message / رسالة التحية
    const day = getHari(); // Current day / اليوم الحالي
    const targetMention = `@${sender.split("@")[0]}`; // Mention sender / الإشارة إلى المرسل

    // Prepare replacements for placeholders / تحضير القيم لاستبدال العناصر النائبة
    const replacements = {
      "@name": targetMention,
      "@date": date,
      "@day": day,
      "@desc": desc,
      "@group": subject,
      "@greeting": greeting,
      "@size": size,
      "@time": time,
      "@sender": targetMention,
    };

    let customizedMessage = text; // Original message text / نص الرسالة الأصلي
    for (const [key, value] of Object.entries(replacements)) {
      const regex = new RegExp(key.replace(/@/, "@"), "gi");
      customizedMessage = customizedMessage.replace(regex, value); 
      // Replace placeholders with actual values / استبدال العناصر النائبة بالقيم الفعلية
    }

    if (media) {
      const buffer = await getMediaBuffer(media); // Read media file / قراءة ملف الوسائط
      if (buffer) {
        if (media.includes("webp")) {
          const options = {
            packname: config.sticker_packname,
            author: config.sticker_author,
          };
          await sendImageAsSticker(sock, remoteJid, buffer, options, message); 
          // Send sticker / إرسال ملصق
        } else if (media.includes("mp4")) {
          await sock.sendMessage(
            remoteJid,
            {
              video: buffer,
              mimetype: "video/mp4",
              caption: customizedMessage || "",
            },
            { quoted: message }
          ); // Send video / إرسال فيديو
        } else if (media.includes("audio")) {
          await sock.sendMessage(
            remoteJid,
            { audio: buffer, mimetype: "audio/mp4" },
            { quoted: message }
          ); // Send audio / إرسال صوت
        } else if (
          media.includes("jpg") ||
          media.includes("jpeg") ||
          media.includes("png")
        ) {
          await sendImagesWithMention(
            sock,
            remoteJid,
            buffer,
            customizedMessage,
            message,
            senderType
          ); // Send image with mention / إرسال صورة مع ذكر
        } else {
          await sock.sendMessage(
            remoteJid,
            { document: buffer, fileName: media, mimetype: "application/zip" },
            { quoted: message }
          ); // Send other files / إرسال ملفات أخرى
        }
        logTracking(`List Handler - ${sender}`); // Log the action / تسجيل الحدث
      } else {
        console.error(`Media not found or failed to read: ${media}`); 
        // Media file not found / الملف غير موجود أو فشل في القراءة
      }
      return false; // Stop further processing / إيقاف المعالجة الإضافية
    } else {
      await sendMessageWithMention(
        sock,
        remoteJid,
        customizedMessage,
        message,
        senderType
      ); // Send text message with mention / إرسال رسالة نصية مع ذكر
      return false;
    }
    return false;
  } catch (error) {
    console.error("Error processing message:", error); // Log any errors / تسجيل أي أخطاء
  }
}

// Helper function to get media buffer / دالة مساعدة للحصول على محتوى الوسائط
async function getMediaBuffer(mediaFileName) {
  const filePath = `./database/media/${mediaFileName}`;
  try {
    return await fs.readFile(filePath); // Read media file / قراءة ملف الوسائط
  } catch (error) {
    console.error(`Failed to read media file: ${filePath}`, error); 
    // Log error / تسجيل خطأ
    return null;
  }
}

// Export the plugin module / تصدير وحدة البرنامج المساعد
module.exports = {
  name: "List Handle", // Plugin name / اسم البرنامج المساعد
  priority: 1, // Plugin priority / أولوية البرنامج المساعد
  process, // Process function / دالة المعالجة
};