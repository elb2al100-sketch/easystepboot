const { addList, getDataByGroupId }          = require('@lib/list');
const { downloadQuotedMedia, downloadMedia } = require('@lib/utils');
const { getGroupMetadata }                   = require("@lib/cache");
const { deleteCache }                        = require('@lib/globalCache');
const mess = require('@mess');

async function handle(sock, messageInfo) {
    const { remoteJid, isGroup, message, content, sender, isQuoted, command, prefix } = messageInfo;

    try {
        let idList = remoteJid;

        // If private chat → use 'owner' / إذا كانت المحادثة خاصة → استخدم 'owner'
        if(!isGroup) {
            idList = 'owner';
        } else {
            // Get group metadata / الحصول على بيانات المجموعة
            const groupMetadata = await getGroupMetadata(sock, remoteJid);
            const participants  = groupMetadata.participants;
            const isAdmin       = participants.some(participant => participant.id === sender && participant.admin);

            if(!isAdmin) {
                await sock.sendMessage(remoteJid, { 
                    text: "⚠️ You must be an admin to use this command. / يجب أن تكون مشرفًا لاستخدام هذا الأمر" 
                }, { quoted: message });
                return;
            }
        }

        // Validate message content / التحقق من محتوى الرسالة
        if (!content.trim()) {
            return sendMessageWithTemplate(
                sock, 
                remoteJid, 
                `_⚠️ Usage Format / صيغة الاستخدام:_\n\n_Example / مثال:_ *${prefix + command} payment | Hello @name for payment only via Dana ...*\n\n_If you want to add list with media, send/reply to the media with caption_ *${prefix + command}*`, 
                message
            );
        }

        let text = '';
        let keyword = '';

        // Split keyword and text by '|' / تقسيم الكلمة الرئيسية والنص بواسطة '|'
        const parts = content.split('|');
        keyword = parts.shift().trim(); // Clean extra spaces / إزالة الفراغات الزائدة
        text = parts.join('|');  // Join remaining text / دمج باقي النص

        // Handle quoted message media / التعامل مع الوسائط إذا كانت الرسالة مقتبسة
        if (isQuoted) {
            switch (isQuoted.type) {
                case 'text':
                        text ||= isQuoted.text || '-';
                    break;
                case 'image':
                        text ||= isQuoted.content?.caption || '-';
                    break;
                case 'sticker':
                        text = 'sticker';
                    break;
                case 'video':
                        text ||= isQuoted.content?.caption || '-'; 
                    break;
                case 'audio':
                        text ||= '-'; 
                        break;
                case 'document':
                        text ||= '-'; 
                    break;
            }
        }
        
        const lowercaseKeyword = (keyword || '').trim().toLowerCase();

        if (!keyword || !text) {
            return sendMessageWithTemplate(
                sock, 
                remoteJid, 
                `⚠️ Invalid format / صيغة غير صحيحة!\n\nExample / مثال: ${prefix + command} payment | Payment only via Dana ...\n\n_If you want to add list with media, send/reply to the media with caption_ *${prefix + command}*`, 
                message
            );
        }
       
        // Check if keyword already exists / التحقق مما إذا كانت الكلمة موجودة مسبقًا
        const currentList = await getDataByGroupId(idList);

        if (currentList?.list?.[lowercaseKeyword]) {
            return sendMessageWithTemplate(
                sock, 
                remoteJid, 
                `⚠️ Keyword *${lowercaseKeyword}* already exists! / الكلمة *${lowercaseKeyword}* موجودة بالفعل!\n\n_Use another keyword or update the list._ / استخدم كلمة أخرى أو حدّث القائمة`, 
                message
            );
        }

        // Reset cache / إعادة تعيين ذاكرة التخزين المؤقت
        deleteCache(`list-${idList}`);

        // Handle media if exists / التعامل مع الوسائط إذا كانت موجودة
        const mediaUrl = await handleMedia(messageInfo);

        // Add to database / إضافة إلى قاعدة البيانات
        const result = await addList(idList, lowercaseKeyword, { text, media: mediaUrl });
        if (result.success) {
            return sendMessageWithTemplate(
                sock, 
                remoteJid, 
                `${lowercaseKeyword} has been added to the list ✅ / تم إضافة ${lowercaseKeyword} إلى القائمة ✅\n\n_Type *list* to see all list items / اكتب *list* لرؤية جميع العناصر_`, 
                message
            );
        }

        return sendMessageWithTemplate(sock, remoteJid, `❌ ${result.message}`, message);
    } catch (error) {
        console.error('Error processing command / خطأ في معالجة الأمر:', error);
        return sendMessageWithTemplate(sock, remoteJid, '_❌ Sorry, an error occurred while processing the data / عذرًا، حدث خطأ أثناء معالجة البيانات._', message);
    }
}

// Function to send message with template / وظيفة لإرسال رسالة مع قالب
function sendMessageWithTemplate(sock, remoteJid, text, quoted) {
    return sock.sendMessage(remoteJid, { text }, { quoted });
}

// Function to handle media download / وظيفة للتعامل مع تنزيل الوسائط
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
    Commands    : ['addlist'],
    OnlyPremium : false,
    OnlyOwner   : false
};