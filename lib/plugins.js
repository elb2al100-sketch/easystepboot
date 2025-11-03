const fs    = require('fs');   // File system module / مكتبة التعامل مع الملفات
const path  = require('path'); // Path utilities / مكتبة التعامل مع المسارات

// Path to plugins folder / مسار مجلد الإضافات
const pluginsPath = path.join(process.cwd(), 'plugins');

let plugins = []; // Array to store loaded plugins / مصفوفة لتخزين الإضافات المحملة

// Load plugins recursively from a directory / تحميل الإضافات بشكل متكرر من المجلد
async function loadPlugins(directory) {
    const loadedPlugins = [];

    try {
        const files = fs.readdirSync(directory); // Read all files/folders / قراءة جميع الملفات والمجلدات
        
        for (const file of files) {
            const fullPath = path.join(directory, file);
            const stats = fs.statSync(fullPath);

            if (stats.isDirectory()) {
                // If it's a folder, recursively load plugins / إذا كان مجلدًا، تحميل الإضافات داخله بشكل متكرر
                const subPlugins = await loadPlugins(fullPath);
                loadedPlugins.push(...subPlugins);
            } else if (file.endsWith('.js')) {
                // Only load .js files / تحميل ملفات .js فقط
                try {
                    // Clear require cache to reload the latest version / مسح ذاكرة require لإعادة تحميل النسخة الأحدث
                    delete require.cache[require.resolve(fullPath)];
                    const plugin = require(fullPath);
                    loadedPlugins.push(plugin);
                } catch (error) {
                    console.error(`❌ ERROR: Failed to load plugin: ${fullPath} - ${error.message}`);
                    // ❌ خطأ: فشل تحميل الإضافة
                }
            }
        }
    } catch (error) {
        console.error(`❌ ERROR: Failed to read directory: ${directory} - ${error.message}`);
        // ❌ خطأ: فشل قراءة المجلد
    }
    return loadedPlugins;
}

// Clear require cache for all .js files in a directory recursively
// مسح ذاكرة الكاش لجميع ملفات .js داخل المجلد بشكل متكرر
function clearRequireCache(directory) {
    fs.readdirSync(directory).forEach(file => {
        const fullPath = path.join(directory, file);
        const stats = fs.statSync(fullPath);

        if (stats.isDirectory()) {
            clearRequireCache(fullPath);
        } else if (file.endsWith('.js')) {
            try {
                const resolvedPath = require.resolve(fullPath);
                if (require.cache[resolvedPath]) {
                    delete require.cache[resolvedPath];
                }
            } catch {} // Ignore errors silently / تجاهل الأخطاء
        }
    });
}

// Reload all plugins / إعادة تحميل جميع الإضافات
async function reloadPlugins() {
    try {
        clearRequireCache(pluginsPath);          // Clear cache first / مسح الكاش أولاً
        plugins = await loadPlugins(pluginsPath); // Load plugins / تحميل الإضافات

        if (plugins.length === 0) {
            console.warn('⚠️ WARNING: No plugins loaded.');
            // ⚠️ تحذير: لم يتم تحميل أي إضافات
        }
    } catch (error) {
        console.error('❌ ERROR: Failed to reload plugins -', error.message);
        // ❌ خطأ: فشل إعادة تحميل الإضافات
    }
    return plugins;
}

module.exports = { reloadPlugins }; // Export reload function / تصدير دالة إعادة التحميل