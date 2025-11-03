const fs = require('fs').promises; // استيراد نظام الملفات مع دعم الوعود / Import fs with promises
const path = './database/slr.json'; // مسار ملف تخزين SLR / Path to SLR JSON file

// استيراد وظائف التخزين المؤقت / Import cache utilities
const { getCache, setCache, deleteCache, entriesCache, sizeCache } = require('@lib/globalCache');

// **Check if file exists / التحقق من وجود الملف**
async function fileExists(filePath) {
    try {
        await fs.access(filePath);
        return true; // File exists / الملف موجود
    } catch {
        return false; // File does not exist / الملف غير موجود
    }
}

// **Add or update SLR for a group / إضافة أو تحديث SLR لمجموعة**
async function addSlr(id_grup, status, message) {
    try {
        let data = {};
        try {
            const fileContent = await fs.readFile(path, 'utf-8');
            data = JSON.parse(fileContent); // Load existing data / تحميل البيانات الحالية
        } catch (error) {
            if (error.code !== 'ENOENT') throw error; // Ignore file not found / تجاهل إذا الملف غير موجود
        }

        data[id_grup] = { status, message }; // Update group SLR / تحديث SLR للمجموعة
        await fs.writeFile(path, JSON.stringify(data, null, 2), 'utf-8'); // Save to file / حفظ الملف
        deleteCache(`slr-group-${id_grup}`); // Clear old cache / حذف الكاش القديم
    } catch (error) {
        console.error('❌ Error saving data / خطأ عند حفظ البيانات:', error);
    }
}

// **Check SLR message for a group / التحقق من رسالة SLR لمجموعة**
async function SLRcheckMessage(id_grup) {
    try {
        let currentSLR;
        const cachedData = getCache(`slr-group-${id_grup}`); // Check cache first / التحقق من الكاش أولاً
        if (cachedData) {
            currentSLR = cachedData.data; // Use cached data / استخدام بيانات الكاش
        } else {
            if (!await fileExists(path)) {
                await fs.writeFile(path, JSON.stringify({}, null, 2), 'utf8'); // Create file if not exists / إنشاء الملف إذا لم يكن موجود
            }
            const fileContent = await fs.readFile(path, 'utf-8');
            const data = JSON.parse(fileContent);

            if (data[id_grup] && data[id_grup].status === true) {
                currentSLR = data[id_grup].message;
                setCache(`slr-group-${id_grup}`, currentSLR); // Save to cache / حفظ في الكاش
            }
            return null; // Return null if no SLR found / إرجاع null إذا لم توجد رسالة SLR
        }
        return currentSLR; // Return SLR message / إرجاع رسالة SLR
    } catch (error) {
        if (error.code !== 'ENOENT') {
            console.error('❌ Error reading data / خطأ عند قراءة البيانات:', error);
        }
        return null; // Return null on error / إرجاع null عند حدوث خطأ
    }
}

module.exports = {
    addSlr,          // تصدير وظيفة إضافة SLR / Export addSlr
    SLRcheckMessage  // تصدير وظيفة التحقق من SLR / Export SLRcheckMessage
};