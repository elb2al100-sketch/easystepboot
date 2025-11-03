const fs = require('fs');
const path = require('path');

/**
 * ✅ Read file as buffer using alias path
 * قراءة الملف كـ Buffer باستخدام مسار مختصر (Alias)
 * 
 * @param {string} aliasPath - Path with alias, e.g. '@assets/image.png' 
 * @param {string} aliasPath - المسار مع alias، مثل '@assets/image.png'
 * @returns {Buffer} - File content as buffer / محتوى الملف كـ Buffer
 */
const readFileAsBuffer = (aliasPath) => {
    // Define aliases / تعريف المسارات المختصرة
    const aliases = {
        '@assets': path.resolve(__dirname, '../database/assets/'), // Change to your assets folder path / غيّر إلى مسار مجلد assets الخاص بك
    };

    // Split aliasPath into alias and rest of the path / تقسيم aliasPath إلى alias وبقية المسار
    const [alias, ...rest] = aliasPath.split('/');
    if (!aliases[alias]) {
        throw new Error(`Alias "${alias}" not found! / Alias "${alias}" غير موجود!`);
    }

    // Resolve full path / تحويل المسار إلى المسار الكامل
    const resolvedPath = path.join(aliases[alias], ...rest);
    if (!fs.existsSync(resolvedPath)) {
        throw new Error(`File "${resolvedPath}" not found! / الملف "${resolvedPath}" غير موجود!`);
    }

    // Read file as buffer / قراءة الملف كـ Buffer
    return fs.readFileSync(resolvedPath);
};

// Export function / تصدير الدالة لاستخدامها في ملفات أخرى
module.exports = { readFileAsBuffer };