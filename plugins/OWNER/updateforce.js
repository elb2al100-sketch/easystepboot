const fs = require('fs');
const fsp = require('fs').promises;
const path = require('path');
const axios = require('axios');
const fse = require('fs-extra');
const config = require("@config");
const { execSync } = require("child_process");

async function handle(sock, messageInfo) {
    const { remoteJid, message, content } = messageInfo;

    // Function to check if "path" is required in the update.js file
    // دالة للتحقق مما إذا كان الملف update.js يحتاج require("path")
    async function checkWordInFile() {
        try {
            const r = await fsp.readFile(`${process.cwd()}/plugins/OWNER/update.js`, "utf8");
            return /require\(["']path["']\)/.test(r.slice(0, 200));
        } catch (r) {
            console.error("Error reading file:", r);
            return false;
        }
    }

    const isNoenc = await checkWordInFile();
    const token = isNoenc ? 'NOENC' : '';
    const version = '4.0'; // Current bot version / الإصدار الحالي للبوت

    // Send processing reaction
    // إرسال رد فعل أثناء المعالجة
    await sock.sendMessage(remoteJid, { react: { text: "🤌🏻", key: message.key } });

    try {
        const serverUrl = `https://api.autoresbot.com/api/updates/resbot?apikey=${config.APIKEY}&version=${version}&token=${token}`;

        let data;
        try {
            const response = await axios.get(serverUrl);
            data = response.data;
        } catch (error) {
            const errorMessage = error.response?.data?.message || 
                `_Gagal mengambil data pembaruan dari server. Silakan coba lagi nanti._`;
            await sock.sendMessage(remoteJid, { text: errorMessage }, { quoted: message });
            return;
        }

        // If no updates are available
        // إذا لم تتوفر تحديثات
        if (data.status && data.updates.length === 0) {
            await sock.sendMessage(remoteJid, { 
                text: `⚠️ _Script sudah menggunakan versi terbaru._\n\n_Version : ${global.version}_`, 
                quoted: message 
            });
            return;
        }

        let zipData;
        try {
            let zipUrl;
            if (content.toLowerCase() === '-y') {
                // Force update to latest version
                // تحديث مباشر لآخر إصدار
                zipUrl = `https://api.autoresbot.com/api/updates/resbot?apikey=${config.APIKEY}&version=${version}&update=true&token=${token}`;
            } else if (content.toLowerCase() === '-fix') {
                // Special fix update
                // تحديث إصلاح خاص
                zipUrl = `https://api.autoresbot.com/api/updates/resbot?apikey=${config.APIKEY}&version=${version}&update=true&token=c4ca4238a0b923820dcc509a6f75849b`;
            } else {
                // Show available updates without downloading
                // عرض التحديثات المتوفرة بدون تحميل
                const latestUpdate = data.updates[data.updates.length - 1];
                let messageText = `✅ _Update Tersedia_\n\n` +
                    `_Versi Saat Ini_ : ${global.version}\n` +
                    `_Versi Tersedia_ : ${latestUpdate.version}\n\n` +
                    `◧ *List Update Files*\n\n` +
                    latestUpdate.files.map(item => `- ${item.name}`).join("\n") +
                    `\n\n_Catatan Update_ : ${latestUpdate.noted}\n\n` +
                    `_Untuk memperbarui script ketik *.updateforce -y*_\n\n` +
                    `⚠️ _Proses ini akan memperbarui script ke versi terbaru secara keseluruhan_`;
                
                await sock.sendMessage(remoteJid, { text: messageText }, { quoted: message });
                return;
            }

            // Download the ZIP update
            // تحميل تحديث ZIP
            zipData = await axios.get(zipUrl, { responseType: 'arraybuffer' });
        } catch (error) {
            console.error('Error downloading update ZIP:', error.message);
            await sock.sendMessage(remoteJid, { 
                text: `⚠️ _Gagal mengunduh file pembaruan. Silakan coba lagi nanti._`, 
                quoted: message 
            });
            return;
        }

        if (!zipData) return;

        const zipFilePath = path.join(process.cwd(), 'updates.zip');
        fs.writeFileSync(zipFilePath, zipData.data);

        const outputDir = path.join(process.cwd(), 'updates');
        fse.removeSync(outputDir);
        fs.mkdirSync(outputDir, { recursive: true });

        try {
            console.log("📂 Mengekstrak ZIP menggunakan sistem unzip...");
            execSync(`unzip -o updates.zip -d updates/`, { stdio: "inherit" });
        } catch (error) {
            console.error("❌ Gagal mengekstrak file ZIP:", error);
            return;
        } finally {
            fs.unlinkSync(zipFilePath); // Remove ZIP after extraction
            // حذف ZIP بعد فك الضغط
        }

        const sourceDir = path.join(outputDir, 'files');
        const targetDir = process.cwd();

        if (!fs.existsSync(sourceDir)) {
            console.error(`❌ Folder sumber tidak ditemukan: ${sourceDir}`);
            await sock.sendMessage(remoteJid, { text: `❌ _Folder sumber tidak ditemukan!_`, quoted: message });
            return;
        }

        // Copy update files to bot directory
        // نسخ الملفات الجديدة إلى مجلد البوت
        try {
            fse.copySync(sourceDir, targetDir, { overwrite: true });
        } catch (error) {
            console.error('Error copying files:', error.message);
            await sock.sendMessage(remoteJid, { text: `⚠️ _Gagal menyalin file pembaruan._`, quoted: message });
            return;
        }

        fse.removeSync(outputDir);

        // Send success message
        // إرسال رسالة نجاح
        await sock.sendMessage(remoteJid, { 
            text: `✅ _Pembaruan berhasil dilakukan!_ \n\n_Silakan restart server anda atau bisa mengetik *.restart*_`, 
            quoted: message 
        });

    } catch (error) {
        console.error('Unexpected error:', error.message);
        await sock.sendMessage(remoteJid, { 
            text: `❌ _Gagal memperbarui script. Silakan coba lagi nanti._`, 
            quoted: message 
        });
    }
}

module.exports = {
    handle,
    Commands: ['updateforce'],
    OnlyPremium: false,
    OnlyOwner: true
};