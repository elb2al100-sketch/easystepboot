const fs = require('fs');
const path = require('path');

/**
 * 🇬🇧 Read a file as Buffer using alias paths
 * 🇸🇦 قراءة ملف كـ Buffer باستخدام مسارات مختصرة (alias)
 * 
 * @param {string} aliasPath - e.g. '@assets/image.jpg'
 * @returns {Buffer} File content as Buffer
 */
const readFileAsBuffer = (aliasPath) => {
    // 🇬🇧 Define alias paths / 🇸🇦 تعريف المسارات المختصرة
    const aliases = {
        '@assets': path.resolve(__dirname, '../database/assets/'), // 🇸🇦 غيّرها حسب مكان مجلد assets
    };

    // 🇬🇧 Split alias from the rest of the path / 🇸🇦 فصل الاختصار عن باقي المسار
    const [alias, ...rest] = aliasPath.split('/');
    if (!aliases[alias]) {
        throw new Error(`Alias "${alias}" not found! / الاختصار "${alias}" غير موجود!`);
    }

    // 🇬🇧 Resolve full path / 🇸🇦 تحديد المسار الكامل
    const resolvedPath = path.join(aliases[alias], ...rest);
    if (!fs.existsSync(resolvedPath)) {
        throw new Error(`File "${resolvedPath}" not found! / الملف "${resolvedPath}" غير موجود!`);
    }

    // 🇬🇧 Read file as buffer / 🇸🇦 قراءة الملف كـ Buffer
    return fs.readFileSync(resolvedPath);
};

module.exports = { readFileAsBuffer };