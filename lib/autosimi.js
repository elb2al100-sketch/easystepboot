const ApiAutoresbot = require('api-autoresbot');
const config = require("@config");
const { danger, reply } = require('@lib/utils');

// Object to store processing status / كائن لتخزين حالة المعالجة
const processingChats = {};

async function autoSimi(sock, messageInfo, content_old) {
    const { m, remoteJid, id, command, isQuoted, content, message, sender, pushName, type, fullText } = messageInfo;

    // Check if this chat is already being processed / تحقق إذا كان هذا الدردشة قيد المعالجة بالفعل
    if (processingChats[remoteJid]) {
        return;  // Do not serve other chats until the previous one finishes / لا تعالج أي دردشة أخرى حتى تنتهي الحالية
    }

    // Mark this chat as being processed / وضع علامة على الدردشة بأنها قيد المعالجة
    processingChats[remoteJid] = true;

    try {
        // If command is 'simi' and text length is less than 6 / إذا كان الأمر 'simi' وطول النص أقل من 6
        if (command === 'simi' && fullText.length < 6) {
            return await reply(m, '_Apaan ?_'); // "What?" response / الرد "ماذا؟"
        }

        let content_simi = '';
        if (content_old) {
            content_simi += `Konteks: ${content_old}\n`;  // Combine with previous content / دمج مع المحتوى السابق
        }
        content_simi += `Pertanyaan: ${fullText}`;  // Combine with current full text / دمج مع النص الحالي

        const api = new ApiAutoresbot(config.APIKEY);

        // Call the API to get text response / استدعاء API للحصول على الرد النصي
        const response = await api.get('/api/simi', { text: content_simi, language: 'id' });

        if (response?.data) {
            await reply(m, response.data); // Send API response / إرسال رد API
        } else {
            throw new Error("Failed to get response from API."); // API failure / فشل API
        }

    } catch (error) {
        // Handle errors and log properly / التعامل مع الأخطاء وتسجيلها بشكل مناسب
        danger(command, `Error in lib/autosimi.js: ${error.message}`);
        await reply(m, `_Terjadi kesalahan: ${error.message}_`); // "An error occurred" / "حدث خطأ"
    } finally {
        // Remove processing status after completion / إزالة حالة المعالجة بعد الانتهاء
        delete processingChats[remoteJid];
    }
}

module.exports = autoSimi;