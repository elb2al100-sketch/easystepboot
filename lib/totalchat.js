const fs = require('fs').promises;
const JSON_PATH = './database/additional/totalchat.json'; // File path / مسار الملف
const AUTOSAVE  = 60; // 60 seconds / 60 ثانية

// Current date in Indonesian format / التاريخ الحالي بصيغة إندونيسيا
const today = new Date().toLocaleDateString('id-ID', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
});

let dbTotalChat = {}; // Temporary in-memory database / قاعدة بيانات مؤقتة في الذاكرة

// **Load data into memory when app starts / تحميل البيانات إلى الذاكرة عند بدء التطبيق**
async function loadTotalChat() {
    try {
        const data = await fs.readFile(JSON_PATH, 'utf8');
        dbTotalChat = JSON.parse(data);
    } catch (error) {
        console.error("❌ Failed to read totalchat.json, using empty data / فشل قراءة totalchat.json، سيتم استخدام بيانات فارغة:", error);
        dbTotalChat = {};
    }
}

// **Save in-memory database to JSON file / حفظ قاعدة البيانات في الملف JSON**
async function saveJsonFiles() {
    try {
        await fs.writeFile(JSON_PATH, JSON.stringify(dbTotalChat, null, 2), 'utf8');
    } catch (error) {
        console.error(`[saveJsonFiles] Error saving file / خطأ أثناء حفظ الملف:`, error);
    }
}

// **Increment user's chat count in a group / زيادة عدد رسائل المستخدم في المجموعة**
function incrementUserChatCount(groupId, userId) {
    if (!dbTotalChat[groupId]) {
        dbTotalChat[groupId] = { createdAt: today, members: {} };
    }

    if (!dbTotalChat[groupId].members[userId]) {
        dbTotalChat[groupId].members[userId] = 0;
    }

    dbTotalChat[groupId].members[userId] += 1;
}

// **Get user's chat count in a group / الحصول على عدد رسائل المستخدم في المجموعة**
function getUserChatCount(groupId, userId) {
    return dbTotalChat[groupId]?.members[userId] || 0;
}

// **Get total chat count of all users in a group / الحصول على إجمالي رسائل جميع المستخدمين في المجموعة**
function getTotalChatPerGroup(groupId) {
    return dbTotalChat[groupId]?.members || {};
}

// **Reset chat count for a specific group / إعادة تعيين عدد الرسائل لمجموعة معينة**
async function resetTotalChatPerGroup(groupId) {
    if (!dbTotalChat[groupId]) return false;

    dbTotalChat[groupId] = { createdAt: today, members: {} };
    await saveJsonFiles();
    return true;
}

// **Reset chat count for all groups / إعادة تعيين عدد الرسائل لجميع المجموعات**
async function resetAllTotalChat() {
    dbTotalChat = {};
    await saveJsonFiles();
}

// **Auto-save every AUTOSAVE seconds / حفظ تلقائي كل AUTOSAVE ثانية**
setInterval(saveJsonFiles, AUTOSAVE * 1000);

// **Load data when the app starts / تحميل البيانات عند تشغيل التطبيق**
loadTotalChat();

// **Export functions / تصدير الدوال**
module.exports = {
    incrementUserChatCount,
    getUserChatCount,
    getTotalChatPerGroup,
    resetTotalChatPerGroup,
    resetAllTotalChat
};