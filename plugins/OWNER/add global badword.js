// Import database functions for managing badwords
// استيراد الدوال الخاصة بإدارة كلمات السب
// استدعاء وظائف قاعدة البيانات لإضافة وتحديث والبحث عن كلمات السب
const { addBadword, updateBadword, findBadword } = require("@lib/badword");

async function handle(sock, messageInfo) {
    const { remoteJid, message, sender, prefix, command, content, fullText } = messageInfo;

    try {
        // Validate input
        // التحقق من وجود محتوى
        if (!content || !content.trim()) {
            return await sock.sendMessage(
                remoteJid,
                { text: `_⚠️ Usage Format:_ \n_💬 Example:_ _*${prefix + command} dumb*_ 
                
_⚠️ تنسيق الاستخدام:_ \n_💬 مثال:_ _*${prefix + command} غبي*_` },
                { quoted: message }
            );
        }

        // Extract words to add from the message
        // استخراج الكلمات المراد إضافتها من الرسالة
        const args = fullText.trim().split(" ").slice(1);

        // Ensure the "global-badword" group data exists
        // التأكد من وجود بيانات المجموعة "global-badword"
        const dataGrub = await ensureGroupData('global-badword');

        // Add words to badword list
        // إضافة الكلمات إلى قائمة كلمات السب
        const responseMessage = await addBadwordToList('global-badword', dataGrub, args);

        // Send response to group
        // إرسال الرد إلى المجموعة
        await sendResponse(sock, remoteJid, responseMessage, message);

    } catch (error) {
        console.error(error);
        await sendResponse(
            sock, 
            remoteJid, 
            `_⚠️ An error occurred while processing the command._\n_⚠️ حدث خطأ أثناء معالجة الأمر_`, 
            message
        );
    }
}

// Ensure group data exists
// التأكد من وجود بيانات المجموعة
async function ensureGroupData(remoteJid) {
    let dataGrub = await findBadword(remoteJid);
    if (!dataGrub) {
        await addBadword(remoteJid, { listBadword: [] });
        dataGrub = { listBadword: [] };
    }
    return dataGrub;
}

// Add new badwords to the list
// إضافة كلمات جديدة لقائمة كلمات السب
async function addBadwordToList(remoteJid, dataGrub, words) {
    if (words.length === 0) {
        return `_⚠️ Please provide words to add. Example: .addbadword dumb_\n_⚠️ الرجاء إدخال الكلمات المراد إضافتها. مثال: .addbadword غبي_`;
    }

    // Filter out duplicates
    // إزالة الكلمات المكررة
    const newWords = words.filter(word => !dataGrub.listBadword.includes(word));
    if (newWords.length === 0) {
        return `_⚠️ All words already exist in the badword list._\n_⚠️ جميع الكلمات موجودة بالفعل في قائمة الكلمات المحظورة_`;
    }

    dataGrub.listBadword.push(...newWords);
    await updateBadword(remoteJid, { listBadword: dataGrub.listBadword });

    return `_✅ Successfully added words:_ ${newWords.join(", ")}\n_✅ تم إضافة الكلمات بنجاح:_ ${newWords.join(", ")}`;
}

// Send response message to group
// إرسال رسالة الرد إلى المجموعة
async function sendResponse(sock, remoteJid, text, quotedMessage) {
    await sock.sendMessage(remoteJid, { text }, { quoted: quotedMessage });
}

module.exports = {
    handle,
    Commands    : ["addglobalbadword"], // Command name
    OnlyPremium : false,
    OnlyOwner   : true
};