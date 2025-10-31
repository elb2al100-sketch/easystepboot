const ApiAutoresbot = require('api-autoresbot');
const config = require("@config");
const { danger, reply } = require('@lib/utils');

// 🇬🇧 Object to store processing status
// 🇸🇦 كائن لتخزين حالة المعالجة
const processingChats = {};

/**
 * 🇬🇧 Auto Simi handler function
 * 🇸🇦 دالة التعامل مع أوامر Simi تلقائيًا
 */
async function autoSimi(sock, messageInfo, content_old) {
    const { m, remoteJid, command, fullText } = messageInfo;

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
        // 🇬🇧 If command is 'simi' and text is too short, send a default bilingual message
        // 🇸🇦 إذا كان الأمر 'simi' والنص قصير جدًا، أرسل رسالة افتراضية باللغتين
        if (command === 'simi' && fullText.length < 6) {
            return await reply(m, '_What?_ / _ماذا؟_');
        }

        // 🇬🇧 Combine old content with new question
        // 🇸🇦 دمج السياق القديم مع السؤال الجديد
        let content_simi = '';
        if (content_old) {
            content_simi += `Context: ${content_old}\n`; // 🇬🇧 Combine with old content
                                                          // 🇸🇦 دمج مع المحتوى القديم
        }
        content_simi += `Question: ${fullText}`; // 🇬🇧 Combine with new question
                                                  // 🇸🇦 دمج مع النص الجديد

        const api = new ApiAutoresbot(config.APIKEY);

        // 🇬🇧 Call Simi API for text
        // 🇸🇦 استدعاء API Simi للنصوص
        const response = await api.get('/api/simi', { text: content_simi, language: 'id' });

        if (response?.data) {
            // 🇬🇧 Reply with Simi response in bilingual format
            // 🇸🇦 الرد على المستخدم بنتيجة Simi باللغتين
            await reply(m, `${response.data} \n\n🇬🇧 / 🇸🇦`);
        } else {
            throw new Error("Failed to get response from API.");
        }

    } catch (error) {
        // 🇬🇧 Handle errors and log them
        // 🇸🇦 معالجة الأخطاء وتسجيلها
        danger(command, `Error in lib/autosimi.js: ${error.message}`);
        await reply(m, `_An error occurred: ${error.message} / _حدث خطأ: ${error.message}_`);
    } finally {
        // 🇬🇧 Remove processing status after finishing
        // 🇸🇦 إزالة علامة المعالجة بعد الانتهاء
        delete processingChats[remoteJid];
    }
}

// 🇬🇧 Export the function
// 🇸🇦 تصدير الدالة
module.exports = autoSimi;