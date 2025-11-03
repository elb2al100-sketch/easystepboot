// ===============================================
// 🎮 Temporary database using an object
// 🎮 قاعدة بيانات مؤقتة باستخدام كائن (Object)
// ===============================================
const DB_suit = {};

/**
 * ➕ Adds user data to the database
 * ➕ إضافة بيانات المستخدم إلى قاعدة البيانات
 *
 * @param {string} remoteJid - Unique user ID / معرف المستخدم الفريد
 * @param {object} data - User game data (random number, level, etc.)
 *                        بيانات اللعبة الخاصة بالمستخدم (أرقام عشوائية، مستوى، إلخ)
 */
function addUser(remoteJid, data) {
    DB_suit[remoteJid] = data;
}

/**
 * 🔄 Updates existing user data
 * 🔄 تحديث بيانات المستخدم الموجودة مسبقًا
 *
 * @param {string} remoteJid - Unique user ID / معرف المستخدم الفريد
 * @param {object} newData - The new data to merge with the existing one
 *                           البيانات الجديدة التي سيتم دمجها مع البيانات الحالية
 */
function updateUser(remoteJid, newData) {
    if (DB_suit[remoteJid]) {
        // ✅ Update only fields that exist in newData
        // ✅ تحديث الحقول الموجودة فقط في البيانات الجديدة
        DB_suit[remoteJid] = { 
            ...DB_suit[remoteJid], 
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
    delete DB_suit[remoteJid];
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
    return DB_suit[remoteJid] || null;
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
    return Boolean(DB_suit[remoteJid]);
}

/**
 * 🔎 Finds user data by a specific key-value pair
 * 🔎 البحث عن بيانات المستخدم باستخدام مفتاح وقيمة محددين
 *
 * @param {object} searchCriteria - The key-value pair to search for (e.g., {name: "Ali"})
 *                                  كائن يحتوي على مفتاح وقيمة للبحث (مثل {name: "Ali"})
 * @returns {object|null} - Returns user data that matches the search or null if not found
 *                          يعيد بيانات المستخدم المطابقة أو null إذا لم يتم العثور عليها
 */
function findDataByKey(searchCriteria) {
    const key = Object.keys(searchCriteria)[0]; // 🗝️ Get the key from the object
    // 🗝️ الحصول على المفتاح من الكائن
    let value = searchCriteria[key]; // Get the value to match / الحصول على القيمة للمقارنة

    // ⚙️ If the value is empty, undefined, or null, set it to null
    // ⚙️ إذا كانت القيمة فارغة أو غير معرفة أو null، اجعلها null
    if (value === "" || value === undefined || value === null) {
        value = null;
    }

    // 🔁 Loop through all users in the database
    // 🔁 المرور على جميع المستخدمين في قاعدة البيانات
    for (const remoteJid in DB_suit) {
        if (DB_suit[remoteJid][key] === value) {
            return {
                remoteJid,
                ...DB_suit[remoteJid],
            }; // ✅ Return the data directly without array / ✅ إرجاع البيانات مباشرة دون مصفوفة
        }
    }

    return null; // 🚫 If no match found / 🚫 إذا لم يتم العثور على أي تطابق
}

// ===============================================
// 📤 Export functions and database
// 📤 تصدير الدوال وقاعدة البيانات
// ===============================================
module.exports = {
    DB_suit,        // Temporary in-memory database / قاعدة بيانات مؤقتة في الذاكرة
    addUser,        // Add user data / إضافة بيانات المستخدم
    removeUser,     // Remove user data / حذف بيانات المستخدم
    getUser,        // Retrieve user data / استرجاع بيانات المستخدم
    isUserPlaying,  // Check if user is playing / التحقق مما إذا كان المستخدم يلعب
    findDataByKey,  // Find data by key / البحث عن البيانات بواسطة مفتاح
    updateUser      // Update existing user data / تحديث بيانات المستخدم الموجودة
};