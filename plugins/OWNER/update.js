const fs = require('fs');
const fsp = require('fs').promises;
const path = require('path');
const axios = require('axios');
const fse = require('fs-extra');
const config = require("@config");
const { execSync } = require("child_process");

async function handle(sock, messageInfo) {
    const { remoteJid, message, content } = messageInfo;

    // Function to check if file contains certain word (NOENC check)
    // دالة للتحقق إذا كان الملف يحتوي على كلمة معينة (فحص NOENC)
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
    const version = global.version;

    // Send loading reaction ⏰
    // إرسال رد فعل تحميل ⏰
    await sock.sendMessage(remoteJid, { react: { text: "⏰", key: message.key } });

    try {
        const serverUrl = `https://api.autoresbot.com/api/updates/resbot?apikey=${config.APIKEY}&version=${version}&token=${token}`;

        let data;
        try {
            const response = await axios.get(serverUrl);
            data = response.data;
        } catch (error) {
            const errorMessage = error.response?.data?.message || 
                `_Failed to fetch update data from server. Please try again later._\n_Gagal mengambil data pembaruan dari server. Silakan coba lagi nanti._`;
            await sock.sendMessage(remoteJid, { text: errorMessage }, { quoted: message });
            return;
        }

        // Check if already latest version
        // تحقق إذا كان الإصدار هو الأحدث
        if (data.status && data.updates.length === 0) {
            await sock.sendMessage(remoteJid, { 
                text: `⚠️ _Script is already up to date._\n⚠️ _Script sudah menggunakan versi terbaru._\n\n_Version : ${global.version}_`, 
                quoted: message 
            });
            return;
        }

        let zipData;
        try {
            let zipUrl;
            if (content.toLowerCase() === '-y') {
                // Force update URL
                // رابط التحديث الإجباري
                zipUrl = `https://api.autoresbot.com/api/updates/resbot?apikey=${config.APIKEY}&version=${version}&update=true&token=${token}`;
            } else {
                // Show available updates without downloading
                // عرض التحديثات المتاحة دون تنزيل
                const latestUpdate = data.updates[data.updates.length - 1];
                let messageText = `✅ _Update Available_\n✅ _Update Tersedia_\n\n` +
                    `_Current Version_ : ${global.version}\n` +
                    `_Available Version_ : ${latestUpdate.version}\n\n` +
                    `◧ *List Update Files*\n\n` +
                    latestUpdate.files.map(item => `- ${item.name}`).join("\n") +
                    `\n\n_Update Notes_ : ${latestUpdate.noted}\n` +
                    `_Untuk memperbarui script ketik *.updateforce -y*_\n⚠️ _Proses ini akan memperbarui script ke versi terbaru secara keseluruhan_`;
                
                await sock.sendMessage(remoteJid, { text: messageText }, { quoted: message });
                return;
            }

            // Download ZIP file
            // تنزيل ملف ZIP
            zipData = await axios.get(zipUrl, { responseType: 'arraybuffer' });
        } catch (error) {
            console.error('Error downloading update ZIP:', error.message);
            await sock.sendMessage(remoteJid, { 
                text: `⚠️ _Failed to download update file. Please try again later._\n⚠️ _Gagal mengunduh file pembaruan. Silakan coba lagi nanti._`, 
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

        // Extract ZIP using system unzip
        // استخراج ZIP باستخدام unzip للنظام
        try {
            console.log("📂 Extracting ZIP using system unzip...");
            execSync(`unzip -o updates.zip -d updates/`, { stdio: "inherit" });
        } catch (error) {
            console.error("❌ Failed to extract ZIP file:", error);
            return;
        } finally {
            fs.unlinkSync(zipFilePath); // Delete ZIP after extraction
            // حذف ZIP بعد الاستخراج
        }

        const sourceDir = path.join(outputDir, 'files');
        const targetDir = process.cwd();

        if (!fs.existsSync(sourceDir)) {
            console.error(`❌ Source folder not found: ${sourceDir}`);
            await sock.sendMessage(remoteJid, { text: `❌ _Source folder not found!_\n❌ _Folder sumber tidak ditemukan!_`, quoted: message });
            return;
        }

        // Copy files to main bot directory
        // نسخ الملفات إلى مجلد البوت الرئيسي
        try {
            fse.copySync(sourceDir, targetDir, { overwrite: true });
        } catch (error) {
            console.error('Error copying files:', error.message);
            await sock.sendMessage(remoteJid, { text: `⚠️ _Failed to copy update files._\n⚠️ _Gagal menyalin file pembaruan._`, quoted: message });
            return;
        }

        fse.removeSync(outputDir); // Clean up temporary folder

        await sock.sendMessage(remoteJid, { 
            text: `✅ _Update completed successfully!_\n✅ _Pembaruan berhasil dilakukan!_\n\n_Please restart your server or type *.restart*_\n_Silakan restart server anda atau bisa mengetik *.restart*_`, 
            quoted: message 
        });

    } catch (error) {
        console.error('Unexpected error:', error.message);
        await sock.sendMessage(remoteJid, { 
            text: `❌ _Failed to update script. Please try again later._\n❌ _Gagal memperbarui script. Silakan coba lagi nanti._`, 
            quoted: message 
        });
    }
}

module.exports = {
    handle,
    Commands: ['update'],
    OnlyPremium: false,
    OnlyOwner: true
};