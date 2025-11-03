const fs = require('fs').promises; // استخدام fs.promises للعمليات الغير متزامنة / Using fs.promises for async operations
const path = './database/sewa.json'; // موقع ملف JSON / Path to JSON file
const { getCache, setCache, deleteCache, entriesCache, sizeCache } = require('@lib/globalCache'); // وظائف الكاش / Cache utilities
const { logWithTime }  = require('@lib/utils'); // وظيفة لتسجيل الوقت مع الرسائل / Logging function with timestamp

// **Check if file exists / التحقق من وجود الملف**
async function fileExists(filePath) {
    try {
        await fs.access(filePath);
        return true; // File exists / الملف موجود
    } catch {
        return false; // File does not exist / الملف غير موجود
    }
}

// **Read all sewa group data / قراءة بيانات جميع مجموعات الاستئجار**
async function readSewa() {
    try {
        let currentSewa;
        const cachedData = getCache(`sewa-group`); // Check cache first / التحقق من الكاش أولاً
        if (cachedData) {
            currentSewa = cachedData.data; // Use cached data / استخدام بيانات الكاش
        } else {
            if (!await fileExists(path)) {
                await fs.writeFile(path, JSON.stringify({}, null, 2), 'utf8'); // Create file if not exists / إنشاء الملف إذا لم يكن موجود
            }
            const data = await fs.readFile(path, 'utf8');
            currentSewa = JSON.parse(data);
            setCache(`sewa-group`, currentSewa); // Save to cache / حفظ في الكاش
        }
        return currentSewa;
    } catch (error) {
        console.error('❌ Error reading group file / خطأ عند قراءة الملف:', error);
        throw error;
    }
}

// **Save sewa group data to file / حفظ بيانات المجموعات في الملف**
async function saveSewa(data) {
    try {
        await fs.writeFile(path, JSON.stringify(data, null, 2), 'utf8');
        deleteCache(`sewa-group`);  // Reset cache / إعادة تعيين الكاش
        logWithTime('cache sewa-group', `SUCCESSFULLY DELETED / تم الحذف بنجاح`,'merah');
    } catch (error) {
        console.error('❌ Error saving group file / خطأ عند حفظ الملف:', error);
        throw error;
    }
}

// **Add or update a sewa group / إضافة أو تحديث مجموعة استئجار**
async function addSewa(id, userData) {
    try {
        const groups = await readSewa();
        
        if (groups[id]) {
            // If group exists, update / إذا المجموعة موجودة، حدثها
            groups[id] = {
                ...groups[id], // Keep old data / الاحتفاظ بالبيانات القديمة
                ...userData,   // Update with new data / التحديث بالبيانات الجديدة
                updatedAt: new Date().toISOString() // Update timestamp / تحديث الطابع الزمني
            };
        } else {
            // If group does not exist, create new / إذا لم تكن موجودة، أضف مجموعة جديدة
            groups[id] = {
                ...userData,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };
        }

        await saveSewa(groups); // Save changes / حفظ التغييرات
        return true;
    } catch (error) {
        console.error('❌ Error adding or updating group / خطأ عند إضافة أو تحديث المجموعة:', error);
        return false;
    }
}

// **Update existing sewa group / تحديث مجموعة موجودة**
async function updateSewa(id, updateData) {
    try {
        const groups = await readSewa();
        if (!groups[id]) return false; // Return false if group does not exist / إرجاع false إذا لم توجد المجموعة

        // Merge updates / دمج التحديثات
        groups[id] = {
            ...groups[id],
            ...updateData,
            updatedAt: new Date().toISOString() // Update timestamp / تحديث الطابع الزمني
        };

        await saveSewa(groups);
        return true;
    } catch (error) {
        console.error('❌ Error updating group / خطأ عند تحديث المجموعة:', error);
        return false;
    }
}

// **Delete a sewa group / حذف مجموعة**
async function deleteSewa(id) {
    try {
        const groups = await readSewa();
        if (!groups[id]) return false; // Group not found / لم يتم العثور على المجموعة
        delete groups[id];
        await saveSewa(groups);
        return true;
    } catch (error) {
        console.error('❌ Error deleting group / خطأ عند حذف المجموعة:', error);
        return false;
    }
}

// **Find a sewa group by ID / البحث عن مجموعة حسب ID**
async function findSewa(id) {
    try {
        const groups = await readSewa();
        return groups[id] || null; // Return group data or null / إرجاع بيانات المجموعة أو null
    } catch (error) {
        console.error('❌ Error finding group / خطأ عند البحث عن المجموعة:', error);
        return null;
    }
}

// **List all sewa groups / قائمة جميع المجموعات**
async function listSewa() {
    try {
        const groups = await readSewa();
        return groups || null;
    } catch (error) {
        console.error('❌ Error listing groups / خطأ عند عرض جميع المجموعات:', error);
        return null;
    }
}

// **Export functions / تصدير الوظائف**
module.exports = {
    saveSewa,
    addSewa,
    updateSewa,
    deleteSewa,
    findSewa,
    listSewa
};