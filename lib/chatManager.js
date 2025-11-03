// Chat history map / خريطة محفوظات الدردشة
const chatHistoryMap = new Map();

// Number of messages to keep temporarily for anti-delete/anti-edit / عدد الرسائل المخزنة مؤقتًا لمنع الحذف/التعديل
const totalChat = 20;

// Add message to user's chat history / إضافة رسالة إلى محفوظات الدردشة للمستخدم
function addChat(userId, message) {
    const userChatHistory = chatHistoryMap.get(userId) || [];
    userChatHistory.push(message);
    if (userChatHistory.length > totalChat) {
        userChatHistory.shift(); // remove oldest message / إزالة أقدم رسالة
    }
    chatHistoryMap.set(userId, userChatHistory);
}

// Get chat history for a specific user / الحصول على محفوظات الدردشة لمستخدم معين
function getChatHistory(userId) {
    return chatHistoryMap.get(userId) || [];
}

// Clear chat history for a specific user / مسح محفوظات الدردشة لمستخدم معين
function clearChatHistory(userId) {
    chatHistoryMap.delete(userId);
}

// Get all users who have chat history / الحصول على جميع المستخدمين الذين لديهم محفوظات
function getAllUsers() {
    return Array.from(chatHistoryMap.keys());
}

// Find a message by ID for a specific user / البحث عن رسالة حسب المعرف لمستخدم معين
function findMessageById(userId, messageId) {
    const userChatHistory = getChatHistory(userId);
    return userChatHistory.find(message => message.id === messageId) || null;
}

// Edit a message by ID and sender / تعديل رسالة حسب المعرف والمرسل
function editMessageById(sender, id, newText) {
    const userMessages = chatHistoryMap.get(sender);

    if (!userMessages) {
        throw new Error(`Sender ${sender} not found / المرسل ${sender} غير موجود.`);
    }

    const messageIndex = userMessages.findIndex(msg => msg.id === id);
    if (messageIndex === -1) {
        throw new Error(`Message with ID ${id} not found for sender ${sender} / الرسالة بالمعرف ${id} غير موجودة للمرسل ${sender}.`);
    }

    userMessages[messageIndex].text = newText;
    return userMessages[messageIndex];
}

// Export functions / تصدير الدوال
module.exports = {
    addChat,
    getChatHistory,
    clearChatHistory,
    getAllUsers,
    findMessageById,
    editMessageById
};