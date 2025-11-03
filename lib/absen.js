const fs = require('fs').promises; // Menggunakan fs.promises untuk operasi asinkron
// Using fs.promises for asynchronous operations
// استخدام fs.promises لعمليات غير متزامنة
const ABSEN_FILE_PATH = './database/additional/absen.json'; // Konstanta untuk path file JSON
// Constant for the JSON file path
// ثابت لمسار ملف JSON
const { logWithTime }  = require('@lib/utils');

// Mengecek apakah file ada
// Check if file exists
// التحقق مما إذا كان الملف موجود
async function fileExists(filePath) {
    try {
        await fs.access(filePath);
        return true;
    } catch {
        return false;
    }
}

// Membaca data dari file JSON
// Read data from JSON file
// قراءة البيانات من ملف JSON
async function readAbsen() {
    try {
        if (!await fileExists(ABSEN_FILE_PATH)) {
            await fs.writeFile(ABSEN_FILE_PATH, JSON.stringify({}, null, 2), 'utf8'); 
            // Buat file jika belum ada
            // Create file if it doesn't exist
            // إنشاء الملف إذا لم يكن موجوداً
        }
        const data = await fs.readFile(ABSEN_FILE_PATH, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error(`[readAbsen] Error reading file: ${ABSEN_FILE_PATH}`, error);
        throw error;
    }
}

// Menyimpan data ke file JSON
// Save data to JSON file
// حفظ البيانات في ملف JSON
async function saveAbsen(data) {
    try {
        await fs.writeFile(ABSEN_FILE_PATH, JSON.stringify(data, null, 2), 'utf8');
        logWithTime('WRITE FILE', `absen.json`, 'merah');
    } catch (error) {
        console.error(`[saveAbsen] Error saving file: ${ABSEN_FILE_PATH}`, error);
        throw error;
    }
}

// Menambahkan grup baru
// Add a new group
// إضافة مجموعة جديدة
async function createAbsen(id, userData) {
    const today = new Date().toLocaleDateString('id-ID', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    });
    try {
        const groups = await readAbsen();
        if (groups[id]) {
            return false; // Group already exists
            // المجموعة موجودة بالفعل
        }

        groups[id] = {
            ...userData,
            createdAt: today, // Format tanggal konsisten
            // Set creation date consistently
            // تعيين تاريخ الإنشاء بشكل متسق
        };

        await saveAbsen(groups);
        return true;
    } catch (error) {
        console.error(`[createAbsen] Error creating absen with ID "${id}":`, error);
        return false;
    }
}

// Memperbarui data grup
// Update group data
// تحديث بيانات المجموعة
async function updateAbsen(id, updateData) {
    try {
        const groups = await readAbsen();
        if (!groups[id]) {
            return false; // Group not found
            // المجموعة غير موجودة
        }

        groups[id] = {
            ...groups[id],
            ...updateData,
            updatedAt: new Date().toISOString(),
        };

        await saveAbsen(groups);
        return true;
    } catch (error) {
        console.error(`[updateAbsen] Error updating absen with ID "${id}":`, error);
        return false;
    }
}

// Menghapus grup
// Delete group
// حذف مجموعة
async function deleteAbsen(id) {
    try {
        const groups = await readAbsen();
        if (!groups[id]) {
            return false; // Group not found
            // المجموعة غير موجودة
        }

        delete groups[id];
        await saveAbsen(groups);
        return true;
    } catch (error) {
        console.error(`[deleteAbsen] Error deleting absen with ID "${id}":`, error);
        return false;
    }
}

// Mencari grup berdasarkan ID
// Find group by ID
// البحث عن مجموعة حسب المعرف
async function findAbsen(id) {
    const today = new Date().toLocaleDateString('id-ID', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    });
    try {
        const groups = await readAbsen();

        // Cek apakah data absen tersedia
        // Check if absen data is available
        // التحقق مما إذا كانت بيانات الحضور متاحة
        const absenData = groups[id];
        if (!absenData) return null;

        if (absenData.createdAt !== today) {
            // Reset data jika hari berganti
            // Reset data if day changes
            // إعادة ضبط البيانات إذا تغير اليوم
            absenData.member = []; // Kosongkan anggota
            absenData.createdAt = today; // Perbarui tanggal

            // Simpan perubahan
            // Save changes
            // حفظ التغييرات
            await saveAbsen(groups);
        }

        return absenData;
    } catch (error) {
        console.error(`[findAbsen] Error finding absen with ID "${id}":`, error);
        return null;
    }
}

// Ekspor fungsi
// Export functions
// تصدير الدوال
module.exports = {
    readAbsen,
    saveAbsen,
    createAbsen,
    updateAbsen,
    deleteAbsen,
    findAbsen,
};