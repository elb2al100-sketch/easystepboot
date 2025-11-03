const { deleteList, getDataByGroupId }  = require('@lib/list');
const { getGroupMetadata }              = require("@lib/cache");
const { deleteCache }                   = require('@lib/globalCache');
const mess = require('@mess');

async function handle(sock, messageInfo) {
    const { remoteJid, isGroup, message, content, sender, command, prefix } = messageInfo;

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
        
        // Validate input content / التحقق من محتوى الرسالة
        if (!content) {
            await sock.sendMessage(remoteJid, {
                text: `_⚠️ Usage Format / صيغة الاستخدام:_ \n\n_Example / مثال:_ _*${prefix + command} payment*_`
            }, { quoted: message });
            return; // Stop execution if no content / إيقاف التنفيذ إذا لم يكن هناك محتوى
        }

        // Check if keyword exists / التحقق مما إذا كانت الكلمة موجودة
        const currentList = await getDataByGroupId(idList);
        const lowercaseKeyword = content.trim().toLowerCase();

        if (currentList?.list?.[lowercaseKeyword]) {
            await deleteList(idList, lowercaseKeyword);
            deleteCache(`list-${idList}`);
            return sendMessageWithTemplate(
                sock, 
                remoteJid, 
                `Keyword *${lowercaseKeyword}* has been successfully deleted ✅ / تم حذف الكلمة *${lowercaseKeyword}* بنجاح ✅`, 
                message
            );
        } else {
            return sendMessageWithTemplate(
                sock, 
                remoteJid, 
                `Keyword *${lowercaseKeyword}* not found ⚠️ / الكلمة *${lowercaseKeyword}* غير موجودة ⚠️`, 
                message
            );
        }

    } catch (error) {
        console.error('Error processing command / خطأ في معالجة الأمر:', error);
        return sendMessageWithTemplate(
            sock, 
            remoteJid, 
            '_❌ Sorry, an error occurred while processing the data / عذرًا، حدث خطأ أثناء معالجة البيانات._', 
            message
        );
    }
}

// Function to send message with template / وظيفة لإرسال رسالة مع قالب
function sendMessageWithTemplate(sock, remoteJid, text, quoted) {
    return sock.sendMessage(remoteJid, { text }, { quoted });
}

module.exports = {
    handle,
    Commands    : ['dellist','deletelist'],
    OnlyPremium : false,
    OnlyOwner   : false,
};