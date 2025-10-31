const fs    = require('fs').promises;
const path  = require('path');
const { getCache, setCache, deleteCache, entriesCache, sizeCache } = require('@lib/globalCache');
const { logWithTime }  = require('@lib/utils');
const filePath = path.join(__dirname, '../database', 'badword.json'); // 🇬🇧 JSON file location
                                                                     // 🇸🇦 موقع ملف JSON

// 🇬🇧 Read data from JSON file
// 🇸🇦 قراءة البيانات من ملف JSON
async function readBadword() {
    try {
        let dataBadword;
        const cachedData = getCache(`global-badword`);
        if (cachedData) {
            dataBadword = cachedData.data; // 🇬🇧 Use cached data
                                           // 🇸🇦 استخدام البيانات المخزنة في الكاش
        } else {
            if (!await fileExists(filePath)) {
                await fs.writeFile(filePath, JSON.stringify({}, null, 2), 'utf8');
            }
            const data = await fs.readFile(filePath, 'utf8');
            dataBadword = JSON.parse(data);
            setCache(`global-badword`, dataBadword); // 🇬🇧 Store in cache
                                                    // 🇸🇦 تخزين البيانات في الكاش
        }
        return dataBadword;
    } catch (error) {
        throw error;
    }
}

// 🇬🇧 Check if file exists
// 🇸🇦 التحقق مما إذا كان الملف موجودًا
async function fileExists(filePath) {
    try {
        await fs.access(filePath);
        return true;
    } catch {
        return false;
    }
}

// 🇬🇧 Save data to JSON file
// 🇸🇦 حفظ البيانات في ملف JSON
async function saveBadword(data) {
    try {
        await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf8');
        deleteCache(`global-badword`);  // 🇬🇧 reset cache
                                        // 🇸🇦 إعادة تعيين الكاش
        logWithTime('DELETE CACHE FILE', `badword.json`, 'red'); // 🇸🇦 تسجيل حذف الكاش
    } catch (error) {
        throw error;
    }
}

// 🇬🇧 Add a new badword entry
// 🇸🇦 إضافة كلمة سيئة جديدة
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

// 🇬🇧 Update a badword entry
// 🇸🇦 تحديث كلمة سيئة موجودة
async function updateBadword(id, updateData) {
    try {
        const badwords = await readBadword();
        if (!badwords[id]) {
            return false;
        }
        badwords[id] = {
            ...badwords[id], // 🇬🇧 Keep previous properties
                             // 🇸🇦 الاحتفاظ بالخصائص السابقة
            ...updateData,
            updatedAt: new Date().toISOString(),
        };
        await saveBadword(badwords);
        return true;
    } catch (error) {
        return false;
    }
}

// 🇬🇧 Delete a badword entry
// 🇸🇦 حذف كلمة سيئة
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

// 🇬🇧 Find a badword entry by ID
// 🇸🇦 البحث عن كلمة سيئة حسب المعرف
async function findBadword(id) {
    try {
        const badwords = await readBadword();
        return badwords[id] || null;
    } catch (error) {
        return null;
    }
}

// 🇬🇧 Check if text contains badwords for a specific group
// 🇸🇦 التحقق مما إذا كان النص يحتوي على كلمات سيئة لمجموعة معينة
async function containsBadword(groupId, text) {
    try {
        const badwordData = await readBadword();

        // 🇬🇧 Ensure data exists for groupId
        // 🇸🇦 التأكد من وجود بيانات للمجموعة
        if (!badwordData[groupId] || !Array.isArray(badwordData[groupId].listBadword)) {
            return { status: false, words: '' }; // 🇬🇧 No badwords for this group
                                                 // 🇸🇦 لا توجد كلمات سيئة لهذه المجموعة
        }

        // 🇬🇧 Get list of badwords for group
        // 🇸🇦 الحصول على قائمة الكلمات السيئة للمجموعة
        const listBadword = badwordData[groupId].listBadword;

        // 🇬🇧 Detect badwords in text
        // 🇸🇦 كشف الكلمات السيئة في النص
        const detectedWords = listBadword.filter(badword =>
            text.toLowerCase().includes(badword.toLowerCase())
        );

        return {
            status: detectedWords.length > 0,
            words: detectedWords.join(',') // 🇬🇧 Convert array to comma-separated string
                                           // 🇸🇦 تحويل المصفوفة إلى سلسلة مفصولة بفواصل
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