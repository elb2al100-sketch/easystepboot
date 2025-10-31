const ApiAutoresbot = require('api-autoresbot');
const config = require("@config");
const { danger, downloadQuotedMedia, downloadMedia, reply } = require('@lib/utils');
const fs = require('fs');
const path = require('path');

// 🇬🇧 Object to store processing status
// 🇸🇦 كائن لتخزين حالة المعالجة
const processingChats = {};

/**
 * 🇬🇧 Auto AI handler function
 * 🇸🇦 دالة التعامل مع أوامر الذكاء الاصطناعي تلقائيًا
 */
async function autoAi(sock, messageInfo, content_old) {
    const { m, remoteJid, id, command, isQuoted, content, message, sender, pushName, type, fullText } = messageInfo;

    // 🇬🇧 Check if this chat is already being processed
    // 🇸🇦 التحقق مما إذا كانت هذه المحادثة قيد المعالجة بالفعل
    if (processingChats[remoteJid]) {
        return;  // 🇬🇧 Do not process new messages until previous is finished
                   // 🇸🇦 لا تعالج الرسائل الجديدة حتى يتم الانتهاء من السابقة
    }

    // 🇬🇧 Mark this chat as processing
    // 🇸🇦 تعليم هذه المحادثة على أنها قيد المعالجة
    processingChats[remoteJid] = true;

    try {
        // 🇬🇧 If command is 'ai' and text is too short, send greeting
        // 🇸🇦 إذا كان الأمر 'ai' والنص قصير جدًا، أرسل رسالة ترحيب
        if (command === 'ai' && fullText.length < 4) {
            return await reply(m, '_Hello, how can I help you?_');
        }

        // 🇬🇧 Combine old content with new question
        // 🇸🇦 دمج السياق القديم مع السؤال الجديد
        let content_ai = '';
        if (content_old) {
            content_ai += `Context: ${content_old}\n`;  // 🇬🇧 Combine with old content
                                                      // 🇸🇦 دمج مع المحتوى القديم
        }
        content_ai += `Question: ${fullText}`;  // 🇬🇧 Combine with new question
                                                // 🇸🇦 دمج مع النص الجديد

        const api = new ApiAutoresbot(config.APIKEY);

        // 🇬🇧 Detect image media
        // 🇸🇦 اكتشاف الوسائط من نوع الصورة
        const mediaType = isQuoted ? isQuoted.type : type;
        if (mediaType === 'image') {
            const media = isQuoted
                ? await downloadQuotedMedia(message) // 🇬🇧 Download quoted media
                                                    // 🇸🇦 تحميل الوسائط المقتبسة
                : await downloadMedia(message);       // 🇬🇧 Download media directly
                                                      // 🇸🇦 تحميل الوسائط مباشرة
            const mediaPath = path.join('tmp', media);

            if (!fs.existsSync(mediaPath)) {
                throw new Error('Media file not found after download.');
            }

            // 🇬🇧 Upload media to API
            // 🇸🇦 رفع الوسائط إلى API
            const response = await api.tmpUpload(mediaPath);

            if (!response || response.code !== 200) {
                throw new Error("File upload failed or no URL returned.");
            }

            const url = response.data.url;
            const response2 = await api.get('/api/tools/imagerecognition', { url });

            if (!response2 || response2.code !== 200) {
                throw new Error("Failed to recognize the image.");
            }

            return await reply(m, response2.data); // 🇬🇧 Send recognition result
                                                   // 🇸🇦 إرسال نتيجة التعرف على الصورة
        }

        // 🇬🇧 Call AI API for text
        // 🇸🇦 استدعاء API الذكاء الاصطناعي للنصوص
        const response = await api.get('/api/gemini', { text: content_ai });

        if (response?.data) {
            await reply(m, response.data); // 🇬🇧 Reply with AI response
                                           // 🇸🇦 الرد على المستخدم بنتيجة الذكاء الاصطناعي
        } else {
            throw new Error("Failed to get response from API.");
        }

    } catch (error) {
        // 🇬🇧 Handle errors and log them
        // 🇸🇦 معالجة الأخطاء وتسجيلها
        danger(command, `Error in lib/autoai.js: ${error.message}`);
        await reply(m, `_An error occurred: ${error.message}_`);
    } finally {
        // 🇬🇧 Remove processing status after finishing
        // 🇸🇦 إزالة علامة المعالجة بعد الانتهاء
        delete processingChats[remoteJid];
    }
}

// 🇬🇧 Export the function
// 🇸🇦 تصدير الدالة
module.exports = autoAi;