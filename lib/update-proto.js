const fs = require('fs');
const path = require('path');
const { https } = require('follow-redirects');

const protoFiles = ['dist/index.d.ts', 'dist/index.js', 'WAProto.proto']; // Files to update / الملفات المراد تحديثها
const protoUrl = 'https://raw.githubusercontent.com/Akkun3704/wa-proto/main/'; // Base URL for files / رابط قاعدة الملفات
const protoDirectory = path.join(process.cwd(), 'node_modules', '@whiskeysockets', 'baileys', 'WAProto'); // WAProto folder path / مسار مجلد WAProto

// Function to fetch file from URL / دالة لجلب الملف من الإنترنت
function fetchFile(url, filePath) {
    return new Promise((resolve) => {
        const tempFilePath = filePath + '.tmp'; // Temporary file / ملف مؤقت

        https.get(url, (res) => {
            if (res.statusCode !== 200) {
                console.warn(`⚠️ Failed to download ${url} (Status: ${res.statusCode}) / فشل تنزيل الملف ${url} (الحالة: ${res.statusCode})`);
                return resolve(false);
            }

            const fileStream = fs.createWriteStream(tempFilePath);
            res.pipe(fileStream);

            fileStream.on('finish', () => {
                fileStream.close();
                fs.rename(tempFilePath, filePath, (err) => { // Replace file only if successful / استبدال الملف فقط إذا نجح
                    if (err) {
                        console.warn(`⚠️ Failed to replace file ${filePath} / فشل استبدال الملف ${filePath}`);
                        return resolve(false);
                    }
                    resolve(true);
                });
            });

            fileStream.on('error', (err) => {
                console.warn(`⚠️ Error saving file: ${filePath} - ${err.message} / خطأ أثناء حفظ الملف: ${filePath} - ${err.message}`);
                fs.unlink(tempFilePath, () => resolve(false)); // Delete temporary file if error / حذف الملف المؤقت في حالة الخطأ
            });
        }).on('error', (err) => {
            console.warn(`⚠️ Error downloading: ${url} - ${err.message} / خطأ أثناء تنزيل الملف: ${url} - ${err.message}`);
            resolve(false);
        });
    });
}

// Function to update WAProto files / دالة لتحديث ملفات WAProto
async function updateWAProto() {
    if (!fs.existsSync(protoDirectory)) {
        console.warn('⚠️ WAProto folder not found. Make sure Baileys is installed. / مجلد WAProto غير موجود. تأكد من تثبيت Baileys.');
        return;
    }

    let successCount = 0;
    for (const file of protoFiles) {
        const filePath = path.join(protoDirectory, path.basename(file));
        const success = await fetchFile(protoUrl + file, filePath);
        if (success) successCount++;
    }

    console.log(`✅ Update completed: ${successCount}/${protoFiles.length} files successfully updated. / التحديث اكتمل: ${successCount}/${protoFiles.length} ملف تم تحديثه بنجاح.`);
}

// Export function / تصدير الدالة
module.exports = updateWAProto;