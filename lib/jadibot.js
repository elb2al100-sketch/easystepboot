const fs    = require('fs');
const path  = require('path');
const fsp   = require('fs').promises; // Using fs.promises for asynchronous operations / استخدام fs.promises للعمليات غير المتزامنة
const pathJson = './database/jadibot.json'; // JSON file location / موقع ملف JSON

/**
 * Check if file exists
 * التحقق مما إذا كان الملف موجودًا
 */
async function fileExists(path) {
    try {
        await fsp.access(path);
        return true;
    } catch {
        return false;
    }
}

/**
 * List all Jadibot entries
 * جلب جميع بيانات Jadibot
 */
async function listJadibot() {
    if (!await fileExists(pathJson)) {
        await fsp.writeFile(pathJson, JSON.stringify({}, null, 2), 'utf8'); // Create file if it doesn't exist / إنشاء الملف إذا لم يكن موجودًا
    }
    const data = await fsp.readFile(pathJson, 'utf8');
    return JSON.parse(data);
}

/**
 * Delete a Jadibot by number
 * حذف Jadibot بواسطة الرقم
 */
async function deleteJadibot(number) {
    let jadibots = await listJadibot();
    if (jadibots[number]) {
        delete jadibots[number];
        await fsp.writeFile(pathJson, JSON.stringify(jadibots, null, 2), 'utf8');
        return true;
    } else {
        console.log('Number not found / الرقم غير موجود');
        return false;
    }
}

/**
 * Get a Jadibot by number
 * الحصول على بيانات Jadibot بواسطة الرقم
 */
async function getJadibot(number) {
    let jadibots = await listJadibot();
    return jadibots[number] || null; // Return null if not found / إرجاع null إذا لم توجد بيانات
}

/**
 * Update or create a Jadibot entry
 * تحديث أو إنشاء Jadibot
 */
async function updateJadibot(number, status) {
    let jadibots = await listJadibot();
    if (jadibots[number]) {
        jadibots[number].status = status; // Update status / تحديث الحالة
    } else {
        jadibots[number] = { status: status }; // Create new entry / إنشاء سجل جديد
    }
    await fsp.writeFile(pathJson, JSON.stringify(jadibots, null, 2), 'utf8');
    return true;
}

// Export functions / تصدير الدوال
module.exports = { listJadibot, deleteJadibot, updateJadibot, getJadibot };