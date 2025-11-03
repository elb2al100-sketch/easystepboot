const fs        = require('fs');
const path      = require('path');
const config    = require("@config");
const { logWithTime } = require('@lib/utils');
const mode = config.mode; // Can be 'production' or 'development' / يمكن أن يكون 'production' أو 'development'

const handlers = [];

/**
 * Recursive function to load all .js files from a folder and subfolders
 * دالة تكرارية لتحميل جميع ملفات .js من المجلد والمجلدات الفرعية
 */
function loadHandlers(dir) {
    fs.readdirSync(dir).forEach((file) => {
        const fullPath = path.join(dir, file);

        if (fs.statSync(fullPath).isDirectory()) {
            // If it's a folder, recurse / إذا كان مجلدًا، اعمل تكرار
            loadHandlers(fullPath);
        } else if (file.endsWith('.js')) {
            // If it's a JavaScript file, import and add to handlers / إذا كان ملف جافاسكريبت، استورده وأضفه إلى handlers
            const handler = require(fullPath);
            if (typeof handler.process === 'function') {
                // Assign default priority 100 if not defined / إعطاء أولوية افتراضية 100 إذا لم تُحدد
                if (typeof handler.priority === 'undefined') {
                    handler.priority = 100;
                }
                handlers.push(handler);
            }
        }
    });
}

// Load all files from the `handle` folder and its subfolders
// تحميل جميع الملفات من مجلد `handle` والمجلدات الفرعية
loadHandlers(path.join(__dirname, '../handle'));

// Sort handlers by priority (ascending order)
// ترتيب handlers حسب الأولوية (من الأصغر للأكبر)
handlers.sort((a, b) => a.priority - b.priority);

logWithTime('System', `Load All Handler done... / تم تحميل جميع handlers`);
module.exports = {
    /**
     * Execute all handlers in order before main processing
     * تنفيذ جميع handlers بالترتيب قبل المعالجة الرئيسية
     */
    async preProcess(sock, messageInfo) {
        let stopProcessing = false;

        // Run each plugin sequentially / تنفيذ كل plugin بالتتابع
        for (const handler of handlers) {
            if (stopProcessing) break;

            try {
                const result = await handler.process(sock, messageInfo);

                // If handler requests to stop further processing
                // إذا أي handler طلب إيقاف المعالجة التالية
                if (result === false) {
                    logWithTime('System', `Handler ${handler.name || 'anonymous'} stopped further processing. / أوقف handler ${handler.name || 'anonymous'} المعالجة`);
                    stopProcessing = true;
                    return false;
                }
            } catch (error) {
                console.error(`Error in handler ${handler.name || 'anonymous'}: / خطأ في handler ${handler.name || 'anonymous'}:`, error.message);
            }
        }

        return true; // Continue to next plugins / تابع إلى plugins التالية
    },
};