const ApiAutoresbot = require('api-autoresbot');
const config = require("@config");
const { danger, downloadQuotedMedia, downloadMedia, reply } = require('@lib/utils');
const fs = require('fs');
const path = require('path');

// Objek untuk menyimpan status proses
// Object to store processing status
// كائن لتخزين حالة المعالجة
const processingChats = {};

async function autoAi(sock, messageInfo, content_old) {
    const { m, remoteJid, id, command, isQuoted, content, message, sender, pushName, type, fullText } = messageInfo;

    // Cek apakah chat ini sedang diproses
    // Check if this chat is currently being processed
    // التحقق مما إذا كانت هذه المحادثة قيد المعالجة حالياً
    if (processingChats[remoteJid]) {
        return;  // Tidak melayani chat lainnya sampai yang sebelumnya selesai
        // Do not process new messages until previous one is finished
        // لا يتم معالجة الرسائل الجديدة حتى ينتهي السابق
    }

    // Tandai chat ini sebagai sedang diproses
    // Mark this chat as processing
    // تعليم هذه المحادثة بأنها قيد المعالجة
    processingChats[remoteJid] = true;

    try {
        // Cek apakah command 'ai' dengan panjang teks kurang dari 4 karakter
        // Check if 'ai' command has text less than 4 characters
        // التحقق مما إذا كان أمر "ai" نصه أقل من 4 أحرف
        if (command === 'ai' && fullText.length < 4) {
            return await reply(m, '_Halo, ada yang bisa dibantu?_');
            // Reply "Hello, can I help?"
            // الرد بـ "مرحبًا، هل يمكنني المساعدة؟"
        }

        let content_ai = '';
        if (content_old) {
            content_ai += `Konteks: ${content_old}\n`;  // Gabungkan dengan content_old
            // Combine with previous content
            // دمج مع المحتوى السابق
        }
        content_ai += `Pertanyaan: ${fullText}`;  // Gabungkan dengan fullText
        // Combine with current message text
        // دمج مع نص الرسالة الحالي

        const api = new ApiAutoresbot(config.APIKEY);

        // Deteksi media gambar
        // Detect image media
        // اكتشاف إذا كانت الرسالة تحتوي على صورة
        const mediaType = isQuoted ? isQuoted.type : type;
        if (mediaType === 'image') {
            const media = isQuoted
                ? await downloadQuotedMedia(message)
                : await downloadMedia(message);
            const mediaPath = path.join('tmp', media);

            if (!fs.existsSync(mediaPath)) {
                throw new Error('File media tidak ditemukan setelah diunduh.');
                // Media file not found after download
                // لم يتم العثور على ملف الوسائط بعد التنزيل
            }

            const response = await api.tmpUpload(mediaPath);

            if (!response || response.code !== 200) {
                throw new Error("File upload gagal atau tidak ada URL.");
                // File upload failed or no URL
                // فشل رفع الملف أو لا يوجد رابط
            }
            const url = response.data.url;
            const response2 = await api.get('/api/tools/imagerecognition', { url });
            if (!response2 || response2.code !== 200) {
                throw new Error("Gagal mendeteksi gambar.");
                // Failed to detect image
                // فشل التعرف على الصورة
            }

            return await reply(m, response2.data);
            // Reply with image recognition result
            // الرد بنتيجة التعرف على الصورة
        }

        // Lakukan panggilan API untuk teks
        // Make API call for text
        // إجراء طلب API للنص
        const response = await api.get('/api/gemini', { text: content_ai });

        if (response?.data) {
            await reply(m, response.data);
        } else {
            throw new Error("Gagal mendapatkan respons dari API.");
            // Failed to get response from API
            // فشل الحصول على رد من الـ API
        }

    } catch (error) {
        // Menangani kesalahan dan log dengan baik
        // Handle errors and log properly
        // التعامل مع الأخطاء وتسجيلها بشكل صحيح
        danger(command, `Kesalahan di lib/autoai.js: ${error.message}`);
        await reply(m, `_Terjadi kesalahan: ${error.message}_`);
        // Reply with error message
        // الرد برسالة الخطأ
    } finally {
        // Hapus status proses setelah selesai
        // Remove processing status after completion
        // إزالة حالة المعالجة بعد الانتهاء
        delete processingChats[remoteJid];
    }
}

module.exports = autoAi;