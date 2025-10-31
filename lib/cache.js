let groupCache = {}; // 🇬🇧 Cache for group metadata
                      // 🇸🇦 ذاكرة تخزين مؤقتة لبيانات المجموعات
let profilePictureCache = {}; // 🇬🇧 Cache for profile pictures
                               // 🇸🇦 ذاكرة تخزين مؤقتة لصور الملف الشخصي
let groupFetchCache = {}; // 🇬🇧 Cache for global group participation
                           // 🇸🇦 ذاكرة تخزين مؤقتة لمشاركة المجموعات
const sessions = new Map(); // 🇬🇧 Active sessions storage
                             // 🇸🇦 تخزين الجلسات النشطة

const DEFAULT_PROFILE_PICTURE_URL =
  "https://api.autoresbot.com/api/maker/pp-default"; // 🇬🇧 Default profile picture
                                                     // 🇸🇦 الصورة الافتراضية للملف الشخصي
const CACHE_TIME = 60; // menit // 🇬🇧 Cache duration in minutes
const CACHE_METADATA = CACHE_TIME * 60000; // 🇬🇧 Cache metadata duration in ms
const CACHE_groupFetch = CACHE_TIME * 60000; // 🇬🇧 Cache group fetch duration
const { logTracking } = require("@lib/utils");

// 🇬🇧 Get group metadata and cache it
// 🇸🇦 الحصول على بيانات المجموعة وتخزينها في الكاش
const getGroupMetadata = async (sock, remoteJid) => {
  // 🇬🇧 Skip if broadcast
  // 🇸🇦 تخطي إذا كان بثًا
  if (
    remoteJid.endsWith("@status.broadcast") ||
    remoteJid.endsWith("@broadcast")
  ) {
    console.warn(`Skipping metadata for broadcast: ${remoteJid}`);
    return null;
  }

  if (!groupCache[remoteJid]) {
    try {
      logTracking(`Cache.js - groupMetadata1 (${remoteJid})`);
      const metadata = await sock.groupMetadata(remoteJid);
      groupCache[remoteJid] = {
        ...metadata,
        last_update: Date.now(),
      };
      setTimeout(() => delete groupCache[remoteJid], CACHE_METADATA);
    } catch (err) {
      console.error(`Failed to fetch metadata for ${remoteJid}:`, err.message);
      return null;
    }
  }
  return groupCache[remoteJid];
};

// 🇬🇧 Get profile picture URL and cache it
// 🇸🇦 الحصول على رابط صورة الملف الشخصي وتخزينه في الكاش
const getProfilePictureUrl = async (sock, sender) => {
  if (!profilePictureCache[sender]) {
    try {
      const url = await sock.profilePictureUrl(sender, "image");
      profilePictureCache[sender] = url || DEFAULT_PROFILE_PICTURE_URL;
    } catch {
      profilePictureCache[sender] = DEFAULT_PROFILE_PICTURE_URL;
    }
    setTimeout(() => delete profilePictureCache[sender], CACHE_METADATA);
  }
  return profilePictureCache[sender];
};

// 🇬🇧 Fetch all participating groups globally and cache
// 🇸🇦 جلب جميع المجموعات المشاركة عالميًا وتخزينها في الكاش
const groupFetchAllParticipating = async (sock) => {
  if (!groupFetchCache["global"]) {
    try {
      const data = await sock.groupFetchAllParticipating();
      groupFetchCache["global"] = data;
      setTimeout(() => {
        delete groupFetchCache["global"];
      }, CACHE_groupFetch);
    } catch (error) {
      console.error("Error fetching group participation:", error.message);
      return false;
    }
  }
  return groupFetchCache["global"];
};

// 🇬🇧 Clear specific group cache manually
// 🇸🇦 حذف الكاش لمجموعة معينة يدويًا
const clearGroupCache = (remoteJid) => {
  if (groupCache[remoteJid]) {
    delete groupCache[remoteJid];
  }
};

// 🇬🇧 Update participants in a group cache
// 🇸🇦 تحديث المشاركين في الكاش للمجموعة
const updateParticipant = async (
  sock,
  remoteJid,
  participants,
  action = "add"
) => {
  if (!groupCache[remoteJid]) {
    try {
      logTracking(`Cache.js - groupMetadata2 (${remoteJid})`);
      const metadata = await sock.groupMetadata(remoteJid);
      groupCache[remoteJid] = {
        ...metadata,
        last_update: Date.now(),
      };
      setTimeout(() => delete groupCache[remoteJid], CACHE_METADATA);
    } catch (err) {
      console.error(`Failed to fetch group metadata ${remoteJid}:`, err.message);
      return;
    }
  }

  const group = groupCache[remoteJid];
  if (!group) return;

  participants.forEach((number) => {
    const jid = number.endsWith("@s.whatsapp.net")
      ? number
      : `${number}@s.whatsapp.net`;
    const index = group.participants.findIndex((p) => p.id === jid);

    if (action === "add") {
      if (index === -1) group.participants.push({ id: jid, admin: null });
    } else if (action === "remove") {
      if (index !== -1) group.participants.splice(index, 1);
    } else if (action === "promote") {
      if (index !== -1) group.participants[index].admin = "admin";
    } else if (action === "demote") {
      if (index !== -1) group.participants[index].admin = null;
    }
  });

  group.size = group.participants.length;
  group.last_update = Date.now();
};

// 🇬🇧 Find the latest group where a participant exists
// 🇸🇦 البحث عن أحدث مجموعة يتواجد فيها المشارك
const findParticipantLatest = (number) => {
  const jid = number.endsWith("@s.whatsapp.net")
    ? number
    : `${number}@s.whatsapp.net`;

  let latestGroup = null;
  let latestTime = 0;

  for (const groupId in groupCache) {
    const group = groupCache[groupId];
    const found = group.participants?.some((p) => p.id === jid);
    if (found && group.last_update > latestTime) {
      latestGroup = {
        groupId: group.id,
        subject: group.subject,
        last_update: group.last_update,
        participant: group.participants.find((p) => p.id === jid),
        total_participants: group.size,
      };
      latestTime = group.last_update;
    }
  }

  return latestGroup;
};

module.exports = {
  getGroupMetadata,
  getProfilePictureUrl,
  groupFetchAllParticipating,
  clearGroupCache,
  updateParticipant,
  findParticipantLatest,
  sessions,
};