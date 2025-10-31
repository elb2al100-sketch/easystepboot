const fs = require('fs');
const path = require('path');
const config = require("@config");
const { logWithTime } = require('@lib/utils');
const mode = config.mode; // 🇬🇧 Can be 'production' or 'development' / 🇸🇦 يمكن أن تكون 'production' أو 'development'

const handlers = []; // 🇬🇧 Array to store all handlers / 🇸🇦 مصفوفة لتخزين جميع المعالجات

/**
 * 🇬🇧 Recursive function to load all `.js` files from a directory and its subdirectories
 * 🇸🇦 دالة تكرارية لتحميل جميع ملفات `.js` من المجلد والمجلدات الفرعية
 */
function loadHandlers(dir) {
    fs.readdirSync(dir).forEach((file) => {
        const fullPath = path.join(dir, file);

        if (fs.statSync(fullPath).isDirectory()) {
            // 🇬🇧 If it's a folder, recurse into it / 🇸🇦 إذا كان مجلدًا، نفذ التكرار داخله
            loadHandlers(fullPath);
        } else if (file.endsWith('.js')) {
            // 🇬🇧 If it's a JavaScript file, import and add to handlers / 🇸🇦 إذا كان ملف JavaScript، استورده وأضفه للمعالجات
            const handler = require(fullPath);
            if (typeof handler.process === 'function') {
                // 🇬🇧 Set default priority 100 if not defined / 🇸🇦 تعيين أولوية افتراضية 100 إذا لم تُحدد
                if (typeof handler.priority === 'undefined') {
                    handler.priority = 100;
                }
                handlers.push(handler);
            }
        }
    });
}

// 🇬🇧 Load all files from `handle` folder and its subfolders / 🇸🇦 تحميل جميع الملفات من مجلد `handle` والمجلدات الفرعية
loadHandlers(path.join(__dirname, '../handle'));

// 🇬🇧 Sort handlers by priority (ascending) / 🇸🇦 ترتيب المعالجات حسب الأولوية من الأصغر للأكبر
handlers.sort((a, b) => a.priority - b.priority);

logWithTime('System', `Load All Handler done...`);

/**
 * 🇬🇧 Pre-process function to execute all handlers sequentially
 * 🇸🇦 دالة المعالجة المسبقة لتشغيل جميع المعالجات بالتسلسل
 */
module.exports = {
    async preProcess(sock, messageInfo) {
        let stopProcessing = false;

        // 🇬🇧 Execute each plugin sequentially / 🇸🇦 تنفيذ كل إضافة بالترتيب
        for (const handler of handlers) {
            if (stopProcessing) break;

            try {
                const result = await handler.process(sock, messageInfo);

                // 🇬🇧 If handler requests to stop further processing / 🇸🇦 إذا طلب المعالج إيقاف المعالجة التالية
                if (result === false) {
                    logWithTime('System', `Handler ${handler.name || 'anonymous'} menghentikan pemrosesan.`);
                    stopProcessing = true;
                    return false;
                }
            } catch (error) {
                console.error(`Error pada handler ${handler.name || 'anonymous'}:`, error.message);
            }
        }

        return true; // 🇬🇧 Continue to next plugins / 🇸🇦 استمر إلى الإضافات التالية
    },
};