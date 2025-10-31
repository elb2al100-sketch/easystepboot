const fs = require('fs').promises;
const pathJson = './database/jadibot.json';

let cache = {}; // 🌟 cache in-memory لتخزين البيانات مؤقتًا
let loaded = false; // للتحقق من تحميل البيانات من الملف

/**
 * 🇬🇧 Load jadibot data from JSON file into memory
 * 🇸🇦 تحميل بيانات jadibot من ملف JSON إلى الذاكرة
 */
async function loadJadibot() {
    try {
        await fs.access(pathJson).catch(async () => {
            await fs.writeFile(pathJson, JSON.stringify({}, null, 2), 'utf8');
        });

        const data = await fs.readFile(pathJson, 'utf8');
        cache = JSON.parse(data);
        loaded = true;
        console.log(`[Jadibot] ✅ Loaded data from ${pathJson}`);
    } catch (error) {
        console.error('[Jadibot] ❌ Failed to load data:', error.message);
        cache = {};
    }
}

/**
 * 🇬🇧 Save the in-memory cache to JSON file
 * 🇸🇦 حفظ البيانات المؤقتة في الذاكرة إلى ملف JSON
 */
async function saveJadibot() {
    try {
        if (!loaded) await loadJadibot();
        await fs.writeFile(pathJson, JSON.stringify(cache, null, 2), 'utf8');
        console.log('[Jadibot] 💾 Data saved successfully');
    } catch (error) {
        console.error('[Jadibot] ❌ Failed to save data:', error.message);
    }
}

/**
 * 🇬🇧 List all jadibot entries
 * 🇸🇦 عرض جميع سجلات jadibot
 */
async function listJadibot() {
    if (!loaded) await loadJadibot();
    return cache;
}

/**
 * 🇬🇧 Get a specific jadibot entry by number
 * 🇸🇦 جلب سجل jadibot بواسطة الرقم
 */
async function getJadibot(number) {
    if (!loaded) await loadJadibot();
    return cache[number] || null;
}

/**
 * 🇬🇧 Update or create a jadibot entry
 * 🇸🇦 تحديث أو إنشاء سجل jadibot
 */
async function updateJadibot(number, status) {
    if (!loaded) await loadJadibot();
    cache[number] = { status };
    await saveJadibot();
    console.log(`[Jadibot] ✏️ Updated ${number} with status: ${status}`);
    return true;
}

/**
 * 🇬🇧 Delete a jadibot entry by number
 * 🇸🇦 حذف سجل jadibot بواسطة الرقم
 */
async function deleteJadibot(number) {
    if (!loaded) await loadJadibot();
    if (cache[number]) {
        delete cache[number];
        await saveJadibot();
        console.log(`[Jadibot] 🗑️ Deleted ${number}`);
        return true;
    }
    console.log(`[Jadibot] ⚠️ Number ${number} not found`);
    return false;
}

// 🌟 احفظ تلقائيًا كل 1 دقيقة لتقليل فقدان البيانات
setInterval(saveJadibot, 60 * 1000);

// 🇬🇧 Export functions / 🇸🇦 تصدير الدوال
module.exports = { listJadibot, getJadibot, updateJadibot, deleteJadibot, saveJadibot, loadJadibot };