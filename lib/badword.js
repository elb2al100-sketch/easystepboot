const fs = require('fs').promises;
const path = require('path');
const { getCache, setCache, deleteCache, entriesCache, sizeCache } = require('@lib/globalCache');
const { logWithTime } = require('@lib/utils');
const filePath = path.join(__dirname, '../database', 'badword.json'); 
// Location of JSON file / موقع ملف JSON

// Read data from JSON file / قراءة البيانات من ملف JSON
async function readBadword() {
    try {
        let dataBadword;
        const cachedData = getCache(`global-badword`);
        if (cachedData) {
            dataBadword = cachedData.data; // Use data from cache / استخدام البيانات من الكاش
        } else {
            if (!await fileExists(filePath)) {
                await fs.writeFile(filePath, JSON.stringify({}, null, 2), 'utf8');
            }
            const data = await fs.readFile(filePath, 'utf8');
            dataBadword = JSON.parse(data);
            setCache(`global-badword`, dataBadword); // Save to cache / حفظ في الكاش
        }
        return dataBadword;
    } catch (error) {
        throw error;
    }
}

// Check if file exists / التحقق من وجود الملف
async function fileExists(filePath) {
    try {
        await fs.access(filePath);
        return true;
    } catch {
        return false;
    }
}

// Save data to JSON file / حفظ البيانات في ملف JSON
async function saveBadword(data) {
    try {
        await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf8');
        deleteCache(`global-badword`);  // Reset cache / إعادة تعيين الكاش
        logWithTime('DELETE CACHE FILE', `badword.json`, 'merah');
    } catch (error) {
        throw error;
    }
}

// Add badword data / إضافة كلمة سيئة
async function addBadword(id, userData) {
    try {
        const badwords = await readBadword();
        if (badwords[id]) {
            return false;
        }
        badwords[id] = {
            ...userData,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };
        await saveBadword(badwords);
        return true;
    } catch (error) {
        return false;
    }
}

// Update badword data / تحديث بيانات الكلمة السيئة
async function updateBadword(id, updateData) {
    try {
        const badwords = await readBadword();
        if (!badwords[id]) {
            return false;
        }
        badwords[id] = {
            ...badwords[id], // Keep previous properties / الاحتفاظ بالخصائص السابقة
            ...updateData,
            updatedAt: new Date().toISOString(),
        };
        await saveBadword(badwords);
        return true;
    } catch (error) {
        return false;
    }
}

// Delete badword data / حذف بيانات الكلمة السيئة
async function deleteBadword(id) {
    try {
        const badwords = await readBadword();
        if (!badwords[id]) {
            return false;
        }
        delete badwords[id];
        await saveBadword(badwords);
        return true;
    } catch (error) {
        return false;
    }
}

// Find badword by ID / البحث عن كلمة سيئة باستخدام المعرف
async function findBadword(id) {
    try {
        const badwords = await readBadword();
        return badwords[id] || null;
    } catch (error) {
        return null;
    }
}

// Check if text contains badwords / التحقق إذا كان النص يحتوي على كلمات سيئة
async function containsBadword(groupId, text) {
    try {
        const badwordData = await readBadword();

        // Ensure data for groupId exists / التأكد من وجود بيانات للمجموعة
        if (!badwordData[groupId] || !Array.isArray(badwordData[groupId].listBadword)) {
            return { status: false, words: '' }; // No badword for this group / لا توجد كلمات سيئة لهذه المجموعة
        }

        // Get badword list for groupId / الحصول على قائمة الكلمات السيئة للمجموعة
        const listBadword = badwordData[groupId].listBadword;

        // Detect badwords in text / اكتشاف الكلمات السيئة في النص
        const detectedWords = listBadword.filter(badword =>
            text.toLowerCase().includes(badword.toLowerCase())
        );

        return {
            status: detectedWords.length > 0,
            words: detectedWords.join(',') // Convert array to comma string / تحويل المصفوفة إلى نص مفصول بفواصل
        };
    } catch (error) {
        console.error('Error checking badword:', error);
        return { status: false, words: '' };
    }
}

module.exports = {
    readBadword,
    saveBadword,
    addBadword,
    updateBadword,
    deleteBadword,
    findBadword,
    containsBadword
};