const { addBadword, updateBadword, findBadword } = require("@lib/badword");
const { getGroupMetadata } = require("@lib/cache"); 
const mess = require("@mess");

async function handle(sock, messageInfo) {
    const { remoteJid, message, sender, command, fullText } = messageInfo;

    try {

        // Ensure group data exists | التأكد من توفر بيانات المجموعة
        let dataGrub = await ensureGroupData('global-badword');

        // Get arguments from the message | الحصول على الوسائط من الرسالة
        const args = fullText.trim().split(" ").slice(1);
        let responseMessage = await removeBadwordFromList('global-badword', dataGrub, args);

        // Send response to group | إرسال الرد إلى المجموعة
        await sendResponse(sock, remoteJid, responseMessage, message);
    } catch (error) {
        await sendResponse(sock, remoteJid, "⚠️ _An error occurred while processing the command | حدث خطأ أثناء معالجة الأمر._", message);
    }
}


// Additional function to ensure group data exists | دالة إضافية للتأكد من وجود بيانات المجموعة
async function ensureGroupData(remoteJid) {
    let dataGrub = await findBadword(remoteJid);
    if (!dataGrub) {
        await addBadword(remoteJid, { listBadword: [] });
        dataGrub = { listBadword: [] };
    }
    return dataGrub;
}

// Function to remove words from the badword list | دالة لحذف الكلمات من قائمة الكلمات المحظورة
async function removeBadwordFromList(remoteJid, dataGrub, words) {
    if (words.length === 0) {
        return "⚠️ _Please provide the words you want to remove | يرجى تقديم الكلمات التي تريد حذفها._";
    }

    const deletedWords = [];
    dataGrub.listBadword = dataGrub.listBadword.filter(word => {
        // Convert all words to lowercase for comparison | تحويل كل الكلمات إلى أحرف صغيرة للمقارنة
        const lowerCaseWord = word.toLowerCase();
        const lowerCaseWords = words.map(w => w.toLowerCase());
    
        if (lowerCaseWords.includes(lowerCaseWord)) {
            deletedWords.push(word);
            return false;
        }
        return true;
    });
    
    if (deletedWords.length === 0) {
        return "⚠️ _No words found in the badword list | لم يتم العثور على أي كلمات في قائمة الكلمات المحظورة._";
    }

    await updateBadword(remoteJid, { listBadword: dataGrub.listBadword });
    return `✅ _The following words were successfully removed from the badword list | تم حذف الكلمات التالية بنجاح من قائمة الكلمات المحظورة:_ ${deletedWords.join(", ")}`;
}

// Function to send response to the group | دالة لإرسال الرد إلى المجموعة
async function sendResponse(sock, remoteJid, text, quotedMessage) {
    await sock.sendMessage(remoteJid, { text }, { quoted: quotedMessage });
}

module.exports = {
    handle,
    Commands    : ["delglobalbadword"],
    OnlyPremium : false,
    OnlyOwner   : true
};