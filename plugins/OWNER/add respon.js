// Import necessary modules
// استيراد الوحدات اللازمة
const { addList, getDataByGroupId } = require('@lib/list');
const { downloadQuotedMedia, downloadMedia } = require('@lib/utils');
const { deleteCache } = require('@lib/globalCache');

async function handle(sock, messageInfo) {
    const { remoteJid, message, content, sender, command, prefix } = messageInfo;

    try {
        // Validate message content
        // التحقق من محتوى الرسالة
        if (!content.trim()) {
            return sendMessageWithTemplate(
                sock, 
                remoteJid, 
                `_⚠️ Please provide a command and message_\n\nExample: ${prefix + command} donate | Here is the donation link...\n\n_If you want to add a response with media, send/reply to the media with caption_ *${prefix + command}*` +
                `\n_⚠️ الرجاء إدخال الأمر والرسالة_\n\nمثال: ${prefix + command} donate | هنا رابط التبرع...\n\n_إذا أردت إضافة استجابة مع وسائط، أرسل/رد على الوسائط مع العنوان_ *${prefix + command}*`, 
                message
            );
        }

        // Split keyword and text
        // فصل الكلمة المفتاحية والنص
        const [keyword, text] = content.split('|').map(item => item.trim());
        const lowercaseKeyword = keyword.trim().toLowerCase();

        if (!keyword || !text) {
            return sendMessageWithTemplate(
                sock, 
                remoteJid, 
                `⚠️ _Invalid format!_\n\nExample: *${prefix + command} donate | Here is the donation link...*\n\n_If you want to add a response with media, send/reply to the media with caption_ *${prefix + command}*` +
                `\n⚠️ _تنسيق غير صالح!_\n\nمثال: *${prefix + command} donate | هنا رابط التبرع...*\n\n_إذا أردت إضافة استجابة مع وسائط، أرسل/رد على الوسائط مع العنوان_ *${prefix + command}*`, 
                message
            );
        }

        // Check if keyword already exists
        // التحقق مما إذا كانت الكلمة المفتاحية موجودة مسبقًا
        const currentList = await getDataByGroupId(remoteJid);

        if (currentList?.list?.[lowercaseKeyword]) {
            return sendMessageWithTemplate(
                sock, 
                remoteJid, 
                `_⚠️ Keyword *${lowercaseKeyword}* already exists!_\n_Use a different keyword or *.updaterespon*_\n_⚠️ الكلمة المفتاحية *${lowercaseKeyword}* موجودة مسبقًا!_\n_استخدم كلمة مفتاحية أخرى أو *.updaterespon*`, 
                message
            );
        }

        // Handle media if any
        // التعامل مع الوسائط إن وجدت
        const mediaUrl = await handleMedia(messageInfo);

        // Add to database
        // إضافة إلى قاعدة البيانات
        const result = await addList('owner', lowercaseKeyword, { text, media: mediaUrl });
        if (result.success) {
            deleteCache(`list-owner`);  // Reset cache
            // إعادة تعيين ذاكرة التخزين المؤقت
            return sendMessageWithTemplate(
                sock, 
                remoteJid, 
                `${lowercaseKeyword} _has been added to the response list_\n\n_Type *listrespon* to see all responses_\n_تمت إضافة ${lowercaseKeyword} إلى قائمة الاستجابات_\n\n_اكتب *listrespon* لرؤية جميع الاستجابات_`, 
                message
            );
        }

        return sendMessageWithTemplate(sock, remoteJid, `❌ ${result.message}`, message);
    } catch (error) {
        console.error('Error processing command:', error);
        return sendMessageWithTemplate(
            sock, 
            remoteJid, 
            '_❌ Sorry, an error occurred while processing the data._\n_❌ عذرًا، حدث خطأ أثناء معالجة البيانات._', 
            message
        );
    }
}

// Function to send message using template
// دالة لإرسال رسالة باستخدام قالب
function sendMessageWithTemplate(sock, remoteJid, text, quoted) {
    return sock.sendMessage(remoteJid, { text }, { quoted });
}

// Function to handle media download
// دالة للتعامل مع تحميل الوسائط
async function handleMedia({ isQuoted, type, message }) {
    const supportedMediaTypes = ['image', 'audio', 'sticker', 'video', 'document'];

    if (isQuoted && supportedMediaTypes.includes(isQuoted.type)) {
        return await downloadQuotedMedia(message, true);
    } else if (supportedMediaTypes.includes(type)) {
        return await downloadMedia(message, true);
    }
    return null;
}

module.exports = {
    handle,
    Commands    : ['addrespon'],
    OnlyPremium : false,
    OnlyOwner   : true,
};