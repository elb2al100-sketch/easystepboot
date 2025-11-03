// ===============================================
// 🗂️ Temporary database using an object
// 🗂️ قاعدة بيانات مؤقتة باستخدام كائن (Object)
// ===============================================
const DB_tebak_lagu = {};

/**
 * ➕ Adds user data to the database
 * ➕ إضافة بيانات المستخدم إلى قاعدة البيانات
 *
 * @param {string} remoteJid - Unique user ID / معرف المستخدم الفريد
 * @param {object} data - User game data (random number, level, etc.)
 *                        بيانات اللعبة الخاصة بالمستخدم (أرقام عشوائية، مستوى، إلخ)
 */
function addUser(remoteJid, data) {
    DB_tebak_lagu[remoteJid] = data;
}

/**
 * ❌ Removes user data from the database
 * ❌ حذف بيانات المستخدم من قاعدة البيانات
 *
 * @param {string} remoteJid - Unique user ID / معرف المستخدم الفريد
 */
function removeUser(remoteJid) {
    delete DB_tebak_lagu[remoteJid];
}

/**
 * 🔍 Retrieves user data from the database
 * 🔍 استرجاع بيانات المستخدم من قاعدة البيانات
 *
 * @param {string} remoteJid - Unique user ID / معرف المستخدم الفريد
 * @returns {object|null} - User data or null if not found
 *                          بيانات المستخدم أو null إذا لم يتم العثور عليها
 */
function getUser(remoteJid) {
    return DB_tebak_lagu[remoteJid] || null;
}

/**
 * 🎮 Checks if a user is currently playing
 * 🎮 التحقق مما إذا كان المستخدم يلعب حاليًا
 *
 * @param {string} remoteJid - Unique user ID / معرف المستخدم الفريد
 * @returns {boolean} - True if the user exists in the database, false otherwise
 *                      صحيح إذا كان المستخدم موجودًا في قاعدة البيانات، خطأ إذا لم يكن كذلك
 */
function isUserPlaying(remoteJid) {
    return Boolean(DB_tebak_lagu[remoteJid]);
}

// ===============================================
// 📤 Export functions and database
// 📤 تصدير الدوال وقاعدة البيانات
// ===============================================
module.exports = {
    DB_tebak_lagu,    // Temporary in-memory database / قاعدة بيانات مؤقتة في الذاكرة
    addUser,          // Add user data / إضافة بيانات المستخدم
    removeUser,       // Remove user data / حذف بيانات المستخدم
    getUser,          // Retrieve user data / استرجاع بيانات المستخدم
    isUserPlaying,    // Check if user is playing / التحقق مما إذا كان المستخدم يلعب
};