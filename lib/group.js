const { Console } = require('console');
const fs = require('fs').promises; // 🇬🇧 Using fs.promises for async operations / 🇸🇦 استخدام fs.promises للعمليات غير المتزامنة
const path = './database/group.json'; // 🇬🇧 JSON file location / 🇸🇦 موقع ملف JSON

const AUTOSAVE = 30; // 🇬🇧 Autosave interval in seconds / 🇸🇦 فترة الحفظ التلقائي بالثواني

let db = {}; // 🇬🇧 In-memory database / 🇸🇦 قاعدة بيانات في الذاكرة

/**
 * 🇬🇧 Load group data from file or initialize if not exists
 * 🇸🇦 تحميل بيانات المجموعة من الملف أو إنشاؤها إذا لم تكن موجودة
 */
async function loadGroup() {
    try {
        if (!(await fileExists(path))) {
            await fs.writeFile(path, JSON.stringify({}, null, 2), "utf8");
        }
        const data = await fs.readFile(path, "utf8");
        db = JSON.parse(data);
    } catch (error) {
        console.error("❌ Error loading users file:", error);
        db = {};
    }
}

/**
 * 🇬🇧 Read in-memory group data
 * 🇸🇦 قراءة بيانات المجموعة المخزنة في الذاكرة
 */
async function readGroup() {
    return db;
}

/**
 * 🇬🇧 Replace and save new group data
 * 🇸🇦 استبدال البيانات الحالية وحفظ البيانات الجديدة
 */
async function replaceGroup(newData) {
    try {
        db = newData;
        await fs.writeFile(path, JSON.stringify(db, null, 2), "utf8");
    } catch (error) {
        console.error("❌ Error replacing group data:", error);
    }
}

/**
 * 🇬🇧 Reset group database
 * 🇸🇦 إعادة ضبط قاعدة بيانات المجموعة
 */
async function resetGroup() {
    try {
        db = {};
        await fs.writeFile(path, JSON.stringify(db, null, 2), 'utf8');
        console.log('✅ Database successfully reset.');
    } catch (error) {
        console.error('❌ Failed to reset database:', error);
    }
}

/**
 * 🇬🇧 Check if file exists
 * 🇸🇦 التحقق إذا كان الملف موجوداً
 */
async function fileExists(filePath) {
    try {
        await fs.access(filePath);
        return true;
    } catch {
        return false;
    }
}

/**
 * 🇬🇧 Save in-memory group data to file
 * 🇸🇦 حفظ بيانات المجموعة المخزنة في الذاكرة إلى الملف
 */
async function saveGroup() {
    try {
        await fs.writeFile(path, JSON.stringify(db, null, 2), "utf8");
    } catch (error) {
        console.error("❌ Error saving users file:", error);
    }
}

/**
 * 🇬🇧 Add a new group
 * 🇸🇦 إضافة مجموعة جديدة
 */
async function addGroup(id, userData) {
    try {
        if (db[id]) return false;

        db[id] = {
            ...userData,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        return true;
    } catch (error) {
        console.error('Error adding group:', error);
        return false;
    }
}

/**
 * 🇬🇧 Update group data with merged features
 * 🇸🇦 تحديث بيانات المجموعة ودمج الميزات الجديدة مع القديمة
 */
async function updateGroup(id, updateData) {
    try {
        if (!db[id]) return false;

        const updatedFeatures = {
            ...db[id].fitur,
            ...updateData.fitur
        };

        db[id] = {
            ...db[id],
            fitur: updatedFeatures,
            updatedAt: new Date().toISOString()
        };
        return true;
    } catch (error) {
        console.error('Error updating group:', error);
        return false;
    }
}

// --------------------------------------
// User block management / إدارة حظر المستخدمين
// --------------------------------------

async function addUserBlock(id, sender) {
    try {
        if (!db[id]) return false;
        if (!Array.isArray(db[id].userBlock)) db[id].userBlock = [];

        if (!db[id].userBlock.includes(sender)) db[id].userBlock.push(sender);
        db[id].updatedAt = new Date().toISOString();
        return true;
    } catch (error) {
        console.error('Error updating group:', error);
        return false;
    }
}

async function isUserBlocked(id, sender) {
    try {
        if (!db[id] || !Array.isArray(db[id].userBlock)) return false;
        return db[id].userBlock.includes(sender);
    } catch (error) {
        console.error('Error checking userBlock:', error);
        return false;
    }
}

async function removeUserFromBlock(id, sender) {
    try {
        if (!db[id] || !Array.isArray(db[id].userBlock)) return false;

        const userIndex = db[id].userBlock.indexOf(sender);
        if (userIndex === -1) return false;

        db[id].userBlock.splice(userIndex, 1);
        return true;
    } catch (error) {
        return false;
    }
}

async function getUserBlockList(id) {
    try {
        if (!db[id] || !Array.isArray(db[id].userBlock)) return [];
        return db[id].userBlock;
    } catch (error) {
        console.error('Error fetching userBlock list:', error);
        return [];
    }
}

// --------------------------------------
// Feature block management / إدارة حظر الميزات
// --------------------------------------

async function addFiturBlock(id, command) {
    try {
        if (!db[id]) return false;
        if (!Array.isArray(db[id].fiturBlock)) db[id].fiturBlock = [];

        if (!db[id].fiturBlock.includes(command)) db[id].fiturBlock.push(command);
        db[id].updatedAt = new Date().toISOString();
        return true;
    } catch (error) {
        console.error('Error updating group:', error);
        return false;
    }
}

async function isFiturBlocked(id, command) {
    try {
        if (!db[id] || !Array.isArray(db[id].fiturBlock)) return false;
        return db[id].fiturBlock.includes(command);
    } catch (error) {
        console.error('Error checking fiturBlock:', error);
        return false;
    }
}

async function removeFiturFromBlock(id, command) {
    try {
        if (!db[id] || !Array.isArray(db[id].fiturBlock)) return false;

        const index = db[id].fiturBlock.indexOf(command);
        if (index === -1) return false;

        db[id].fiturBlock.splice(index, 1);
        return true;
    } catch (error) {
        return false;
    }
}

// --------------------------------------
// Group management / إدارة المجموعات
// --------------------------------------

async function deleteGroup(id) {
    try {
        if (!db[id]) return false;
        delete db[id];
        return true;
    } catch (error) {
        console.error('Error deleting group:', error);
        return false;
    }
}

/**
 * 🇬🇧 Find group by ID or initialize default if not exists
 * 🇸🇦 البحث عن مجموعة حسب المعرف أو إنشاء بيانات افتراضية إذا لم تكن موجودة
 */
async function findGroup(id, search = false) {
    try {
        if(search && id == 'owner') {
            if (!db[id]) {
                db[id] = {
                    fitur: createDefaultFeatures(),
                    userBlock: [],
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                };
            }
            return db[id];
        }

        if (!db[id] && id !== 'owner') {
            db[id] = {
                fitur: createDefaultFeatures(),
                userBlock: [],
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };
        }

        if (!db[id] && id === 'owner') return null;
        return db[id];

    } catch (error) {
        console.error('Error finding group:', error);
        return null;
    }
}

/**
 * 🇬🇧 Create default feature settings
 * 🇸🇦 إنشاء إعدادات افتراضية للميزات
 */
function createDefaultFeatures() {
    return {
        antilink       : false,
        antilinkv2     : false,
        antilinkwa     : false,
        antilinkwav2   : false,
        badword        : false,
        antidelete     : false,
        antiedit       : false,
        antigame       : false,
        antifoto       : false,
        antivideo      : false,
        antiaudio      : false,
        antidocument   : false,
        antikontak     : false,
        antisticker    : false,
        antipolling    : false,
        antispamchat   : false,
        antivirtex     : false,
        antiviewonce   : false,
        autoai         : false,
        autosimi       : false,
        autorusuh      : false,
        welcome        : false,
        left           : false,
        promote        : false,
        demote         : false,
        onlyadmin      : false,
        mute           : false,
        detectblacklist: false,
        waktusholat    : false,
        antibot        : false,
        antitagsw      : false,
        antitagsw2     : false,
        antitagmeta    : false,
        antitagmeta2   : false
    };
}

// 🇬🇧 Autosave group database every 30 seconds
setInterval(saveGroup, AUTOSAVE * 1000);

// 🇬🇧 Load group data initially
loadGroup();

// 🇬🇧 Export functions / 🇸🇦 تصدير الوظائف
module.exports = {
    readGroup,
    saveGroup,
    addGroup,
    updateGroup,
    deleteGroup,
    findGroup,
    addUserBlock,
    isUserBlocked,
    removeUserFromBlock,
    getUserBlockList,
    addFiturBlock,
    isFiturBlocked,
    removeFiturFromBlock,
    resetGroup,
    replaceGroup
};