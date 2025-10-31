const fs = require('fs');
const path = require('path');
const { https } = require('follow-redirects');

// Files to update
// الملفات المراد تحديثها
const protoFiles = ['dist/index.d.ts', 'dist/index.js', 'WAProto.proto'];
const protoUrl = 'https://raw.githubusercontent.com/Akkun3704/wa-proto/main/';
const protoDirectory = path.join(process.cwd(), 'node_modules', '@whiskeysockets', 'baileys', 'WAProto');

// Fetch file from URL and save locally
// جلب الملف من URL وحفظه محليًا
function fetchFile(url, filePath) {
    return new Promise((resolve) => {
        const tempFilePath = filePath + '.tmp'; // Temporary file
        // ملف مؤقت

        https.get(url, (res) => {
            if (res.statusCode !== 200) {
                console.warn(`⚠️ Failed to download ${url} (Status: ${res.statusCode})`);
                // فشل في تحميل الملف
                return resolve(false);
            }

            const fileStream = fs.createWriteStream(tempFilePath);
            res.pipe(fileStream);

            fileStream.on('finish', () => {
                fileStream.close();
                fs.rename(tempFilePath, filePath, (err) => { // Replace file only if successful
                    // استبدال الملف فقط إذا تم بنجاح
                    if (err) {
                        console.warn(`⚠️ Failed to replace file ${filePath}`);
                        return resolve(false);
                    }
                    resolve(true);
                });
            });

            fileStream.on('error', (err) => {
                console.warn(`⚠️ Error saving: ${filePath} - ${err.message}`);
                // خطأ أثناء حفظ الملف
                fs.unlink(tempFilePath, () => resolve(false)); // Delete temporary file if error
                // حذف الملف المؤقت في حال حدوث خطأ
            });
        }).on('error', (err) => {
            console.warn(`⚠️ Error downloading: ${url} - ${err.message}`);
            // خطأ أثناء تحميل الملف
            resolve(false);
        });
    });
}

// Update WAProto files
// تحديث ملفات WAProto
async function updateWAProto() {
    if (!fs.existsSync(protoDirectory)) {
        console.warn('⚠️ WAProto folder not found. Make sure Baileys is installed.');
        // مجلد WAProto غير موجود. تأكد من تثبيت Baileys
        return;
    }

    let successCount = 0;
    for (const file of protoFiles) {
        const filePath = path.join(protoDirectory, path.basename(file));
        const success = await fetchFile(protoUrl + file, filePath);
        if (success) successCount++;
    }

    console.log(`✅ Update completed: ${successCount}/${protoFiles.length} files successfully updated.`);
    // التحديث اكتمل: عدد الملفات التي تم تحديثها بنجاح
}

module.exports = updateWAProto;