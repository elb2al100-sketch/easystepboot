const config    = require('@config');
const fsp       = require("fs").promises;
const usersJson = "./database/users.json";
const ownerJson = "./database/owner.json";

let savingQueueUsers = Promise.resolve(); // Queue for saving users / قائمة انتظار لحفظ بيانات المستخدمين
let savingQueueOwners = Promise.resolve(); // Queue for saving owners / قائمة انتظار لحفظ بيانات المالكين

const AUTOSAVE  = 60; // 60 Seconds / 60 ثانية

const MS_IN_A_DAY = 24 * 60 * 60 * 1000; // Constant for 1 day in milliseconds / ثابت يمثل يوم واحد بالملي ثانية

let db = {}; // User database in memory / قاعدة بيانات المستخدمين في الذاكرة
let dbOwner = []; // Owner database in memory / قاعدة بيانات المالكين في الذاكرة

// Check if file exists / التحقق من وجود الملف
async function fileExists(filePath) {
    try {
        await fsp.access(filePath);
        return true;
    } catch {
        return false;
    }
}

// Load users.json into memory / تحميل ملف users.json إلى الذاكرة
async function loadUsers() {
    try {
        if (!(await fileExists(usersJson))) {
            await fsp.writeFile(usersJson, JSON.stringify({}, null, 2), "utf8");
        }

        const data = await fsp.readFile(usersJson, "utf8");
        db = JSON.parse(data);
    } catch (error) {
        console.error("❌ Error loading users file:", error);
        db = {};
    }
}

// Reset money of all users / إعادة تعيين المال لجميع المستخدمين
async function resetMoney() {
    for (const userId in db) {
        if (db.hasOwnProperty(userId)) {
            db[userId].money = 0;
            db[userId].updatedAt = new Date().toISOString();
        }
    }
}

// Remove users inactive for 30 days / إزالة المستخدمين غير النشطين منذ 30 يومًا
function resetMemberOld() {
    const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;
    const now = Date.now();
    let deletedCount = 0;

    for (const userId in db) {
        if (!db.hasOwnProperty(userId)) continue;

        const user = db[userId];
        const lastUpdate = new Date(user.updatedAt).getTime();

        if (now - lastUpdate > THIRTY_DAYS_MS) {
            delete db[userId];
            deletedCount++;
        }
    }
}

// Reset user limits / إعادة تعيين حدود المستخدمين
async function resetLimit() {
    for (const userId in db) {
        if (db.hasOwnProperty(userId)) {
            db[userId].limit = 0;
            db[userId].updatedAt = new Date().toISOString();
        }
    }
}

// Reset user levels / إعادة تعيين مستويات المستخدمين
async function resetLevel() {
    for (const userId in db) {
        if (db.hasOwnProperty(userId)) {
            db[userId].level = 0;
            db[userId].updatedAt = new Date().toISOString();
        }
    }
}

// Reset all users / إعادة تعيين جميع المستخدمين
async function resetUsers() {
    db = {}; // Reset in-memory database / إعادة تعيين قاعدة البيانات في الذاكرة
    await saveUsers();
}

// Reset all owners / إعادة تعيين جميع المالكين
async function resetOwners() {
    dbOwner = []; // Reset owner database in memory / إعادة تعيين قاعدة بيانات المالكين في الذاكرة
    await saveOwners();
}

// Load owner.json into memory / تحميل ملف owner.json إلى الذاكرة
async function loadOwners() {
    try {
        if (!(await fileExists(ownerJson))) {
            await fsp.writeFile(ownerJson, JSON.stringify([], null, 2), "utf8");
        }

        const data = await fsp.readFile(ownerJson, "utf8");
        dbOwner = JSON.parse(data);

        if (!Array.isArray(dbOwner)) {
            throw new Error("owner.json format is invalid (must be an array) / تنسيق owner.json غير صالح (يجب أن يكون مصفوفة).");
        }
    } catch (error) {
        console.error("❌ Error loading owner file:", error);
        dbOwner = [];
    }
}

// Save user database from memory to file / حفظ قاعدة بيانات المستخدمين من الذاكرة إلى الملف
async function saveUsers() {
    savingQueueUsers = savingQueueUsers.then(async () => {
        try {
            await fsp.writeFile(usersJson, JSON.stringify(db, null, 2), "utf8");
        } catch (error) {
            console.error("❌ Error saving users file:", error);
        }
    });
}

// Save owner database from memory to file / حفظ قاعدة بيانات المالكين من الذاكرة إلى الملف
async function saveOwners() {
    savingQueueOwners = savingQueueOwners.then(async () => {
        try {
            await fsp.writeFile(ownerJson, JSON.stringify(dbOwner, null, 2), "utf8");
        } catch (error) {
            console.error("❌ Error saving owners file:", error);
        }
    });
}

// Read users from memory / قراءة المستخدمين من الذاكرة
async function readUsers() {
    return db;
}

// Add a new user to memory / إضافة مستخدم جديد إلى الذاكرة
function addUser(id, userData) {
    if (db[id]) return false;

    db[id] = {
        ...userData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    };
    return true;
}

// Update user data / تحديث بيانات المستخدم
function updateUser(id, updateData) {
    if (!db[id]) return false;

    if (updateData.money !== undefined) {
        updateData.money = Math.max(0, updateData.money);
    }
    if (updateData.limit !== undefined) {
        updateData.limit = Math.max(0, updateData.limit);
    }

    db[id] = {
        ...db[id],
        ...updateData,
        updatedAt: new Date().toISOString(),
    };
    return true;
}

// Delete user / حذف مستخدم
function deleteUser(id) {
    if (!db[id]) return false;
    delete db[id];
    return true;
}

// Find user by ID / البحث عن مستخدم بالمعرف
function findUser(id) {
    return db[id] || null;
}

// Check if user is premium / التحقق مما إذا كان المستخدم بريميوم
function isPremiumUser(remoteJid) {
    const data = findUser(remoteJid);
    if (!data || !data.premium) return false;

    const premiumDate = new Date(data.premium);
    return !isNaN(premiumDate) && premiumDate > new Date();
}

// Get list of inactive users (>7 days) / الحصول على قائمة المستخدمين غير النشطين (>7 أيام)
function getInactiveUsers() {
    const sevenDaysAgo = Date.now() - 7 * MS_IN_A_DAY;

    return Object.entries(db)
        .filter(([_, userData]) => {
            if (!userData.updatedAt) return false;
            return new Date(userData.updatedAt).getTime() < sevenDaysAgo;
        })
        .map(([id, userData]) => ({ id, updatedAt: userData.updatedAt }));
}

// Get list of active users within last X days / الحصول على قائمة المستخدمين النشطين خلال آخر X أيام
function getActiveUsers(TOTAL_HARI_SIDER) {
    const sevenDaysAgo = Date.now() - TOTAL_HARI_SIDER * MS_IN_A_DAY;

    return Object.entries(db)
        .filter(([_, userData]) => {
            if (!userData.updatedAt) return false;
            return new Date(userData.updatedAt).getTime() >= sevenDaysAgo;
        })
        .map(([id, userData]) => ({ id, updatedAt: userData.updatedAt }));
}

// ====== Owner Functions ====== / وظائف المالك
// Check if number is owner / التحقق مما إذا كان الرقم مالك
function generateAllOwnerIds() {
  const rawIds = [
    ...(config.owner_number || []),
    ...(dbOwner || [])
  ];

  const allIds = new Set();

  for (const raw of rawIds) {
    let base = raw;

    if (raw.includes('@')) {
      // Already complete, take before @ / مكتمل بالفعل، خذ قبل @
      base = raw.split('@')[0];
      allIds.add(raw); // Also add original / أضف الأصلي أيضًا
    }

    allIds.add(`${base}@s.whatsapp.net`);
    allIds.add(`${base}@lid`);
  }

  return Array.from(allIds);
}

function isOwner(remoteJid) {
  const ownerIds = generateAllOwnerIds();
  return ownerIds.includes(remoteJid);
}

// List all owners / قائمة جميع المالكين
function listOwner() {
    const ownerJids = config.owner_number.map((number) => `${number}@s.whatsapp.net`);
    return [...ownerJids, ...dbOwner];
}

// Add new owner / إضافة مالك جديد
function addOwner(number) {
    if (!dbOwner.includes(number)) {
        dbOwner.push(number);
        return true;
    }
    return false;
}

// Delete owner / حذف مالك
function delOwner(number) {
    const index = dbOwner.indexOf(number);
    if (index !== -1) {
        dbOwner.splice(index, 1);
        return true;
    }
    return false;
}

// Auto-save database every 1 minute / حفظ قاعدة البيانات تلقائيًا كل دقيقة
setInterval(saveUsers, AUTOSAVE * 1000);
setInterval(saveOwners, AUTOSAVE * 1000);

// Initial load / التحميل الأولي
loadUsers();
loadOwners();

// Export functions / تصدير الدوال
module.exports = {
    readUsers,
    addUser,
    updateUser,
    deleteUser,
    findUser,
    getInactiveUsers,
    getActiveUsers,
    isPremiumUser,
    isOwner,
    listOwner,
    addOwner,
    delOwner,
    saveUsers,
    saveOwners,
    resetUsers,
    resetOwners,
    resetMoney,
    resetLimit,
    resetLevel,
    resetMemberOld,
    db, // Export database if needed in other files / تصدير قاعدة البيانات إذا لزم الأمر في ملفات أخرى
    dbOwner, // Export owner database if needed / تصدير قاعدة بيانات المالكين إذا لزم الأمر
};