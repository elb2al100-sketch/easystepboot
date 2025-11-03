const { reply } = require("@lib/utils");
const fsp = require("fs").promises;
const fs = require('fs');
const path = require('path');
const util = require("util");
const exec2 = util.promisify(require("child_process").exec);
const { downloadQuotedMedia, downloadMedia } = require("@lib/utils");
const { convertAudioToCompatibleFormat, generateUniqueFilename } = require('@lib/utils');

// Fungsi untuk mengubah pitch audio
// Function to change audio pitch
// دالة لتغيير درجة صوت الصوت
async function changePitch(inputPath, outputPath, sampleRate = 44100) {
    try {
        const command = `ffmpeg -i ${inputPath} -af "asetrate=${sampleRate},aresample=${sampleRate}" ${outputPath}`;
        await exec2(command);
        return await fsp.readFile(outputPath);
    } catch (error) {
        console.error("Error saat mengubah pitch / Error changing pitch / خطأ أثناء تغيير درجة الصوت:", error);
        throw error;
    }
}

async function handle(sock, messageInfo) {
    const { m, remoteJid, message, prefix, command, content, isQuoted } = messageInfo;

    try {
        const mediaType = isQuoted ? isQuoted.type : undefined;

        // Pastikan user membalas audio/voice note
        // Ensure user replied to audio/voice note
        // تأكد من أن المستخدم رد على ملف صوتي / ملاحظة صوتية
        if (mediaType !== "audio") {
            return await reply(m, `⚠️ _Reply to audio/voice note with caption *${prefix + command}*_ / ⚠️ _رد على ملف صوتي مع التسمية *${prefix + command}*_`);
        }

        // Validasi input karakter
        // Validate character input
        // تحقق من إدخال الشخصية
        if (!content) {
            return await reply(m, `⚠️ _Reply to audio/voice note with caption *${prefix + command}*_ \n\n _*Enter Character* / أدخل شخصية*_

> tupai / squirrel
> raksasa / giant
> monster
> robot
> bayi / baby
> kakek / grandfather
> alien

Example / مثال: _*${prefix + command} tupai*_`);
        }

        // Download media
        const media = isQuoted 
            ? await downloadQuotedMedia(message) 
            : await downloadMedia(message);
        const mediaPath = `tmp/${media}`;

        const helpMessage = `_*Enter Character* / أدخل شخصية*_

> tupai / squirrel
> raksasa / giant
> monster
> robot
> bayi / baby
> kakek / grandfather
> alien

Example / مثال: _*${prefix + command} tupai*_`;

        // Kirim reaksi loading
        // Send loading reaction
        // إرسال رمز تعبيري "جارٍ التحميل"
        await sock.sendMessage(remoteJid, { react: { text: "🤌🏻", key: message.key } });

        // Daftar pitch untuk karakter
        // Character pitch mapping
        // تعيين درجة الصوت لكل شخصية
        const karakterPitchPairs = [
            { karakter: "tupai", pitch: 48000 },
            { karakter: "raksasa", pitch: 22050 },
            { karakter: "monster", pitch: 40000 },
            { karakter: "robot", pitch: 32000 },
            { karakter: "bayi", pitch: 16000 },
            { karakter: "kakek", pitch: 20000 },
            { karakter: "alien", pitch: 55000 },
        ];

        // Pilih pitch sesuai karakter
        // Select pitch according to character
        // اختر درجة الصوت وفقًا للشخصية
        const selectedPair = karakterPitchPairs.find(pair => pair.karakter === content.toLowerCase());
        if (!selectedPair) {
            return await reply(m, helpMessage);
        }

        const outputPath = `./tmp/voice_changer_${Date.now()}.mp3`;

        try {
            // Ubah pitch audio
            // Change audio pitch
            // تغيير درجة صوت الصوت
            const audioBuffer = await changePitch(mediaPath, outputPath, selectedPair.pitch);

            const baseDir   = process.cwd(); 
            const inputPath = path.join(baseDir, generateUniqueFilename());
            fs.writeFileSync(inputPath, audioBuffer);

            let bufferOriginal = audioBuffer;
            try {
                bufferOriginal = await convertAudioToCompatibleFormat(inputPath);
            } catch {
                // Abaikan jika gagal
            }

            // Kirim audio hasil perubahan pitch
            // Send audio with changed pitch
            // إرسال الملف الصوتي بعد تغيير درجة الصوت
            await sock.sendMessage(remoteJid, { audio: { url : bufferOriginal }, mimetype: 'audio/mp4', ptt: true }, { quoted: message })
            
        } catch (error) {
            console.error("Error saat mengirim audio / Error sending audio / خطأ عند إرسال الصوت:", error);
            return await reply(m, "❌ Failed to change voice pitch / فشل تغيير درجة الصوت / فشل تغيير درجة الصوت.");
        }
    } catch (error) {
        console.error("Error in handle function / خطأ في الدالة:", error);
        await sock.sendMessage(remoteJid, { text: `_Error: ${error.message}_` }, { quoted: message });
    }
}

module.exports = {
    handle,
    Commands    : ["voicechanger"],
    OnlyPremium : false,
    OnlyOwner   : false,
    limitDeduction  : 1, // Number of usage limits to deduct / عدد الحدود التي سيتم خصمها
};