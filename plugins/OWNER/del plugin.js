const fs = require('fs');
const path = require('path');
const levenshtein = require('fast-levenshtein'); // Make sure to install this package with `npm install fast-levenshtein` | تأكد من تثبيت الحزمة باستخدام `npm install fast-levenshtein`

async function handle(sock, messageInfo) {
    const { m, prefix, command, content, remoteJid, message } = messageInfo;

    // Validate input | التحقق من الإدخال
    if (!content.trim()) {
        return await sock.sendMessage(remoteJid, {
            text: `_⚠️ Usage Format | صيغة الاستخدام:_ \n\n_💬 Example | مثال:_ _*${prefix + command} qc.js*_`
        }, { quoted: message });
    }

    const fileName = content.trim();
    const folderPath = path.join(process.cwd(), './plugins/');

    // Function to search file in folder and sub-folders | دالة للبحث عن الملف في المجلدات الفرعية
    function findFileAndClosestMatch(dir, targetFileName) {
        let foundFile = null;
        let closestMatch = null;
        let closestDistance = Infinity;

        function search(directory) {
            const files = fs.readdirSync(directory);

            for (const file of files) {
                const fullPath = path.join(directory, file);
                const stat = fs.statSync(fullPath);

                if (stat.isDirectory()) {
                    search(fullPath);
                } else {
                    if (file === targetFileName) {
                        foundFile = fullPath;
                    }

                    const distance = levenshtein.get(file, targetFileName);
                    if (distance < closestDistance) {
                        closestDistance = distance;
                        closestMatch = fullPath;
                    }
                }
            }
        }

        search(dir);
        return { foundFile, closestMatch };
    }

    const { foundFile, closestMatch } = findFileAndClosestMatch(folderPath, fileName);

    if (foundFile) {
        // Delete the found file | حذف الملف الذي تم العثور عليه
        fs.unlinkSync(foundFile);
        return await sock.sendMessage(remoteJid, {
            text: `_✅ Plugin named *${fileName}* has been successfully deleted! | تم حذف الإضافة *${fileName}* بنجاح!_\n\n_Restart the server to apply changes | أعد تشغيل السيرفر لتطبيق التغييرات_`
        }, { quoted: message });
    } else if (closestMatch) {
        return await sock.sendMessage(remoteJid, {
            text: `_❌ Plugin named *${fileName}* not found! | الإضافة *${fileName}* غير موجودة!_\n\n🔍 _Did you mean: *${path.basename(closestMatch)}*? | هل تقصد: *${path.basename(closestMatch)}*؟_`
        }, { quoted: message });
    } else {
        return await sock.sendMessage(remoteJid, {
            text: `_❌ Plugin named *${fileName}* not found and no similar files exist! | الإضافة *${fileName}* غير موجودة ولا توجد ملفات مشابهة._`
        }, { quoted: message });
    }
}

module.exports = {
    handle,
    Commands    : ['delplugin', 'delplugins'],
    OnlyPremium : false,
    OnlyOwner   : true,
};