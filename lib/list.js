const fs = require('fs').promises; // Using fs.promises for asynchronous operations / استخدام fs.promises للعمليات غير المتزامنة
const path = './database/list.json'; // JSON file location / موقع ملف JSON
const { getCache, setCache, deleteCache } = require('@lib/globalCache');
const { logWithTime, cleanText }  = require('@lib/utils');

/**
 * Check if a file exists
 * التحقق مما إذا كان الملف موجودًا
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
 * Read data from JSON file
 * قراءة البيانات من ملف JSON
 */
async function readList() {
    try {
        let currentList;
        const cachedData = getCache(`list-group`);
        if (cachedData) {
            currentList = cachedData.data; // Use data from cache / استخدام البيانات من الكاش
        } else {
            if (!await fileExists(path)) {
                await fs.writeFile(path, JSON.stringify({}, null, 2), 'utf8'); // Create file if it doesn't exist / إنشاء الملف إذا لم يكن موجودًا
            }
            const data = await fs.readFile(path, 'utf8');
            currentList = JSON.parse(data);
            setCache(`list-group`, currentList);
        }
        return currentList;
    } catch (error) {
        console.error('Error reading list file:', error);
        throw error;
    }
}

/**
 * Get data by group ID
 * جلب البيانات حسب معرف المجموعة
 */
async function getDataByGroupId(groupId) {
    try {
        const parsedData = await readList();
        return parsedData[groupId] || null; // Return null if group not found / إرجاع null إذا لم توجد المجموعة
    } catch (error) {
        console.error('Error reading group data:', error);
        throw error;
    }
}

/**
 * Save data to JSON file
 * حفظ البيانات في ملف JSON
 */
async function saveList(data) {
    try {
        await fs.writeFile(path, JSON.stringify(data, null, 2), 'utf8');
        deleteCache('list-group'); // Clear cache / مسح الكاش
        logWithTime('DELETE CACHE FILE', `list.json`, 'red'); // Log deletion / تسجيل عملية المسح
    } catch (error) {
        console.error('Error saving list file:', error);
        throw error;
    }
}

/**
 * Add a new keyword or content to a group
 * إضافة كلمة مفتاحية جديدة أو محتوى للمجموعة
 */
async function addList(id_grub, keyword, content) {
    try {
        const groups = await readList();

        if (!groups[id_grub]) {
            // Group doesn't exist, create it / إذا لم توجد المجموعة، إنشاؤها
            groups[id_grub] = {
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                list: {}
            };
        }

        if (groups[id_grub].list[keyword]) {
            return { success: false, message: `Keyword "${keyword}" already exists.` };
        }

        if (content && content.text) {
            content.text = cleanText(content.text); // Clean text / تنظيف النص
        }

        // Add keyword and content to the group / إضافة الكلمة والمحتوى للمجموعة
        groups[id_grub].list[keyword] = {
            content,
            addedAt: new Date().toISOString()
        };

        groups[id_grub].updatedAt = new Date().toISOString();
        await saveList(groups);
        return { success: true, message: 'Keyword added successfully.' };
    } catch (error) {
        console.error('Error adding to list:', error);
        return { success: false, message: 'Error adding to list.' };
    }
}

/**
 * Update a keyword if exists, or report not found
 * تحديث كلمة مفتاحية إذا كانت موجودة أو الإبلاغ بعدم وجودها
 */
async function updateList(id_grub, keyword, content) {
    try {
        const groups = await readList();

        if (!groups[id_grub]) {
            groups[id_grub] = { createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), list: {} };
        }

        if (groups[id_grub].list[keyword]) {
            groups[id_grub].list[keyword] = { content, updatedAt: new Date().toISOString() };
        } else {
            return { success: false, message: `Keyword "${keyword}" not found!` };
        }

        groups[id_grub].updatedAt = new Date().toISOString();
        await saveList(groups);
        return { success: true, message: `Keyword "${keyword}" processed successfully.` };
    } catch (error) {
        console.error('Error updating list:', error);
        return { success: false, message: 'Error updating list.' };
    }
}

/**
 * Update a keyword name in a group
 * تحديث اسم كلمة مفتاحية في مجموعة
 */
async function updateKeyword(id_grub, oldKeyword, newKeyword) {
    try {
        const groups = await readList();

        if (!groups[id_grub]) return { success: false, message: `Group with ID "${id_grub}" does not exist.` };
        if (!groups[id_grub].list[oldKeyword]) return { success: false, message: `Keyword "${oldKeyword}" not found` };
        if (groups[id_grub].list[newKeyword]) return { success: false, message: `Keyword "${newKeyword}" already exists.` };

        groups[id_grub].list[newKeyword] = { ...groups[id_grub].list[oldKeyword], updatedAt: new Date().toISOString() };
        delete groups[id_grub].list[oldKeyword];
        groups[id_grub].updatedAt = new Date().toISOString();

        await saveList(groups);
        return { success: true, message: 'Keyword updated successfully' };
    } catch (error) {
        return { success: false, message: 'Error updating keyword' };
    }
}

/**
 * Delete a keyword from a group
 * حذف كلمة مفتاحية من مجموعة
 */
async function deleteList(id_grub, keyword) {
    try {
        const groups = await readList();

        if (!groups[id_grub]) return { success: false, message: `Group "${id_grub}" does not exist.` };
        if (!groups[id_grub].list[keyword]) return { success: false, message: `Keyword "${keyword}" does not exist in group "${id_grub}".` };

        const media = groups[id_grub].list[keyword].content.media;
        if (media) {
            const filePath = `./database/media/${media}`;
            try { await fs.unlink(filePath); } catch (error) { console.error(`Failed to delete file ${media}:`, error); }
        }

        delete groups[id_grub].list[keyword];
        groups[id_grub].updatedAt = new Date().toISOString();
        await saveList(groups);

        return { success: true, message: `Keyword "${keyword}" deleted successfully.` };
    } catch (error) {
        console.error('Error deleting from list:', error);
        return { success: false, message: 'Error deleting from list.' };
    }
}

/**
 * Delete all keywords in a group
 * حذف كل الكلمات المفتاحية في مجموعة
 */
async function deleteAllListInGroup(id_grub) {
    const fs = require('fs/promises');
    const path = require('path');
    try {
        const groups = await readList();
        if (!groups[id_grub]) return { success: false, message: `Group "${id_grub}" does not exist.` };

        const list = groups[id_grub].list;
        const mediaDir = './database/media/';

        for (const keyword in list) {
            const media = list[keyword]?.content?.media;
            if (media) {
                const filePath = path.join(mediaDir, media);
                try { await fs.unlink(filePath); } catch (error) { console.error(`Failed to delete media file "${media}":`, error); }
            }
        }

        groups[id_grub].list = {};
        groups[id_grub].updatedAt = new Date().toISOString();
        await saveList(groups);

        return { success: true, message: `All keywords in group "${id_grub}" deleted successfully.` };
    } catch (error) {
        console.error('Error deleting all list in group:', error);
        return { success: false, message: 'Failed to delete all keywords.' };
    }
}

// Export functions
// تصدير الدوال
module.exports = {
    readList,
    addList,
    getDataByGroupId,
    deleteList,
    updateKeyword,
    updateList,
    deleteAllListInGroup
};