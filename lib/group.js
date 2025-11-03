const { Console } = require('console');

const fs            = require('fs').promises; // Using fs.promises for async operations / استخدام fs.promises للعمليات الغير متزامنة
const path          = './database/group.json'; // JSON file location / موقع ملف JSON

const AUTOSAVE  = 30; // 30 seconds / 30 ثانية

let db = {}; // In-memory database / قاعدة بيانات داخل الذاكرة

// ✅ Load group database from file
// تحميل قاعدة بيانات المجموعات من الملف
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

// ✅ Return all group data / إرجاع كل بيانات المجموعات
async function readGroup() {
    return db;
}

// ✅ Replace entire group database / استبدال قاعدة بيانات المجموعات بالكامل
async function replaceGroup(newData) {
    try {
        db = newData;
        await fs.writeFile(path, JSON.stringify(db, null, 2), "utf8");
    } catch (error) {
        console.error("❌ Error replacing group data:", error);
    }
}

// ✅ Reset group database / إعادة تعيين قاعدة البيانات
async function resetGroup() {
    try {
        db = {};
        await fs.writeFile(path, JSON.stringify(db, null, 2), 'utf8');
        console.log('✅ Database berhasil di-reset / تم إعادة تعيين قاعدة البيانات');
    } catch (error) {
        console.error('❌ Gagal me-reset database / فشل إعادة تعيين قاعدة البيانات:', error);
    }
}

// ✅ Check if file exists / التحقق من وجود الملف
async function fileExists(filePath) {
    try {
        await fs.access(filePath);
        return true;
    } catch {
        return false;
    }
}

// ✅ Save in-memory database to file / حفظ قاعدة البيانات داخل الذاكرة إلى الملف
async function saveGroup() {
    try {
        await fs.writeFile(path, JSON.stringify(db, null, 2), "utf8");
    } catch (error) {
        console.error("❌ Error saving users file:", error);
    }
}

// ✅ Add new group / إضافة مجموعة جديدة
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

// ✅ Update group data / تحديث بيانات المجموعة
async function updateGroup(id, updateData) {
    try {
        if (!db[id]) return false;

        // Merge old features with new ones / دمج الميزات القديمة مع الجديدة
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

// ====================== User Block Functions ======================

// ✅ Add user to block list / إضافة مستخدم لقائمة الحظر
async function addUserBlock(id, sender) {
    try {
        if (!db[id]) return false;

        if (!Array.isArray(db[id].userBlock)) db[id].userBlock = [];

        if (!db[id].userBlock.includes(sender)) {
            db[id].userBlock.push(sender);
        }

        db[id].updatedAt = new Date().toISOString();
        return true;
    } catch (error) {
        console.error('Error updating group:', error);
        return false;
    }
}

// ✅ Check if user is blocked / التحقق من حظر المستخدم
async function isUserBlocked(id, sender) {
    try {
        if (!db[id]) return false;
        if (!Array.isArray(db[id].userBlock)) return false;

        return db[id].userBlock.includes(sender);
    } catch (error) {
        console.error('Error checking userBlock:', error);
        return false;
    }
}

// ✅ Remove user from block list / إزالة مستخدم من الحظر
async function removeUserFromBlock(id, sender) {
    try {
        if (!db[id]) return false;
        if (!Array.isArray(db[id].userBlock)) return false;

        const userIndex = db[id].userBlock.indexOf(sender);
        if (userIndex === -1) return false;

        db[id].userBlock.splice(userIndex, 1);
        return true;
    } catch (error) {
        return false;
    }
}

// ====================== Feature Block Functions ======================

// ✅ Add blocked feature / إضافة ميزة محظورة
async function addFiturBlock(id, command) {
    try {
        if (!db[id]) return false;
        if (!Array.isArray(db[id].fiturBlock)) db[id].fiturBlock = [];

        if (!db[id].fiturBlock.includes(command)) {
            db[id].fiturBlock.push(command);
        }

        db[id].updatedAt = new Date().toISOString();
        return true;
    } catch (error) {
        console.error('Error updating group:', error);
        return false;
    }
}

// ✅ Check if feature is blocked / التحقق من حظر الميزة
async function isFiturBlocked(id, command) {
    try {
        if (!db[id]) return false;
        if (!Array.isArray(db[id].fiturBlock)) return false;

        return db[id].fiturBlock.includes(command);
    } catch (error) {
        console.error('Error checking fiturBlock:', error);
        return false;
    }
}

// ✅ Remove feature from block / إزالة ميزة من الحظر
async function removeFiturFromBlock(id, command) {
    try {
        if (!db[id]) return false;
        if (!Array.isArray(db[id].fiturBlock)) return false;

        const userIndex = db[id].fiturBlock.indexOf(command);
        if (userIndex === -1) return false;

        db[id].fiturBlock.splice(userIndex, 1);
        return true;
    } catch (error) {
        return false;
    }
}

// ✅ Get all blocked users in a group / جلب كل المستخدمين المحظورين في مجموعة
async function getUserBlockList(id) {
    try {
        if (!db[id]) return false;
        if (!Array.isArray(db[id].userBlock)) return [];

        return db[id].userBlock;
    } catch (error) {
        console.error('Error fetching userBlock list:', error);
        return [];
    }
}

// ✅ Delete entire group / حذف مجموعة بالكامل
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

// ✅ Find group and add default features if not exist / العثور على مجموعة وإضافة ميزات افتراضية إذا لم توجد
async function findGroup(id, search = false) {
    try {
        if(search && id == 'owner') {
            if (!db[id]) {
                db[id] = {
                    fitur: { /* All features default false / جميع الميزات افتراضي false */ },
                    userBlock: [],
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                };
            }
            return db[id];
        }

        if (!db[id] && id !== 'owner') {
            db[id] = {
                fitur: { /* All features default false */ },
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

// ✅ Auto-save database every AUTOSAVE seconds / حفظ قاعدة البيانات تلقائياً كل AUTOSAVE ثانية
setInterval(saveGroup, AUTOSAVE * 1000);

// ✅ Load data first time / تحميل البيانات عند البداية
loadGroup();

// ✅ Export functions / تصدير الدوال
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