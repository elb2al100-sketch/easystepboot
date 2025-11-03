// ================================================================
// 📂 Dynamic Plugin Loader with Caching
// 📂 محمّل الإضافات الديناميكي مع التخزين المؤقت
// ================================================================

const fs = require('fs');      // File System module / وحدة نظام الملفات
const path = require('path');  // Path module for handling file paths / وحدة المسارات للتعامل مع الملفات

// 🗂️ Define the plugins directory
// 🗂️ تحديد مسار مجلد الإضافات
const pluginsDir = path.join(process.cwd(), 'plugins');

// 💾 Cached menu data and last update time
// 💾 بيانات القائمة المخزّنة مؤقتًا ووقت آخر تحديث
let cachedMenu = {};
let lastUpdate = 0;

// ⏱️ Cache refresh interval (30 seconds)
// ⏱️ فترة تحديث الكاش (30 ثانية)
const CACHE_INTERVAL = 30 * 1000;

/**
 * 🔄 Load all plugin commands dynamically from plugins directory
 * 🔄 تحميل جميع أوامر الإضافات بشكل ديناميكي من مجلد plugins
 */
function loadMenu() {
    const menu = {};

    // 📁 Read all folders inside the plugins directory
    // 📁 قراءة جميع المجلدات داخل مجلد الإضافات
    fs.readdirSync(pluginsDir, { withFileTypes: true }).forEach(dirent => {
        if (!dirent.isDirectory()) return; // ❌ Skip files, only process directories / ❌ تجاهل الملفات، التعامل فقط مع المجلدات

        const category = dirent.name.toLowerCase();       // Category name (folder name) / اسم التصنيف (اسم المجلد)
        const categoryPath = path.join(pluginsDir, dirent.name);
        const commands = []; // Temporary array for commands / مصفوفة مؤقتة لتخزين الأوامر

        // 📜 Read all .js files in this category folder
        // 📜 قراءة جميع ملفات .js داخل مجلد التصنيف
        fs.readdirSync(categoryPath).forEach(file => {
            const filePath = path.join(categoryPath, file);
            if (!file.endsWith('.js')) return; // Ignore non-JS files / تجاهل الملفات غير الجافاسكربت

            try {
                // ♻️ Remove module from cache to allow reloading
                // ♻️ إزالة التخزين المؤقت للموديول للسماح بإعادة تحميله
                delete require.cache[require.resolve(filePath)];

                const plugin = require(filePath); // Import the plugin / استيراد الإضافة

                // ✅ If plugin exports a Commands array, add it to the list
                // ✅ إذا كانت الإضافة تحتوي على مصفوفة Commands، أضفها إلى القائمة
                if (plugin.Commands && Array.isArray(plugin.Commands)) {
                    commands.push(...plugin.Commands);
                }
            } catch (err) {
                // ⚠️ Error handling for failed plugin load
                // ⚠️ التعامل مع الخطأ في حال فشل تحميل الإضافة
                console.error(`❌ Failed to load file ${filePath}: / فشل تحميل الملف ${filePath}:`, err.message);
            }
        });

        // 📋 If there are commands, store them under their category
        // 📋 إذا كانت هناك أوامر، يتم تخزينها تحت تصنيفها
        if (commands.length > 0) {
            menu[category] = [...new Set(commands)]; // Remove duplicates / إزالة التكرارات
        }
    });

    return menu; // ✅ Return the final menu object / ✅ إرجاع كائن القائمة النهائي
}

/**
 * 🧠 Update cache only if time interval exceeded
 * 🧠 تحديث الكاش فقط إذا تجاوز الزمن المحدد
 */
function updateCacheIfNeeded() {
    const now = Date.now();
    if (now - lastUpdate > CACHE_INTERVAL) {
        cachedMenu = loadMenu(); // Reload the menu / إعادة تحميل القائمة
        lastUpdate = now;        // Update last timestamp / تحديث آخر وقت تحديث
    }
}

// ⚙️ Create a Proxy to handle automatic cache updates when accessing properties
// ⚙️ إنشاء Proxy لتحديث الكاش تلقائيًا عند الوصول إلى خاصية
const menu = new Proxy({}, {
    // 🧩 When a category is accessed, refresh cache first
    // 🧩 عند الوصول إلى أي تصنيف، يتم تحديث الكاش أولًا
    get(target, prop) {
        updateCacheIfNeeded();
        return cachedMenu[prop];
    },

    // 📜 For getting all keys (categories)
    // 📜 عند طلب جميع المفاتيح (التصنيفات)
    ownKeys() {
        updateCacheIfNeeded();
        return Reflect.ownKeys(cachedMenu);
    },

    // 🧱 Property descriptor for Proxy compliance
    // 🧱 واصف الخاصية لضمان عمل Proxy بشكل صحيح
    getOwnPropertyDescriptor() {
        updateCacheIfNeeded();
        return {
            enumerable: true,
            configurable: true
        };
    }
});

// 📤 Export the menu object for use in other modules
// 📤 تصدير كائن القائمة لاستخدامه في ملفات أخرى
module.exports = menu;