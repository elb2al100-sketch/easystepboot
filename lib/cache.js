// Group cache / تخزين مؤقت للمجموعات
let groupCache = {};
let profilePictureCache = {};
let groupFetchCache = {};
const sessions = new Map();

// Default profile picture URL / رابط الصورة الافتراضية للبروفايل
const DEFAULT_PROFILE_PICTURE_URL =
  "https://api.autoresbot.com/api/maker/pp-default";

// Cache duration in minutes / مدة التخزين المؤقت بالدقائق
const CACHE_TIME = 60; 
const CACHE_METADATA = CACHE_TIME * 60000; // 60 seconds * 60000ms
const CACHE_groupFetch = CACHE_TIME * 60000; // 1 menit (60000 ms) / دقيقة واحدة
const { logTracking } = require("@lib/utils");

// Get group metadata, with caching / الحصول على بيانات المجموعة مع التخزين المؤقت
const getGroupMetadata = async (sock, remoteJid) => {
  // Skip if broadcast / تخطى إذا كان broadcast
  if (
    remoteJid.endsWith("@status.broadcast") ||
    remoteJid.endsWith("@broadcast")
  ) {
    console.warn(`Skipping metadata fetch for broadcast: ${remoteJid}`);
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
      console.error(`Failed to fetch metadata for ${remoteJid}:`);
      return null;
    }
  }
  return groupCache[remoteJid];
};

// Get profile picture URL with caching / الحصول على رابط صورة البروفايل مع التخزين المؤقت
const getProfilePictureUrl = async (sock, sender) => {
  if (!profilePictureCache[sender]) {
    try {
      const url = await sock.profilePictureUrl(sender, "image");
      profilePictureCache[sender] = url || DEFAULT_PROFILE_PICTURE_URL;
    } catch {
      profilePictureCache[sender] = DEFAULT_PROFILE_PICTURE_URL;
    }
    setTimeout(() => delete profilePictureCache[sender], CACHE_METADATA); // Cache 1 menit / تخزين مؤقت دقيقة واحدة
  }
  return profilePictureCache[sender];
};

// Fetch all participating groups once and cache / جلب جميع المجموعات التي يشارك بها المستخدم وتخزينها مؤقتًا
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

// Clear group cache manually / مسح التخزين المؤقت للمجموعة يدويًا
const clearGroupCache = (remoteJid) => {
  if (groupCache[remoteJid]) {
    delete groupCache[remoteJid];
  }
};

// Update participants in a group / تحديث المشاركين في المجموعة
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

  // Update group size and last update / تحديث حجم المجموعة ووقت آخر تعديل
  group.size = group.participants.length;
  group.last_update = Date.now();
};

// Find latest group of a participant / العثور على أحدث مجموعة لمشارك معين
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

// Export all functions and sessions / تصدير جميع الدوال والجلسات
module.exports = {
  getGroupMetadata,
  getProfilePictureUrl,
  groupFetchAllParticipating,
  clearGroupCache,
  updateParticipant,
  findParticipantLatest,
  sessions,
};