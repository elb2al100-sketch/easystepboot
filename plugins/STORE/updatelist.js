const { updateList, getDataByGroupId } = require('@lib/list'); // Functions to update and get list / دوال لتحديث والحصول على القوائم
const { downloadQuotedMedia, downloadMedia } = require('@lib/utils'); // Functions to download media / دوال لتحميل الوسائط
const { getGroupMetadata } = require("@lib/cache"); // Function to get group metadata / دالة للحصول على بيانات المجموعة
const { deleteCache } = require('@lib/globalCache'); // Function to clear cache / دالة لمسح الكاش
const mess = require('@mess'); // Predefined messages / رسائل جاهزة

async function handle(sock, messageInfo) {
    const { remoteJid, isGroup, message, content, sender, command, prefix } = messageInfo;

    try {
        let idList = remoteJid;

        if(!isGroup) { // Private chat / دردشة خاصة
            idList = 'owner';
        } else {
            // Get group metadata / الحصول على بيانات المجموعة
            const groupMetadata = await getGroupMetadata(sock, remoteJid);
            const participants  = groupMetadata.participants;
            const isAdmin = participants.some(participant => participant.id === sender && participant.admin);
            if(!isAdmin) {
                await sock.sendMessage(remoteJid, { text: mess.general.isAdmin }, { quoted: message });
                // ⚠️ Only admins can update the list / ⚠️ فقط المشرفين يمكنهم تحديث القوائم
                return;
            }
        }

        // Validate message content / التحقق من محتوى الرسالة
        if (!content.trim()) {
            return sendMessageWithTemplate(
                sock, 
                remoteJid, 
                `_⚠️ Usage Format / صيغة الاستخدام:_ \n\n_💬 Example / مثال:_ _*${prefix + command} payment | Payment via Dana only ...*_ \n\n_If you want to add a list with media, send/reply the media with caption_ *${prefix + command}*`, 
                message
            );
        }

        // Split keyword and text / فصل الكلمة المفتاحية والنص
        let text = '';
        let keyword = '';

        const parts = content.split('|');
        keyword = parts.shift().trim(); // Remove extra spaces / إزالة الفراغات الزائدة
        text = parts.join('|'); // Join remaining text / دمج النص المتبقي كما هو

        const lowercaseKeyword = keyword.trim().toLowerCase();

        if (!keyword || !text) {
            return sendMessageWithTemplate(
                sock, 
                remoteJid, 
                `_⚠️ Usage Format / صيغة الاستخدام:_ \n\n_💬 Example / مثال:_ _*${prefix + command} payment | Payment via Dana only ...*_ \n\n_If you want to add a list with media, send/reply the media with caption_ *${prefix + command}*`, 
                message
            );
        }

        // Check if the keyword exists / التحقق مما إذا كانت الكلمة المفتاحية موجودة
        const currentList = await getDataByGroupId(idList);
        if (!currentList?.list?.[lowercaseKeyword]) {
            return sendMessageWithTemplate(
                sock, 
                remoteJid, 
                `⚠️ _Keyword *${lowercaseKeyword}* not found / الكلمة المفتاحية *${lowercaseKeyword}* غير موجودة._`, 
                message
            );
        }

        // Reset cache / مسح الكاش
        deleteCache(`list-${idList}`);
         
        // Handle media if exists / التعامل مع الوسائط إذا وجدت
        const mediaUrl = await handleMedia(messageInfo);

        // Update the list in database / تحديث القائمة في قاعدة البيانات
        const result = await updateList(idList, lowercaseKeyword, { text, media: mediaUrl });
        if (result.success) {
            return sendMessageWithTemplate(
                sock, 
                remoteJid, 
                `${lowercaseKeyword} _successfully updated / تم تحديثها بنجاح_\n\n_Type *list* to view the list / اكتب *list* لعرض القائمة._`, 
                message
            );
        }

        return sendMessageWithTemplate(sock, remoteJid, `❌ ${result.message}`, message);
    } catch (error) {
        console.error('Error processing command:', error);
        return sendMessageWithTemplate(sock, remoteJid, '_❌ Sorry, an error occurred while processing the data / حدث خطأ أثناء معالجة البيانات._', message);
    }
}

// Function to send messages with template / دالة لإرسال الرسائل مع القالب
function sendMessageWithTemplate(sock, remoteJid, text, quoted) {
    return sock.sendMessage(remoteJid, { text }, { quoted });
}

// Function to handle media download / دالة للتعامل مع تحميل الوسائط
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
    Commands: ['updatelist'],
    OnlyPremium: false,
    OnlyOwner: false,
};