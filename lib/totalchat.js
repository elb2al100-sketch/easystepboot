const fs = require('fs').promises;
const JSON_PATH = './database/additional/totalchat.json';
const AUTOSAVE  = 60; // 60 seconds
// 60 ثانية

const today = new Date().toLocaleDateString('id-ID', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
});
// Format tanggal saat ini: DD/MM/YYYY
// تنسيق التاريخ الحالي: يوم/شهر/سنة

let dbTotalChat = {}; // Temporary in-memory database
// قاعدة بيانات مؤقتة في الذاكرة

/* Load data into memory when the application starts */
// تحميل البيانات إلى الذاكرة عند بدء تشغيل التطبيق
async function loadTotalChat() {
    try {
        const data = await fs.readFile(JSON_PATH, 'utf8');
        dbTotalChat = JSON.parse(data);
    } catch (error) {
        console.error("❌ Failed to read totalchat.json, using empty data:", error);
        // ❌ فشل قراءة ملف totalchat.json، استخدام بيانات فارغة
        dbTotalChat = {};
    }
}

/* Save data to JSON file */
// حفظ البيانات في ملف JSON
async function saveJsonFiles() {
    try {
        await fs.writeFile(JSON_PATH, JSON.stringify(dbTotalChat, null, 2), 'utf8');
    } catch (error) {
        console.error(`[saveJsonFiles] Error saving file:`, error);
        // خطأ عند حفظ الملف
    }
}

/* Increment user's chat count in a group */
// زيادة عدد رسائل المستخدم في مجموعة
function incrementUserChatCount(groupId, userId) {
    if (!dbTotalChat[groupId]) {
        dbTotalChat[groupId] = { createdAt: today, members: {} };
    }

    if (!dbTotalChat[groupId].members[userId]) {
        dbTotalChat[groupId].members[userId] = 0;
    }

    dbTotalChat[groupId].members[userId] += 1;
}

/* Get user's chat count in a group */
// الحصول على عدد رسائل المستخدم في مجموعة
function getUserChatCount(groupId, userId) {
    return dbTotalChat[groupId]?.members[userId] || 0;
}

/* Get total chats of all users in a group */
// الحصول على إجمالي الرسائل لجميع المستخدمين في مجموعة
function getTotalChatPerGroup(groupId) {
    return dbTotalChat[groupId]?.members || {};
}

/* Reset total chats in a specific group */
// إعادة تعيين إجمالي الرسائل في مجموعة معينة
async function resetTotalChatPerGroup(groupId) {
    if (!dbTotalChat[groupId]) return false;

    dbTotalChat[groupId] = { createdAt: today, members: {} };
    await saveJsonFiles();
    return true;
}

/* Reset total chats for all groups */
// إعادة تعيين إجمالي الرسائل لجميع المجموعات
async function resetAllTotalChat() {
    dbTotalChat = {};
    await saveJsonFiles();
}

// Auto-save at regular intervals
// الحفظ التلقائي بفواصل زمنية محددة
setInterval(saveJsonFiles, AUTOSAVE * 1000);

/* Load data when the application runs */
// تحميل البيانات عند تشغيل التطبيق
loadTotalChat();

/* Export functions */
// تصدير الدوال
module.exports = {
    incrementUserChatCount,
    getUserChatCount,
    getTotalChatPerGroup,
    resetTotalChatPerGroup,
    resetAllTotalChat
};