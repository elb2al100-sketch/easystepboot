// Import required libraries / استيراد المكتبات المطلوبة
const { getDataByGroupId }  = require('@lib/list'); // Get list data by group ID / الحصول على بيانات القائمة حسب معرف المجموعة
const fs = require('fs').promises; // File system promises / مكتبة نظام الملفات
const config = require("@config"); // Configuration / الإعدادات
const chalk = require('chalk'); // Console styling / لتنسيق الطباعة على الكونسول
const { logTracking } = require('@lib/utils'); // Logging function / دالة لتسجيل التتبع
const { sendImageAsSticker } = require("@lib/exif"); // Send image as sticker / إرسال صورة كملصق

// Object to track last message timestamps per group / كائن لتتبع آخر وقت إرسال رسالة لكل مجموعة
const lastMessageTime = {};

// Main list response handler / الدالة الرئيسية لمعالجة ردود القوائم
async function process(sock, messageInfo) {
    const { remoteJid, message, fullText } = messageInfo;

    try {
        const keyword = fullText.trim(); // Trim whitespace / إزالة المسافات من النص
        if(!keyword) return;

        let currentList = await getDataByGroupId('owner'); // Get list for owner / الحصول على قائمة المالك
        if (!currentList) return;

        const searchResult = Object.keys(currentList.list).filter(item => 
            item.toLowerCase().trim() === keyword.toLowerCase().trim()
        ); 
        // Search for exact match / البحث عن تطابق النص بالضبط

        if (searchResult.length === 0) return;

        // RATE LIMIT
        const now = Date.now();
        if (lastMessageTime[remoteJid]) {
            if (now - lastMessageTime[remoteJid] < config.rate_limit) {
                console.log(chalk.redBright(`Rate limit respon : ${keyword}`)); 
                // Rate limit reached / تم الوصول إلى الحد المسموح به
                return false;
            }
        }
        lastMessageTime[remoteJid] = now; // Update last message timestamp / تحديث آخر وقت إرسال رسالة

        const { text, media } = currentList.list[searchResult[0]].content; 
        // Get text and media from list / الحصول على النص والوسائط من القائمة

        if (media) {
            const buffer = await getMediaBuffer(media); // Read media file / قراءة ملف الوسائط
            if (buffer) {
                // Get file extension / استخراج امتداد الملف
                const ext = media.split('.').pop().toLowerCase();
                let typeMedia = '';

                if (ext === 'webp') {
                    typeMedia = 'sticker'; // Sticker / ملصق
                } else if (ext === 'mp3') {
                    typeMedia = 'audio'; // Audio / صوت
                } else if (['jpg', 'jpeg', 'png'].includes(ext)) {
                    typeMedia = 'image'; // Image / صورة
                } else if (['mp4', 'mkv', 'mov'].includes(ext)) {
                    typeMedia = 'video'; // Video / فيديو
                } else {
                    typeMedia = 'unknown'; // Unknown type / نوع غير معروف
                }

                // Send media message based on type / إرسال الوسائط حسب النوع
                await sendMediaMessage(sock, remoteJid, buffer, text, message, typeMedia);
            } else {
                console.error(`Media not found or failed to read: ${media}`); 
                // Media not found / الملف غير موجود أو فشل في القراءة
            }
        } else {
            await sendTextMessage(sock, remoteJid, text, message); 
            // Send text message / إرسال رسالة نصية
        }

        logTracking(`Respon Handler - ${remoteJid}`); // Log action / تسجيل الحدث
        return false; // Stop further processing / إيقاف المعالجة الإضافية
    } catch (error) {
        console.error("Error processing message:", error); // Log any errors / تسجيل أي أخطاء
    }
}

// Helper function to get media buffer / دالة مساعدة للحصول على محتوى الوسائط
async function getMediaBuffer(mediaFileName) {
    const filePath = `./database/media/${mediaFileName}`;
    try {
        return await fs.readFile(filePath); // Read file / قراءة الملف
    } catch (error) {
        console.error(`Failed to read media file: ${filePath}`, error); 
        // Log error / تسجيل خطأ
        return null;
    }
}

// Function to send media message / دالة لإرسال رسائل الوسائط
async function sendMediaMessage(sock, remoteJid, buffer, caption, quoted, typeMedia) {
    // typeMedia: sticker, audio, image, video / نوع الوسائط: ملصق، صوت، صورة، فيديو
    try {
        if (typeMedia === 'image') {
            await sock.sendMessage(remoteJid, { image: buffer, caption }, { quoted });
        } else if (typeMedia === 'video') {
            await sock.sendMessage(remoteJid, { video: buffer, caption }, { quoted });
        } else if (typeMedia === 'audio') {
            await sock.sendMessage(
                remoteJid, 
                { 
                    audio: buffer,
                    fileName: 'addrespon.mp3',
                    mimetype: 'audio/mp4' // optional, can also use 'audio/mpeg' / اختياري، يمكن استخدام 'audio/mpeg'
                }, 
                { quoted }
            );
        } else if (typeMedia === 'sticker') {
            await sock.sendMessage(remoteJid, { sticker: buffer }, { quoted });
        } else {
            console.warn(`Unknown typeMedia: ${typeMedia}`); // Unknown media type / نوع وسائط غير معروف
        }
    } catch (error) {
        console.error("Failed to send media message:", error); // Log error / تسجيل خطأ
    }
}

// Function to send text message / دالة لإرسال رسالة نصية
async function sendTextMessage(sock, remoteJid, text, quoted) {
    try {
        await sock.sendMessage(remoteJid, { text }, { quoted });
    } catch (error) {
        console.error("Failed to send text message:", error); // Log error / تسجيل خطأ
    }
}

// Export the plugin module / تصدير وحدة البرنامج المساعد
module.exports = {
    name        : "List Response", // Plugin name / اسم البرنامج المساعد
    priority    : 9, // Plugin priority / أولوية البرنامج المساعد
    process, // Process function / دالة المعالجة
};