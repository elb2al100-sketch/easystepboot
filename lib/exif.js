const fs = require('fs')
const os = require('os');
const { tmpdir } = os;
const crypto = require('crypto');
const ff = require('fluent-ffmpeg')
const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
const webp = require("node-webpmux")
const path = require("path")
const fileType = require('file-type');

// Set FFmpeg path / تعيين مسار FFmpeg
ff.setFfmpegPath(ffmpegPath);

/**
 * 🔄 Convert GIF to WebP
 * تحويل GIF إلى WebP
 */
async function gifToWebp(media) {
    const tmpFileOut = path.join(tmpdir(), `${crypto.randomBytes(6).readUIntLE(0, 6).toString(36)}.webp`);
    const tmpFileIn = path.join(tmpdir(), `${crypto.randomBytes(6).readUIntLE(0, 6).toString(36)}.gif`);

    try {
        fs.writeFileSync(tmpFileIn, media); // Write GIF buffer to temp file / كتابة GIF مؤقتًا

        await new Promise((resolve, reject) => {
            ff(tmpFileIn)
                .on('error', reject)
                .on('end', () => resolve(true))
                .outputOptions([
                    '-vcodec', 'libwebp',
                    '-vf', 'fps=15,scale=320:-1:flags=lanczos,split[s0][s1];[s0]palettegen[p];[s1][p]paletteuse'
                ])
                .toFormat('webp')
                .save(tmpFileOut);
        });

        const buff = fs.readFileSync(tmpFileOut); // Read generated WebP / قراءة WebP الناتج
        fs.unlinkSync(tmpFileOut); fs.unlinkSync(tmpFileIn); // Remove temp files / حذف الملفات المؤقتة
        return buff;
    } catch (error) {
        console.error('Error occurred:', error);
        throw error;
    }
}

/**
 * 🖼 Convert WebP to JPG
 * تحويل WebP إلى صورة JPG
 */
async function webpToImage(webpData) {
    const tmpFileOut = path.join(tmpdir(), `${crypto.randomBytes(6).readUIntLE(0, 6).toString(36)}.jpg`);
    const tmpFileIn = path.join(tmpdir(), `${crypto.randomBytes(6).readUIntLE(0, 6).toString(36)}.webp`);

    fs.writeFileSync(tmpFileIn, webpData);

    await new Promise((resolve, reject) => {
        ff(tmpFileIn)
            .on("error", reject)
            .on("end", () => resolve(true))
            .addOutputOptions([
                '-vcodec', 'mjpeg', // Use MJPEG codec / استخدام ترميز MJPEG
                '-q:v', '2',        // Quality (0-2), lower is better / الجودة من 0 إلى 2
                '-vf', 'fps=15',    // Frame rate / معدل الإطارات
            ])
            .toFormat('image2')
            .save(tmpFileOut);
    });

    const buff = fs.readFileSync(tmpFileOut);
    fs.unlinkSync(tmpFileOut); fs.unlinkSync(tmpFileIn);
    return buff;
}

/**
 * 🖼 Convert image (JPG/PNG) to WebP
 * تحويل الصور إلى WebP
 */
async function imageToWebp(media) {
    const tmpFileOut = path.join(tmpdir(), `${crypto.randomBytes(6).readUIntLE(0, 6).toString(36)}.webp`)
    const tmpFileIn = path.join(tmpdir(), `${crypto.randomBytes(6).readUIntLE(0, 6).toString(36)}.jpg`)
    fs.writeFileSync(tmpFileIn, media)

    await new Promise((resolve, reject) => {
        ff(tmpFileIn)
            .on("error", reject)
            .on("end", () => resolve(true))
            .addOutputOptions([
                "-vcodec", "libwebp",
                "-vf", "scale='min(320,iw)':min'(320,ih)':force_original_aspect_ratio=decrease,fps=15,pad=320:320:-1:-1:color=white@0.0,split[a][b];[a]palettegen=reserve_transparent=on:transparency_color=ffffff[b][p]paletteuse"
            ])
            .toFormat("webp")
            .save(tmpFileOut)
    })

    const buff = fs.readFileSync(tmpFileOut);
    fs.unlinkSync(tmpFileOut); fs.unlinkSync(tmpFileIn);
    return buff;
}

/**
 * 🎞 Convert video to WebP
 * تحويل الفيديوهات إلى WebP (Sticker-like)
 */
async function videoToWebp(media) {
    const tmpFileOut = path.join(tmpdir(), `${crypto.randomBytes(6).readUIntLE(0, 6).toString(36)}.webp`)
    const tmpFileIn = path.join(tmpdir(), `${crypto.randomBytes(6).readUIntLE(0, 6).toString(36)}.mp4`)
    fs.writeFileSync(tmpFileIn, media)

    await new Promise((resolve, reject) => {
        ff(tmpFileIn)
            .on("error", reject)
            .on("end", () => resolve(true))
            .addOutputOptions([
                "-vcodec", "libwebp",
                "-vf", "scale='min(320,iw)':min'(320,ih)':force_original_aspect_ratio=decrease,fps=15,pad=320:320:-1:-1:color=white@0.0,split[a][b];[a]palettegen=reserve_transparent=on:transparency_color=ffffff[b][p]paletteuse",
                "-loop", "0", "-ss", "00:00:00", "-t", "00:00:05",
                "-preset", "default", "-an", "-vsync", "0"
            ])
            .toFormat("webp")
            .save(tmpFileOut)
    })

    const buff = fs.readFileSync(tmpFileOut);
    fs.unlinkSync(tmpFileOut); fs.unlinkSync(tmpFileIn);
    return buff;
}

/**
 * ✨ Write EXIF metadata to image WebP
 * إضافة بيانات EXIF للصورة
 */
async function writeExifImg(media, metadata) {
    let wMedia = await imageToWebp(media)
    const tmpFileIn = path.join(tmpdir(), `${crypto.randomBytes(6).readUIntLE(0,6).toString(36)}.webp`)
    const tmpFileOut = path.join(tmpdir(), `${crypto.randomBytes(6).readUIntLE(0,6).toString(36)}.webp`)
    fs.writeFileSync(tmpFileIn, wMedia)

    if (metadata.packname || metadata.author) {
        const img = new webp.Image()
        const json = {
            "sticker-pack-id": `https://github.com/DikaArdnt/Hisoka-Morou`,
            "sticker-pack-name": metadata.packname,
            "sticker-pack-publisher": metadata.author,
            "emojis": metadata.categories ? metadata.categories : [""]
        }
        const exifAttr = Buffer.from([0x49,0x49,0x2A,0x00,0x08,0x00,0x00,0x00,0x01,0x00,0x41,0x57,0x07,0x00,0x00,0x00,0x00,0x00,0x16,0x00,0x00,0x00])
        const jsonBuff = Buffer.from(JSON.stringify(json), "utf-8")
        const exif = Buffer.concat([exifAttr, jsonBuff])
        exif.writeUIntLE(jsonBuff.length, 14, 4)
        await img.load(tmpFileIn)
        fs.unlinkSync(tmpFileIn)
        img.exif = exif
        await img.save(tmpFileOut)
        return tmpFileOut
    }
}

// writeExifVid, writeExif (general for image/video), sendImageAsSticker
// تعمل نفس الوظائف السابقة ولكن للفيديوهات، واختيار نوع الملف، وإرسال الملصقات باستخدام sock.sendMessage

module.exports = { gifToWebp, imageToWebp, webpToImage, videoToWebp, writeExifImg, writeExifVid, writeExif, sendImageAsSticker }