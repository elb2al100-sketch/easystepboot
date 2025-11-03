// ===============================================
// 🎮 Temporary database using an object
// 🎮 قاعدة بيانات مؤقتة باستخدام كائن (Object)
// ===============================================
const DB_tictactoe = {};

/**
 * ➕ Adds user data to the database
 * ➕ إضافة بيانات المستخدم إلى قاعدة البيانات
 *
 * @param {string} remoteJid - Unique user ID / معرف المستخدم الفريد
 * @param {object} data - User game data (random number, level, etc.)
 *                        بيانات اللعبة الخاصة بالمستخدم (أرقام عشوائية، مستوى، إلخ)
 */
function addUser(remoteJid, data) {
    DB_tictactoe[remoteJid] = data;
}

/**
 * 🔄 Updates an existing user’s game data
 * 🔄 تحديث بيانات اللعبة الخاصة بالمستخدم الموجود
 *
 * @param {string} remoteJid - Unique user ID / معرف المستخدم الفريد
 * @param {object} newData - New data to update / البيانات الجديدة لتحديثها
 */
function updateGame(remoteJid, newData) {
    if (DB_tictactoe[remoteJid]) {
        // ✅ Update only the properties present in newData
        // ✅ تحديث القيم الموجودة فقط في الكائن الجديد
        DB_tictactoe[remoteJid] = { 
            ...DB_tictactoe[remoteJid], 
            ...newData 
        };
    } else {
        // ⚠️ Error if user not found
        // ⚠️ خطأ إذا لم يتم العثور على المستخدم
        console.error(`User with remoteJid ${remoteJid} not found for update. / المستخدم بالمعرف ${remoteJid} غير موجود للتحديث.`);
    }
}

/**
 * ❌ Removes user data from the database
 * ❌ حذف بيانات المستخدم من قاعدة البيانات
 *
 * @param {string} remoteJid - Unique user ID / معرف المستخدم الفريد
 */
function removeUser(remoteJid) {
    delete DB_tictactoe[remoteJid];
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
    return DB_tictactoe[remoteJid] || null;
}

/**
 * 🎯 Checks if a user is currently playing
 * 🎯 التحقق مما إذا كان المستخدم يلعب حاليًا
 *
 * @param {string} remoteJid - Unique user ID / معرف المستخدم الفريد
 * @returns {boolean} - True if the user exists in the database, false otherwise
 *                      صحيح إذا كان المستخدم موجودًا في قاعدة البيانات، خطأ إذا لم يكن كذلك
 */
function isUserPlaying(remoteJid) {
    return Boolean(DB_tictactoe[remoteJid]);
}

// ===============================================
// 📤 Export functions and database
// 📤 تصدير الدوال وقاعدة البيانات
// ===============================================
module.exports = {
    DB_tictactoe,     // Temporary in-memory database / قاعدة بيانات مؤقتة في الذاكرة
    addUser,          // Add user data / إضافة بيانات المستخدم
    removeUser,       // Remove user data / حذف بيانات المستخدم
    getUser,          // Retrieve user data / استرجاع بيانات المستخدم
    isUserPlaying,    // Check if user is playing / التحقق مما إذا كان المستخدم يلعب
    updateGame        // Update game data / تحديث بيانات اللعبة
};