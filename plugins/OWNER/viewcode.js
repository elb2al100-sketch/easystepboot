const { reply } = require("@lib/utils");
const fs = require('fs');
const path = require('path');

async function handle(sock, messageInfo) {
    const { m, prefix, command, content } = messageInfo;

    // Validate input / تحقق من الإدخال
    if (!content) {
        return await reply(
            m,
            `_Masukkan format yang valid_\n\n_Contoh:_ *${prefix + command} plugins/menu.js*`
        );
    }

    // Define base directory (bot working folder) / تحديد مجلد العمل الأساسي للبوت
    const baseDir = path.resolve(process.cwd());
    const targetPath = path.resolve(baseDir, content);

    // Protect against directory traversal / حماية من الوصول لمجلدات خارج البوت
    if (!targetPath.startsWith(baseDir)) {
        return await reply(m, '_Akses file ditolak: path tidak valid._');
    }

    // Check if file exists / التحقق من وجود الملف
    if (!fs.existsSync(targetPath)) {
        return await reply(m, `_File tidak ditemukan:_ *${content}*`);
    }

    // Only allow .js files / السماح فقط بملفات .js
    if (path.extname(targetPath) !== '.js') {
        return await reply(m, `_Hanya file .js yang diperbolehkan_`);
    }

    try {
        const fileContent = fs.readFileSync(targetPath, 'utf-8');

        // If content is too long, send as document / إذا كان المحتوى طويل جدًا أرسله كمستند
        if (fileContent.length > 4000) {
            await reply(m, '_Isi file terlalu panjang, dikirim sebagai dokumen..._');
            return await sock.sendMessage(m.key.remoteJid, {
                document: fs.readFileSync(targetPath),
                fileName: path.basename(targetPath),
                mimetype: 'text/javascript'
            }, { quoted: m });
        }

        // Send file content as text / إرسال محتوى الملف كنص
        return await reply(
            m,
            `📄 *Isi file:* _${content}_\n\n` + '```js\n' + fileContent + '\n```'
        );
    } catch (err) {
        console.error(err);
        return await reply(m, '_Gagal membaca file._'); // Failed to read file / فشل قراءة الملف
    }
}

module.exports = {
    handle,
    Commands: ['viewcode'], // Command name / اسم الأمر
    OnlyPremium: false,
    OnlyOwner: true
};