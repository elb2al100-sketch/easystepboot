const { updateKeyword } = require('@lib/list'); // Function to update a list keyword / دالة لتحديث كلمة مفتاحية في القائمة
const { getGroupMetadata } = require("@lib/cache"); // Get group metadata / الحصول على بيانات المجموعة
const mess = require('@mess'); // Predefined messages / رسائل جاهزة

async function handle(sock, messageInfo) {
    const { remoteJid, isGroup, message, content, sender, command, prefix } = messageInfo;

    try {
        let idList = remoteJid;

        if(!isGroup) { 
            // Personal chat / محادثة خاصة
            idList = 'owner';
        } else {
            // Get group metadata / الحصول على بيانات المجموعة
            const groupMetadata = await getGroupMetadata(sock, remoteJid);
            const participants  = groupMetadata.participants;

            // Check if sender is admin / التحقق من أن المرسل مشرف
            const isAdmin = participants.some(
                participant => participant.id === sender && participant.admin
            );
            if(!isAdmin) {
                await sock.sendMessage(
                    remoteJid, 
                    { text: mess.general.isAdmin }, // ⚠️ Only admin can use this command / ⚠️ فقط المشرف يمكنه استخدام هذا الأمر
                    { quoted: message }
                );
                return;
            }
        }

        // Split old keyword and new keyword / تقسيم الكلمة القديمة والجديدة
        const [keywordOld, keywordNew] = content.split('|').map(item => item.trim().toLowerCase());

        if (!keywordOld || !keywordNew) {
            return sendMessageWithTemplate(
                sock, 
                remoteJid, 
                `_⚠️ Usage Format / صيغة الاستخدام:_ \n\n_💬 Example / مثال:_ _*${prefix + command} oldkey | newkey*_`, 
                message
            );
        }

        // Update the keyword / تحديث الكلمة المفتاحية
        const updatedStatus = await updateKeyword(idList, keywordOld, keywordNew);

        if(updatedStatus && updatedStatus.success){
            return sendMessageWithTemplate(sock, remoteJid, updatedStatus.message, message);
        } else {
            return sendMessageWithTemplate(sock, remoteJid, updatedStatus.message, message);
        }

    } catch (error) {
        console.error('Error processing command / خطأ عند معالجة الأمر:', error);
        return sendMessageWithTemplate(
            sock, 
            remoteJid, 
            '_❌ Sorry, an error occurred while processing the data / عذراً، حدث خطأ أثناء معالجة البيانات._', 
            message
        );
    }
}

// Function to send a message with template / دالة لإرسال رسالة مع قالب
function sendMessageWithTemplate(sock, remoteJid, text, quoted) {
    return sock.sendMessage(remoteJid, { text }, { quoted });
}

module.exports = {
    handle,
    Commands    : ['renamelist'], // Command name / اسم الأمر
    OnlyPremium : false,          // Available to all users / متاح لجميع المستخدمين
    OnlyOwner   : false,          // Not limited to owner / لا يقتصر على المالك
};