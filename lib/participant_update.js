const { checkMessage } = require("@lib/participants"); // Check participant messages | التحقق من رسائل المشاركين
const ApiAutoresbot = require("api-autoresbot"); // Autoresbot API | واجهة برمجة تطبيقات Autoresbot
const axios = require("axios"); // HTTP client | مكتبة التعامل مع HTTP
const config = require("@config"); // Configuration file | ملف الإعدادات

const {
  logWithTime, // Custom logging with timestamp | تسجيل مخصص مع الطابع الزمني
  getCurrentDate, // Get current date | الحصول على التاريخ الحالي
  sendMessageWithMentionNotQuoted, // Send text mentioning user without quoting | إرسال رسالة مع الإشارة بدون اقتباس
  sendImagesWithMentionNotQuoted, // Send image mentioning user without quoting | إرسال صورة مع الإشارة بدون اقتباس
  getCurrentTime, // Get current time | الحصول على الوقت الحالي
  getGreeting, // Get greeting based on time | الحصول على التحية حسب الوقت
  getHari, // Get current day | الحصول على اليوم الحالي
  logTracking, // Tracking logs | تتبع السجلات
  getSenderType, // Get type of sender | معرفة نوع المرسل
} = require("@lib/utils");

const { getGroupMetadata, getProfilePictureUrl } = require("@lib/cache"); // Group metadata and profile pictures | بيانات المجموعات وصور البروفايل
const { findGroup } = require("@lib/group"); // Find group data | العثور على بيانات المجموعة
const { updateUser, findUser } = require("@lib/users"); // User management | إدارة المستخدمين

/**
 * Generate welcome image buffer from API
 * توليد صورة ترحيب من API
 */
async function getWelcomeBuffer(api, type, options) {
  const endpoints = {
    1: "/api/maker/welcome1",
    2: "/api/maker/welcome2",
    3: "/api/maker/welcome3",
    4: "/api/maker/welcome4",
    5: "/api/maker/welcome5",
    6: "/api/maker/welcome6",
    7: "/api/maker/welcome7",
  };

  const url = "https://api.autoresbot.com";
  const endpoint = endpoints[type];
  if (!endpoint) return null;

  try {
    const response = await axios.post(`${url}${endpoint}`, options, {
      responseType: "arraybuffer", // Return data as buffer | إعادة البيانات كـ buffer
    });
    return Buffer.from(response.data);
  } catch (error) {
    console.error("Error fetching welcome buffer:", error.message);
    return null;
  }
}

/**
 * Handle blacklist detection
 * معالجة الكشف عن القوائم السوداء
 */
async function handleDetectBlackList(sock, remoteJid, sender) {
  try {
    const statusJid = getSenderType(sender);
    const dataGroupSettings = await findGroup(remoteJid); // Get group settings | الحصول على إعدادات المجموعة
    if (!dataGroupSettings) return true;

    const { fitur } = dataGroupSettings; // Features enabled in group | الميزات المفعلة في المجموعة
    if (!fitur.detectblacklist && !fitur.detectblacklist2) return true;

    const user = await findUser(sender);
    if (!user) return true;

    const { status } = user;

    if (status === "blacklist") {
      if (fitur.detectblacklist) {
        const warningMessage = `⚠️ _Blacklist Warning_\n\n@${
          sender.split("@")[0]
        } has been blacklisted.`;
        logTracking(`Participant Update - Blacklist Warning (${sender})`);
        await sendMessageWithMentionNotQuoted(sock, remoteJid, warningMessage, statusJid);
      }

      if (fitur.detectblacklist2) {
        logTracking(`Participant Update - Blacklist2 Kick (${sender})`);
        await sock.groupParticipantsUpdate(remoteJid, [sender], "remove"); // Kick user | طرد المستخدم
        return false;
      }
    }
    return true;
  } catch (error) {
    console.error("Error handling blacklist detection:", error);
    return true;
  }
}

/**
 * Handle group participant updates (add/remove/promote/demote)
 * معالجة تحديثات المشاركين في المجموعة
 */
async function handleActiveFeatures(sock, messageInfo, settingGroups) {
  const { id, action, participants, store } = messageInfo;

  if (!id || !action || !participants || participants.length === 0) {
    console.error("Invalid message information provided | معلومات الرسالة غير صالحة");
    return;
  }

  const { promote = false, demote = false, welcome = false, left = false } = settingGroups;

  const targetNumber = participants[0];
  const targetMention = `@${targetNumber.split("@")[0]}`;
  const api = new ApiAutoresbot(config.APIKEY);
  const statusJid = getSenderType(targetNumber);

  const isBlacklist = await handleDetectBlackList(sock, id, targetNumber);
  if (!isBlacklist) return false;

  // Check group settings | تحقق من إعدادات المجموعة
  const actions = { promote, demote, remove: left, add: welcome };
  if (!actions[action]) {
    logWithTime("SYSTEM", `Feature ${action} is not active | الميزة ${action} غير مفعلة`);
    return;
  }

  const result = await checkMessage(id, action); // Get custom message for action | الحصول على رسالة مخصصة للعملية
  if (!result) return;

  // Determine welcome type | تحديد نوع الترحيب
  let typeWelcome;
  const templatewelcome = await checkMessage(id, "templatewelcome");
  typeWelcome = templatewelcome || config.typewelcome;

  const groupMetadata = await getGroupMetadata(sock, id);
  if (!groupMetadata) {
    console.error("Failed to fetch group metadata | فشل في جلب بيانات المجموعة");
    return;
  }

  const ppUser = await getProfilePictureUrl(sock, targetNumber); // User profile picture | صورة بروفايل المستخدم
  const ppGroup = await getProfilePictureUrl(sock, id); // Group profile picture | صورة المجموعة
  const contact = store.contacts[targetNumber];

  const pushName = contact?.verifiedName || contact?.notify || targetNumber.split("@")[0] || "Unknown";

  const { subject, desc, size } = groupMetadata;
  const date = getCurrentDate();
  const time = getCurrentTime();
  const greeting = getGreeting();
  const day = getHari();

  const replacements = {
    "@name": targetMention,
    "@date": date,
    "@day": day,
    "@desc": desc,
    "@group": subject,
    "@greeting": greeting,
    "@size": size,
    "@time": time,
  };

  let customizedMessage = result;
  for (const [key, value] of Object.entries(replacements)) {
    const regex = new RegExp(key.replace(/@/, "@"), "gi");
    customizedMessage = customizedMessage.replace(regex, value);
  }

  // Handle promote/demote/remove messages | معالجة الرسائل للترقية/الخفض/الإزالة
  if (["promote", "demote", "remove"].includes(action)) {
    if (actions[action]) {
      logTracking(`Participant Update - Send text to (${id})`);
      await sendMessageWithMentionNotQuoted(sock, id, customizedMessage, statusJid);
    }
    return;
  }

  // Handle new member welcome | معالجة الترحيب بالأعضاء الجدد
  if (action === "add" && welcome) {
    if (typeWelcome === "random") {
      const randomTypes = ["1", "2", "3", "4", "5", "6", "text"];
      typeWelcome = randomTypes[Math.floor(Math.random() * randomTypes.length)];
    }

    if (typeWelcome === "text") {
      logTracking(`Participant Update - Send text to (${id})`);
      await sendMessageWithMentionNotQuoted(sock, id, customizedMessage, statusJid);
      return;
    }

    const buffer = await getWelcomeBuffer(api, typeWelcome, {
      pp: ppUser,
      name: pushName,
      gcname: subject,
      member: size,
      ppgc: ppGroup,
      desk: desc,
      bg: config.bgwelcome2,
    });

    if (buffer) {
      logTracking(`Participant Update - Send Image to (${id})`);
      await sendImagesWithMentionNotQuoted(sock, id, buffer, customizedMessage, statusJid);
    } else {
      console.warn("Unhandled typewelcome or missing buffer | نوع الترحيب غير معالج أو ال buffer مفقود");
    }
    return;
  }
}

module.exports = { handleActiveFeatures }; // Export the handler | تصدير الدالة