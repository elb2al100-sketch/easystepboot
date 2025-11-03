const { checkMessage } = require("@lib/participants");
const ApiAutoresbot = require("api-autoresbot");
const axios = require("axios");
const config = require("@config");
const {
  logWithTime,
  getCurrentDate,
  sendMessageWithMentionNotQuoted,
  sendImagesWithMentionNotQuoted,
  getCurrentTime,
  getGreeting,
  getHari,
  logTracking,
  getSenderType,
} = require("@lib/utils");
const { getGroupMetadata, getProfilePictureUrl } = require("@lib/cache");
const { findGroup } = require("@lib/group");
const { updateUser, findUser } = require("@lib/users");

/**
 * Get welcome image buffer from Autoresbot API
 * الحصول على صورة الترحيب من API Autoresbot
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
    // Request the image as arraybuffer
    // إرسال الطلب للحصول على الصورة بصيغة ArrayBuffer
    const response = await axios.post(`${url}${endpoint}`, options, {
      responseType: "arraybuffer",
    });
    return Buffer.from(response.data); // Return buffer
  } catch (error) {
    console.error("Error fetching welcome buffer:", error.message);
    return null;
  }
}

/**
 * Handle blacklist detection for participants
 * التعامل مع كشف القائمة السوداء للمشاركين
 */
async function handleDetectBlackList(sock, remoteJid, sender) {
  try {
    const statusJid = getSenderType(sender);
    // Get group settings from database
    // جلب إعدادات المجموعة من قاعدة البيانات
    const dataGroupSettings = await findGroup(remoteJid);
    if (!dataGroupSettings) return true;

    const { fitur } = dataGroupSettings;
    if (!fitur.detectblacklist && !fitur.detectblacklist2) return true;

    const user = await findUser(sender);
    if (!user) return true;

    const { status } = user;

    if (status === "blacklist") {
      // Send warning message if detectblacklist is enabled
      // إرسال تحذير إذا كانت detectblacklist مفعلة
      if (fitur.detectblacklist) {
        const warningMessage = `⚠️ _Blacklist Warning_\n\n@${
          sender.split("@")[0]
        } has been blacklisted.`;
        logTracking(`Participant Update - Blacklist Warning (${sender})`);
        await sendMessageWithMentionNotQuoted(
          sock,
          remoteJid,
          warningMessage,
          statusJid
        );
      }

      // Kick user if detectblacklist2 is enabled
      // طرد العضو إذا كانت detectblacklist2 مفعلة
      if (fitur.detectblacklist2) {
        logTracking(
          `Participant Update - Blacklist2 warning and kick (${sender})`
        );
        await sock.groupParticipantsUpdate(remoteJid, [sender], "remove");
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
 * Handle active group features (welcome, left, promote, demote)
 * التعامل مع ميزات المجموعة النشطة (ترحيب، خروج، ترقية، تنزيل)
 */
async function handleActiveFeatures(sock, messageInfo, settingGroups) {
  const { id, action, participants, store } = messageInfo;

  if (!id || !action || !participants || participants.length === 0) {
    console.error("Invalid message information provided");
    return;
  }

  const {
    promote = false,
    demote = false,
    welcome = false,
    left = false,
  } = settingGroups;

  const targetNumber = participants[0];
  const targetMention = `@${targetNumber.split("@")[0]}`;
  const api = new ApiAutoresbot(config.APIKEY);
  const statusJid = getSenderType(targetNumber);

  // Check if user is blacklisted
  // التحقق مما إذا كان المستخدم موجودًا في القائمة السوداء
  const isBlacklist = await handleDetectBlackList(sock, id, targetNumber);
  if (!isBlacklist) return false;

  // Check which features are active in group settings
  // التحقق من الميزات النشطة في إعدادات المجموعة
  const actions = {
    promote: promote,
    demote: demote,
    remove: left,
    add: welcome,
  };
  if (!actions[action]) {
    logWithTime("SYSTEM", `Feature ${action} is not active`);
    return;
  }

  const result = await checkMessage(id, action);
  if (!result) return;

  // Determine type of welcome message
  // تحديد نوع رسالة الترحيب
  let typeWelcome;
  const templatewelcome = await checkMessage(id, "templatewelcome");
  if (templatewelcome) {
    typeWelcome = templatewelcome;
  } else {
    typeWelcome = config.typewelcome;
  }

  // Get group metadata and profile pictures
  // جلب بيانات المجموعة وصور الملفات الشخصية
  const groupMetadata = await getGroupMetadata(sock, id);
  if (!groupMetadata) {
    console.error("Failed to fetch group metadata");
    return;
  }
  const ppUser = await getProfilePictureUrl(sock, targetNumber);
  const ppGroup = await getProfilePictureUrl(sock, id);
  const contact = store.contacts[targetNumber];

  const pushName =
    contact?.verifiedName ||
    contact?.notify ||
    (typeof targetNumber === "string" ? targetNumber.split("@")[0] : "Unknown");

  const { subject, desc, size } = groupMetadata;
  const date = getCurrentDate();
  const time = getCurrentTime();
  const greeting = getGreeting();
  const day = getHari();

  // Replacement variables for template
  // المتغيرات المستخدمة لاستبدال القالب
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

  // Send text for promote, demote, remove actions
  // إرسال النصوص للأحداث promote, demote, remove
  if (["promote", "demote", "remove"].includes(action)) {
    if (actions[action]) {
      logTracking(`Participant Update - Send text to (${id})`);
      await sendMessageWithMentionNotQuoted(
        sock,
        id,
        customizedMessage,
        statusJid
      );
    }
    return;
  }

  // Send welcome message if action is 'add' and welcome feature is active
  // إرسال رسالة الترحيب إذا كانت العملية 'add' والميزة مفعلة
  if (action === "add" && welcome) {
    if (typeWelcome === "random") {
      const randomTypes = ["1", "2", "3", "4", "5", "6", "text"];
      typeWelcome = randomTypes[Math.floor(Math.random() * randomTypes.length)];
    }

    if (typeWelcome === "text") {
      logTracking(`Participant Update - Send text to (${id})`);
      await sendMessageWithMentionNotQuoted(
        sock,
        id,
        customizedMessage,
        statusJid
      );
      return;
    }

    // Fetch image buffer from API
    // جلب صورة الترحيب من API
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
      await sendImagesWithMentionNotQuoted(
        sock,
        id,
        buffer,
        customizedMessage,
        statusJid
      );
    } else {
      console.warn("Unhandled typewelcome or missing buffer");
    }
    return;
  }
}

module.exports = { handleActiveFeatures };