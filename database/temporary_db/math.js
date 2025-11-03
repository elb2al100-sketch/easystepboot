// ===============================================
// 🧮 Temporary database using an object
// 🧮 قاعدة بيانات مؤقتة باستخدام كائن (Object)
// ===============================================
const DB_math = {};

/**
 * ➕ Adds user data to the database
 * ➕ إضافة بيانات المستخدم إلى قاعدة البيانات
 *
 * @param {string} remoteJid - Unique user ID / معرف المستخدم الفريد
 * @param {object} data - User game data (random number, level, etc.)
 *                        بيانات اللعبة الخاصة بالمستخدم (أرقام عشوائية، مستوى، إلخ)
 */
function addUser(remoteJid, data) {
    DB_math[remoteJid] = data;
}

/**
 * 🔄 Updates existing user game data
 * 🔄 تحديث بيانات اللعبة الخاصة بالمستخدم الموجود مسبقًا
 *
 * @param {string} remoteJid - Unique user ID / معرف المستخدم الفريد
 * @param {object} newData - The new data to update / البيانات الجديدة لتحديثها
 */
function updateGame(remoteJid, newData) {
    if (DB_math[remoteJid]) {
        // ✅ Update only the fields that exist in newData
        // ✅ تحديث الحقول الموجودة فقط في البيانات الجديدة
        DB_math[remoteJid] = { 
            ...DB_math[remoteJid], 
            ...newData 
        };
    } else {
        console.error(`User with remoteJid ${remoteJid} not found for update.`);
        // 🚫 لم يتم العثور على المستخدم بالمعرف المحدد لتحديث بياناته
    }
}

/**
 * ❌ Removes user data from the database
 * ❌ حذف بيانات المستخدم من قاعدة البيانات
 *
 * @param {string} remoteJid - Unique user ID / معرف المستخدم الفريد
 */
function removeUser(remoteJid) {
    delete DB_math[remoteJid];
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
    return DB_math[remoteJid] || null;
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
    return Boolean(DB_math[remoteJid]);
}

// ===============================================
// 📤 Export functions and database
// 📤 تصدير الدوال وقاعدة البيانات
// ===============================================
module.exports = {
    DB_math,        // Temporary in-memory database / قاعدة بيانات مؤقتة في الذاكرة
    addUser,        // Add user data / إضافة بيانات المستخدم
    removeUser,     // Remove user data / حذف بيانات المستخدم
    getUser,        // Retrieve user data / استرجاع بيانات المستخدم
    isUserPlaying,  // Check if user is playing / التحقق مما إذا كان المستخدم يلعب
    updateGame      // Update existing user data / تحديث بيانات المستخدم الموجودة
};