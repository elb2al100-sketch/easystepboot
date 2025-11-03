const { reply } = require('@lib/utils');
const config = require('@config');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

async function handle(sock, messageInfo) {
    const { m, remoteJid, message } = messageInfo;

    // Initialize version info
    // تهيئة معلومات الإصدار
    let oldVersion = 'Tidak ditemukan'; // Not found / غير موجود
    let newVersion = 'Tidak ditemukan';
    let updateInfo = '';

    try {
        // Read current version of Baileys from package.json
        // قراءة إصدار Baileys الحالي من package.json
        const pkgPath = require.resolve('baileys/package.json');
        const pkgData = fs.readFileSync(pkgPath, 'utf-8');
        const pkg = JSON.parse(pkgData);
        oldVersion = pkg.version;
    } catch (error) {
        console.warn('[!] Failed to read old Baileys version:', error.message);
        // فشل قراءة الإصدار القديم
    }

    try {
        // Send loading reaction 🤌🏻
        // إرسال رد فعل تحميل 🤌🏻
        await sock.sendMessage(remoteJid, { react: { text: "🤌🏻", key: message.key } });

        // Update Baileys via npm
        // تحديث Baileys باستخدام npm
        execSync('npm install baileys', { stdio: 'ignore' });

        // Clear cache module to read new version
        // حذف cache الموديول لقراءة الإصدار الجديد
        const resolvedPath = require.resolve('baileys/package.json');
        delete require.cache[resolvedPath];

        const newPkgData = fs.readFileSync(resolvedPath, 'utf-8');
        const newPkg = JSON.parse(newPkgData);
        newVersion = newPkg.version;

        // Compare old and new version
        // مقارنة الإصدار القديم بالجديد
        if (newVersion !== oldVersion) {
            updateInfo = `✅ *baileys* berhasil diperbarui dari v${oldVersion} ke v${newVersion}`;
            // ✅ *baileys* successfully updated from vOLD to vNEW
        } else {
            updateInfo = `✅ *baileys* sudah versi terbaru: v${newVersion}`;
            // ✅ *baileys* already at latest version
        }
    } catch (err) {
        console.error('[!] Failed to update baileys:', err.message);
        updateInfo = '❌ Terjadi kesalahan saat memperbarui *baileys*';
        // ❌ An error occurred while updating baileys
    }

    const responseText = [
        updateInfo
    ].join('\n');

    // Send final result message
    // إرسال رسالة النتيجة النهائية
    await reply(m, responseText);
}

module.exports = {
    handle,
    Commands: ['updatebaileys', 'updatebailey'],
    OnlyPremium: false,
    OnlyOwner: false
};