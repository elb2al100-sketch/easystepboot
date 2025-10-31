
const chatHistoryMap = new Map(); // 🇬🇧 Map to store chat history per user
                                   // 🇸🇦 خريطة لتخزين سجل المحادثات لكل مستخدم
const totalChat      = 20;        // 🇬🇧 Maximum number of messages stored temporarily
                                   // 🇸🇦 الحد الأقصى لعدد الرسائل المخزنة مؤقتًا (لتجنب الحذف/التعديل)

// 🇬🇧 Add a message to user's chat history
// 🇸🇦 إضافة رسالة إلى سجل المحادثات للمستخدم
function addChat(userId, message) {
    const userChatHistory = chatHistoryMap.get(userId) || [];
    userChatHistory.push(message);

    // 🇬🇧 Remove oldest message if exceeding totalChat limit
    // 🇸🇦 إزالة أقدم رسالة إذا تجاوز عدد الرسائل الحد المحدد
    if (userChatHistory.length > totalChat) {
        userChatHistory.shift();
    }
    chatHistoryMap.set(userId, userChatHistory);
}

// 🇬🇧 Get all messages for a user
// 🇸🇦 الحصول على جميع الرسائل لمستخدم معين
function getChatHistory(userId) {
    return chatHistoryMap.get(userId) || [];
}

// 🇬🇧 Clear chat history for a user
// 🇸🇦 مسح سجل المحادثات لمستخدم معين
function clearChatHistory(userId) {
    chatHistoryMap.delete(userId);
}

// 🇬🇧 Get all users who have chat history
// 🇸🇦 الحصول على جميع المستخدمين الذين لديهم سجل محادثات
function getAllUsers() {
    return Array.from(chatHistoryMap.keys());
}

// 🇬🇧 Find a specific message by its ID for a user
// 🇸🇦 البحث عن رسالة محددة بالمعرف لمستخدم معين
function findMessageById(userId, messageId) {
    const userChatHistory = getChatHistory(userId);
    return userChatHistory.find(message => message.id === messageId) || null;
}

// 🇬🇧 Edit a message by ID for a specific sender
// 🇸🇦 تعديل رسالة حسب المعرف لمستخدم معين
function editMessageById(sender, id, newText) {
    const userMessages = chatHistoryMap.get(sender);

    if (!userMessages) {
        throw new Error(`Sender ${sender} not found. / المرسل ${sender} غير موجود.`);
    }

    const messageIndex = userMessages.findIndex(msg => msg.id === id);
    if (messageIndex === -1) {
        throw new Error(`Message with ID ${id} not found for sender ${sender}. / الرسالة بالمعرف ${id} غير موجودة للمرسل ${sender}.`);
    }

    userMessages[messageIndex].text = newText;
    return userMessages[messageIndex];
}

// 🇬🇧 Export all functions
// 🇸🇦 تصدير جميع الدوال
module.exports = {
    addChat,
    getChatHistory,
    clearChatHistory,
    getAllUsers,
    findMessageById,
    editMessageById
};