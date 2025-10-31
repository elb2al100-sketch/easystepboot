const fs = require('fs');
const path = require('path');
const pluginsPath = path.join(process.cwd(), 'plugins'); 
// 📁 Path where all plugins are stored. | المسار الذي يتم فيه حفظ الإضافات (البلجنات)

let plugins = []; 
// 🧩 Array to store loaded plugins. | مصفوفة لتخزين الإضافات التي تم تحميلها.

/**
 * 🔹 Load all plugin files recursively from a given directory.
 * 🔹 تحميل جميع ملفات الإضافات بشكل متكرر من مجلد معين.
 */
async function loadPlugins(directory) {
    const loadedPlugins = [];

    try {
        const files = fs.readdirSync(directory); 
        // 📂 Read all files and folders inside the directory. | قراءة جميع الملفات والمجلدات داخل المجلد المحدد.

        for (const file of files) {
            const fullPath = path.join(directory, file);
            const stats = fs.statSync(fullPath);

            if (stats.isDirectory()) {
                // 🔁 If it's a folder, load its plugins recursively. | إذا كان مجلدًا، يتم تحميل الإضافات بداخله أيضًا.
                const subPlugins = await loadPlugins(fullPath);
                loadedPlugins.push(...subPlugins);
            } else if (file.endsWith('.js')) {
                try {
                    // 🧼 Clear the old cache before reloading the plugin. | حذف الكاش القديم قبل إعادة تحميل الإضافة.
                    delete require.cache[require.resolve(fullPath)];

                    // ⚙️ Load the plugin file using require(). | تحميل ملف الإضافة باستخدام require().
                    const plugin = require(fullPath);
                    loadedPlugins.push(plugin);
                } catch (error) {
                    console.error(`❌ ERROR: Failed to load plugin: ${fullPath} - ${error.message}`);
                    // ❌ خطأ: فشل في تحميل الإضافة المحددة.
                }
            }
        }
    } catch (error) {
        console.error(`❌ ERROR: Failed to read directory: ${directory} - ${error.message}`);
        // ❌ خطأ: فشل في قراءة المجلد المحدد.
    }
    return loadedPlugins; 
    // ✅ Return all successfully loaded plugins. | إرجاع جميع الإضافات التي تم تحميلها بنجاح.
}

/**
 * 🔄 Clear require() cache for all JS files inside the directory.
 * 🔄 مسح الكاش لجميع ملفات JavaScript داخل المجلد.
 */
function clearRequireCache(directory) {
    fs.readdirSync(directory).forEach(file => {
        const fullPath = path.join(directory, file);
        const stats = fs.statSync(fullPath);

        if (stats.isDirectory()) {
            // 📂 If folder, run recursively. | إذا كان مجلدًا، يتم تنفيذ الوظيفة بشكل متكرر.
            clearRequireCache(fullPath);
        } else if (file.endsWith('.js')) {
            try {
                const resolvedPath = require.resolve(fullPath);
                if (require.cache[resolvedPath]) {
                    delete require.cache[resolvedPath]; 
                    // 🧽 Remove the JS file from cache. | حذف الملف من ذاكرة الكاش.
                }
            } catch {
                // ⚠️ Ignore if file not found in cache. | تجاهل إذا لم يكن الملف موجودًا في الكاش.
            }
        }
    });
}

/**
 * ♻️ Reload all plugins dynamically.
 * ♻️ إعادة تحميل جميع الإضافات بشكل ديناميكي.
 */
async function reloadPlugins() {
    try {
        clearRequireCache(pluginsPath); 
        // 🧹 Clear old plugin cache. | تنظيف الكاش القديم للإضافات.

        plugins = await loadPlugins(pluginsPath); 
        // 🔄 Reload all plugins from folder. | إعادة تحميل جميع الإضافات من المجلد.

        if (plugins.length === 0) {
            console.warn('⚠️ WARNING: No plugins loaded.');
            // ⚠️ تحذير: لم يتم تحميل أي إضافة.
        }
    } catch (error) {
        console.error('❌ ERROR: Failed to reload plugins -', error.message);
        // ❌ خطأ: فشل في إعادة تحميل الإضافات.
    }

    return plugins; 
    // ✅ Return all currently loaded plugins. | إرجاع جميع الإضافات المحملة حاليًا.
}

module.exports = { reloadPlugins }; 
// 📦 Export the reloadPlugins function for use in other files. | تصدير وظيفة إعادة التحميل لاستخدامها في ملفات أخرى.