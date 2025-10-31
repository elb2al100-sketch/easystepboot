const fs = require('fs').promises; // Using fs.promises for async file operations
const path = './database/list.json'; // JSON file location
const { getCache, setCache, deleteCache } = require('@lib/globalCache');
const { logWithTime, cleanText } = require('@lib/utils');

/**
 * ============================
 * Check if file exists
 * التحقق إذا كان الملف موجودًا
 * ============================
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
 * ============================
 * Read list.json data
 * قراءة بيانات list.json
 * ============================
 */
async function readList() {
    try {
        let currentList;
        const cachedData = getCache(`list-group`);
        if (cachedData) {
            currentList = cachedData.data;
        } else {
            if (!await fileExists(path)) {
                await fs.writeFile(path, JSON.stringify({}, null, 2), 'utf8');
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
 * ============================
 * Get group data by groupId
 * الحصول على بيانات المجموعة باستخدام groupId
 * ============================
 */
async function getDataByGroupId(groupId) {
    try {
        const parsedData = await readList();
        return parsedData[groupId] || null;
    } catch (error) {
        console.error('Error reading group data:', error);
        throw error;
    }
}

/**
 * ============================
 * Save list data to file
 * حفظ البيانات إلى الملف
 * ============================
 */
async function saveList(data) {
    try {
        await fs.writeFile(path, JSON.stringify(data, null, 2), 'utf8');
        deleteCache('list-group');
        logWithTime('DELETE CACHE FILE', `list.json`, 'red');
    } catch (error) {
        console.error('Error saving list file:', error);
        throw error;
    }
}

/**
 * ============================
 * Add new keyword to a group
 * إضافة كلمة مفتاحية جديدة للمجموعة
 * ============================
 */
async function addList(groupId, keyword, content) {
    try {
        const groups = await readList();
        if (!groups[groupId]) {
            groups[groupId] = { createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), list: {} };
        }
        if (groups[groupId].list[keyword]) {
            return { success: false, message: `Keyword "${keyword}" already exists.` };
        }
        if (content && content.text) content.text = cleanText(content.text);
        groups[groupId].list[keyword] = { content, addedAt: new Date().toISOString() };
        groups[groupId].updatedAt = new Date().toISOString();
        await saveList(groups);
        return { success: true, message: 'Keyword added successfully.' };
    } catch (error) {
        console.error('Error adding to list:', error);
        return { success: false, message: 'Error adding to list.' };
    }
}

/**
 * ============================
 * Update existing keyword content
 * تحديث محتوى كلمة موجودة
 * ============================
 */
async function updateList(groupId, keyword, content) {
    try {
        const groups = await readList();
        if (!groups[groupId]) {
            groups[groupId] = { createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), list: {} };
        }
        if (groups[groupId].list[keyword]) {
            groups[groupId].list[keyword] = { content, updatedAt: new Date().toISOString() };
        } else {
            return { success: false, message: `Keyword "${keyword}" not found!` };
        }
        groups[groupId].updatedAt = new Date().toISOString();
        await saveList(groups);
        return { success: true, message: `Keyword "${keyword}" processed successfully.` };
    } catch (error) {
        console.error('Error updating list:', error);
        return { success: false, message: 'Error updating list.' };
    }
}

/**
 * ============================
 * Rename or update a keyword
 * إعادة تسمية أو تحديث كلمة مفتاحية
 * ============================
 */
async function updateKeyword(groupId, oldKeyword, newKeyword) {
    try {
        const groups = await readList();
        if (!groups[groupId]) return { success: false, message: `Group "${groupId}" does not exist.` };
        if (!groups[groupId].list[oldKeyword]) return { success: false, message: `Keyword "${oldKeyword}" not found.` };
        if (groups[groupId].list[newKeyword]) return { success: false, message: `Keyword "${newKeyword}" already exists.` };
        groups[groupId].list[newKeyword] = { ...groups[groupId].list[oldKeyword], updatedAt: new Date().toISOString() };
        delete groups[groupId].list[oldKeyword];
        groups[groupId].updatedAt = new Date().toISOString();
        await saveList(groups);
        return { success: true, message: 'Keyword successfully updated.' };
    } catch (error) {
        return { success: false, message: 'Error updating keyword.' };
    }
}

/**
 * ============================
 * Delete a keyword
 * حذف كلمة مفتاحية
 * ============================
 */
async function deleteList(groupId, keyword) {
    try {
        const groups = await readList();
        if (!groups[groupId]) return { success: false, message: `Group "${groupId}" does not exist.` };
        if (!groups[groupId].list[keyword]) return { success: false, message: `Keyword "${keyword}" does not exist in group.` };
        const media = groups[groupId].list[keyword].content.media;
        if (media) {
            const filePath = `./database/media/${media}`;
            try { await fs.unlink(filePath); } catch (error) { if (error.code !== 'ENOENT') console.error(`Failed to delete file ${media}:`, error); }
        }
        delete groups[groupId].list[keyword];
        groups[groupId].updatedAt = new Date().toISOString();
        await saveList(groups);
        return { success: true, message: `Keyword "${keyword}" deleted successfully.` };
    } catch (error) {
        console.error('Error deleting from list:', error);
        return { success: false, message: 'Error deleting from list.' };
    }
}

/**
 * ============================
 * Delete all keywords in a group
 * حذف كل الكلمات المفتاحية في المجموعة
 * ============================
 */
async function deleteAllListInGroup(groupId) {
    try {
        const groups = await readList();
        if (!groups[groupId]) return { success: false, message: `Group "${groupId}" does not exist.` };
        const list = groups[groupId].list;
        const mediaDir = './database/media/';
        for (const keyword in list) {
            const media = list[keyword]?.content?.media;
            if (media) {
                const filePath = path.join(mediaDir, media);
                try { await fs.unlink(filePath); } catch (error) { if (error.code !== 'ENOENT') console.error(`Failed to delete media file "${media}":`, error); }
            }
        }
        groups[groupId].list = {};
        groups[groupId].updatedAt = new Date().toISOString();
        await saveList(groups);
        return { success: true, message: `All keywords in group "${groupId}" deleted successfully.` };
    } catch (error) {
        console.error('Error deleting all list in group:', error);
        return { success: false, message: 'Failed to delete all keywords.' };
    }
}

// ============================
// Export functions
// تصدير الوظائف
// ============================
module.exports = {
    readList,
    addList,
    getDataByGroupId,
    updateList,
    updateKeyword,
    deleteList,
    deleteAllListInGroup
};