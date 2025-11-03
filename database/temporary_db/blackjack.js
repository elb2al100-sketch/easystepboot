// ===============================================
// 🗃️ Temporary database using an object
// 🗃️ قاعدة بيانات مؤقتة باستخدام كائن (Object)
// ===============================================
const DB_blackjack = {};

/**
 * ➕ Adds a user's data to the database
 * ➕ إضافة بيانات المستخدم إلى قاعدة البيانات
 * 
 * @param {string} remoteJid - Unique user ID / معرف المستخدم الفريد
 * @param {object} data - User game data (random number, level, etc.)
 *                        بيانات اللعبة الخاصة بالمستخدم (أرقام عشوائية، المستوى، إلخ)
 */
function addUser(remoteJid, data) {
    DB_blackjack[remoteJid] = data;
}

/**
 * ❌ Removes a user's data from the database
 * ❌ حذف بيانات المستخدم من قاعدة البيانات
 * 
 * @param {string} remoteJid - Unique user ID / معرف المستخدم الفريد
 */
function removeUser(remoteJid) {
    delete DB_blackjack[remoteJid];
}

/**
 * 🔍 Retrieves a user's data from the database
 * 🔍 استرجاع بيانات المستخدم من قاعدة البيانات
 * 
 * @param {string} remoteJid - Unique user ID / معرف المستخدم الفريد
 * @returns {object|null} - User data or null if not found
 *                          بيانات المستخدم أو null إذا لم يتم العثور عليه
 */
function getUser(remoteJid) {
    return DB_blackjack[remoteJid] || null;
}

/**
 * 🎮 Checks if a user is currently playing
 * 🎮 التحقق مما إذا كان المستخدم يلعب حاليًا
 * 
 * @param {string} remoteJid - Unique user ID / معرف المستخدم الفريد
 * @returns {boolean} - True if user exists in the database, false otherwise
 *                      صحيح إذا كان المستخدم موجودًا في قاعدة البيانات، خطأ إذا لم يكن كذلك
 */
function isUserPlaying(remoteJid) {
    return Boolean(DB_blackjack[remoteJid]);
}

// ===============================================
// 📤 Export functions and database
// 📤 تصدير الدوال وقاعدة البيانات
// ===============================================
module.exports = {
    DB_blackjack,   // Temporary database object / كائن قاعدة البيانات المؤقتة
    addUser,        // Add user data / إضافة مستخدم
    removeUser,     // Remove user data / حذف مستخدم
    getUser,        // Get user data / جلب بيانات المستخدم
    isUserPlaying,  // Check if user is playing / التحقق من حالة اللعب
};