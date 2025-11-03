const { addBadword, findBadword } = require("@lib/badword"); 
// English: Functions to add and find badwords in the database
// العربية: دوال لإضافة والبحث عن الكلمات الممنوعة في قاعدة البيانات

async function handle(sock, messageInfo) {
    const { remoteJid, isGroup, message } = messageInfo;

    // English: Only for groups
    // العربية: فقط للمجموعات
    if (!isGroup) return;

    try {
        // English: Retrieve badword data for the specific group and global list
        // العربية: استرجاع بيانات الكلمات الممنوعة للمجموعة المحددة والقائمة العالمية
        const dataGrub = await ensureGroupData(remoteJid);
        const dataGrub2 = await ensureGroupData('global-badword');

        // English: Format the group's badword list
        // العربية: تنسيق قائمة الكلمات الممنوعة الخاصة بالمجموعة
        const badwordList = dataGrub.listBadword.length > 0 
            ? dataGrub.listBadword.map(item => `◧ ${item}`).join("\n") 
            : "_(No badwords in this group / لا توجد كلمات ممنوعة في هذه المجموعة)_";

        // English: Format the global badword list
        // العربية: تنسيق قائمة الكلمات الممنوعة العالمية
        const globalBadwordList = dataGrub2.listBadword.length > 0 
            ? dataGrub2.listBadword.map(item => `◧ ${item}`).join("\n") 
            : "_(No global badwords / لا توجد كلمات ممنوعة عالمياً)_";

        // English: Format the final response message
        // العربية: تنسيق رسالة الاستجابة النهائية
        const responseMessage = `*▧ 「 LIST BADWORDS 」*\n\n` +
            `*📌 Group Badword List / قائمة الكلمات الممنوعة في المجموعة:*\n${badwordList}\n\n` +
            `*🌍 Global Badword List / قائمة الكلمات الممنوعة العالمية:*\n${globalBadwordList}
            
⚠️ _Noted / ملاحظة_ ⚠️
.on badword (delete / حذف)
.on badwordv2 (kick / طرد)
.on badwordv3 (warn 4x then kick / تحذير 4 مرات ثم الطرد)`;

        // English: Send response to the group
        // العربية: إرسال الرد إلى المجموعة
        return await sendResponse(sock, remoteJid, responseMessage, message);
    } catch (error) {
        return await sendResponse(sock, remoteJid, 
            "An error occurred while processing the command. / حدث خطأ أثناء تنفيذ الأمر.", 
            message
        );
    }
}

// English: Ensure group data exists, create if not
// العربية: التأكد من وجود بيانات المجموعة، إنشاء إذا لم تكن موجودة
async function ensureGroupData(remoteJid) {
    let dataGrub = await findBadword(remoteJid);
    if (!dataGrub) {
        await addBadword(remoteJid, { listBadword: [] });
        dataGrub = { listBadword: [] };
    }
    return dataGrub;
}

// English: Send a text response
// العربية: إرسال رسالة نصية كرد
async function sendResponse(sock, remoteJid, text, quotedMessage) {
    await sock.sendMessage(remoteJid, { text }, { quoted: quotedMessage });
}

module.exports = {
    handle,
    Commands    : ["badword", 'listbadword'], // English: Command names / العربية: أسماء الأوامر
    OnlyPremium : false,
    OnlyOwner   : false
};