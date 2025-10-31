const fs = require('fs').promises; // Using fs.promises for asynchronous operations
const ABSEN_FILE_PATH = './database/additional/absen.json'; // Constant for JSON file path
const { logWithTime } = require('@lib/utils');

/* 
  🇬🇧 Check if a file exists
  🇸🇦 التحقق مما إذا كان الملف موجودًا
*/
async function fileExists(filePath) {
    try {
        await fs.access(filePath);
        return true;
    } catch {
        return false;
    }
}

/* 
  🇬🇧 Read data from JSON file
  🇸🇦 قراءة البيانات من ملف JSON
*/
async function readAbsen() {
    try {
        if (!await fileExists(ABSEN_FILE_PATH)) {
            await fs.writeFile(ABSEN_FILE_PATH, JSON.stringify({}, null, 2), 'utf8'); // Create file if it doesn't exist
        }
        const data = await fs.readFile(ABSEN_FILE_PATH, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error(`[readAbsen] Error reading file: ${ABSEN_FILE_PATH}`, error);
        throw error;
    }
}

/* 
  🇬🇧 Save data to JSON file
  🇸🇦 حفظ البيانات في ملف JSON
*/
async function saveAbsen(data) {
    try {
        await fs.writeFile(ABSEN_FILE_PATH, JSON.stringify(data, null, 2), 'utf8');
        logWithTime('WRITE FILE', `absen.json`, 'red'); // Log writing file with color
    } catch (error) {
        console.error(`[saveAbsen] Error saving file: ${ABSEN_FILE_PATH}`, error);
        throw error;
    }
}

/* 
  🇬🇧 Add a new group
  🇸🇦 إضافة مجموعة جديدة
*/
async function createAbsen(id, userData) {
    const today = new Date().toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' });
    try {
        const groups = await readAbsen();
        if (groups[id]) {
            return false; // Group already exists
        }

        groups[id] = {
            ...userData,
            createdAt: today, // Consistent date format
        };

        await saveAbsen(groups);
        return true;
    } catch (error) {
        console.error(`[createAbsen] Error creating absen with ID "${id}":`, error);
        return false;
    }
}

/* 
  🇬🇧 Update group data
  🇸🇦 تحديث بيانات المجموعة
*/
async function updateAbsen(id, updateData) {
    try {
        const groups = await readAbsen();
        if (!groups[id]) {
            return false; // Group doesn't exist
        }

        groups[id] = {
            ...groups[id],
            ...updateData,
            updatedAt: new Date().toISOString(),
        };

        await saveAbsen(groups);
        return true;
    } catch (error) {
        console.error(`[updateAbsen] Error updating absen with ID "${id}":`, error);
        return false;
    }
}

/* 
  🇬🇧 Delete a group
  🇸🇦 حذف مجموعة
*/
async function deleteAbsen(id) {
    try {
        const groups = await readAbsen();
        if (!groups[id]) {
            return false; // Group doesn't exist
        }

        delete groups[id];
        await saveAbsen(groups);
        return true;
    } catch (error) {
        console.error(`[deleteAbsen] Error deleting absen with ID "${id}":`, error);
        return false;
    }
}

/* 
  🇬🇧 Find a group by ID
  🇸🇦 البحث عن مجموعة حسب المعرف
*/
async function findAbsen(id) {
    const today = new Date().toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' });
    try {
        const groups = await readAbsen();

        // Check if absen data exists
        const absenData = groups[id];
        if (!absenData) return null;

        if (absenData.createdAt !== today) {
            // Reset data if the day has changed
            absenData.member = []; // Clear members
            absenData.createdAt = today; // Update date

            // Save changes
            await saveAbsen(groups);
        }

        return absenData;
    } catch (error) {
        console.error(`[findAbsen] Error finding absen with ID "${id}":`, error);
        return null;
    }
}

// Export functions
module.exports = {
    readAbsen,
    saveAbsen,
    createAbsen,
    updateAbsen,
    deleteAbsen,
    findAbsen,
};