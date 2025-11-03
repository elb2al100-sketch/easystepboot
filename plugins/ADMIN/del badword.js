const { addBadword, updateBadword, findBadword } = require("@lib/badword");
// Functions to manage badword list
// دوال لإدارة قائمة الكلمات الممنوعة
const { getGroupMetadata } = require("@lib/cache"); 
// Function to get group metadata
// دالة للحصول على بيانات المجموعة
const mess = require("@mess"); 
// Message templates
// قوالب الرسائل

async function handle(sock, messageInfo) {
    const { remoteJid, message, sender, command, fullText } = messageInfo;

    try {
       // Get group metadata
       // الحصول على بيانات المجموعة
       const groupMetadata = await getGroupMetadata(sock, remoteJid);
       const participants  = groupMetadata.participants;

       // Check if sender is admin
       // التحقق مما إذا كان المرسل مسؤول
       const isAdmin = participants.some(participant => participant.id === sender && participant.admin);
       if(!isAdmin) {
           await sock.sendMessage(remoteJid, { text: mess.general.isAdmin }, { quoted: message });
           return;
       }

        // Ensure group data exists
        // التأكد من وجود بيانات المجموعة
        let dataGrub = await ensureGroupData(remoteJid);

        // Get arguments from message
        // استخراج الكلمات المراد حذفها من الرسالة
        const args = fullText.trim().split(" ").slice(1);
        let responseMessage = await removeBadwordFromList(remoteJid, dataGrub, args);

        // Send response to group
        // إرسال الرد إلى المجموعة
        await sendResponse(sock, remoteJid, responseMessage, message);
    } catch (error) {
        await sendResponse(
            sock, 
            remoteJid, 
            "⚠️ _An error occurred while processing the command._\n⚠️ حدث خطأ أثناء معالجة الأمر.", 
            message
        );
    }
}

// Additional function to ensure group data exists
// دالة إضافية للتأكد من وجود بيانات المجموعة
async function ensureGroupData(remoteJid) {
    let dataGrub = await findBadword(remoteJid);
    if (!dataGrub) {
        await addBadword(remoteJid, { listBadword: [] });
        dataGrub = { listBadword: [] };
    }
    return dataGrub;
}

// Function to remove words from the badword list
// دالة لحذف الكلمات من قائمة الكلمات الممنوعة
async function removeBadwordFromList(remoteJid, dataGrub, words) {
    if (words.length === 0) {
        return "⚠️ _Please provide words to remove._\n⚠️ الرجاء إدخال الكلمات المراد حذفها.";
    }

    const deletedWords = [];
    dataGrub.listBadword = dataGrub.listBadword.filter(word => {
        // Convert words to lowercase for comparison
        // تحويل الكلمات إلى أحرف صغيرة للمقارنة
        const lowerCaseWord = word.toLowerCase();
        const lowerCaseWords = words.map(w => w.toLowerCase());
    
        if (lowerCaseWords.includes(lowerCaseWord)) {
            deletedWords.push(word);
            return false; // Remove this word
            // إزالة هذه الكلمة
        }
        return true; // Keep this word
        // الاحتفاظ بهذه الكلمة
    });
    
    if (deletedWords.length === 0) {
        return "⚠️ _No words found in the badword list._\n⚠️ لم يتم العثور على أي كلمات في قائمة الكلمات الممنوعة.";
    }

    await updateBadword(remoteJid, { listBadword: dataGrub.listBadword });
    return `✅ _The following words were successfully removed from the badword list:_ ${deletedWords.join(", ")}\n✅ _تم حذف الكلمات التالية من قائمة الكلمات الممنوعة:_ ${deletedWords.join(", ")}`;
}

// Function to send response to the group
// دالة لإرسال الرد إلى المجموعة
async function sendResponse(sock, remoteJid, text, quotedMessage) {
    await sock.sendMessage(remoteJid, { text }, { quoted: quotedMessage });
}

module.exports = {
    handle,
    Commands    : ["delbadword"], // Command name / اسم الأمر
    OnlyPremium : false,           // Available for all users / متاح لجميع المستخدمين
    OnlyOwner   : false,           // Not restricted to owner / ليس مقتصرًا على المالك
};