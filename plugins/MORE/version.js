// Import utilities and config / استيراد الأدوات والإعدادات
const { reply } = require('@lib/utils');
const config = require('@config');
const fs = require('fs');
const path = require('path');

async function handle(sock, messageInfo) {
    const { m } = messageInfo; // Original message object / الرسالة الأصلية
    let baileysVersion = 'Tidak ditemukan'; // Default if Baileys version is not found / القيمة الافتراضية

    try {
        // Get path to Baileys package.json / جلب مسار package.json لمكتبة Baileys
        const pkgPath = require.resolve('baileys/package.json');
        const pkgData = fs.readFileSync(pkgPath, 'utf-8'); // Read the file / قراءة الملف
        const pkg = JSON.parse(pkgData); // Parse JSON / تحويل النص إلى JSON

        baileysVersion = pkg.version; // Store Baileys version / تخزين النسخة
    } catch (error) {
        console.warn('[!] Gagal membaca versi Baileys:', error.message); // Log error / تسجيل الخطأ
    }

    // Prepare response message / تحضير رسالة الرد
    const responseText = [
        `◧ ᴠᴇʀꜱɪ ꜱᴄ : ${config.version}`, // Bot version / نسخة البوت
        `◧ ʙᴀɪʟᴇʏꜱ   : v${baileysVersion}`     // Baileys version / نسخة مكتبة Baileys
    ].join('\n');

    await reply(m, responseText); // Send response / إرسال الرد
}

module.exports = {
    handle,
    Commands: ['version', 'versi'], // Commands that trigger this handler / أسماء الأوامر
    OnlyPremium: false,
    OnlyOwner: false
};