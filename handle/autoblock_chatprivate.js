// Set to track users who have been responded / مجموعة لتتبع المستخدمين الذين تم الرد عليهم
const respondedSenders = new Set();

// Main processing function / الدالة الرئيسية للمعالجة
async function process(sock, messageInfo) {
    const { sender, remoteJid, isGroup } = messageInfo;

    // COMMENT THIS TO ACTIVATE / علق هذا لتفعيل
    return true;

    if (isGroup) return true; // Ignore if message is from a group / تجاهل الرسائل من المجموعات
    if (remoteJid == 'status@broadcast') return true; // Ignore story / تجاهل القصص

    if (respondedSenders.has(sender)) return true; // Skip if user already responded / تجاهل إذا تم الرد على المستخدم مسبقًا

    try {
        // Send a message to the sender (currently commented) / إرسال رسالة إلى المرسل (معلق حالياً)
        // await sock.sendMessage(sender, { text: 'Kata kata hari ini' }, { quoted: message });

        await sock.updateBlockStatus(sender, "block"); // Block the user / حظر المستخدم

        // Mark sender as already blocked / وضع علامة على المرسل كمحظور
        respondedSenders.add(sender);
    } catch (error) {
        console.error("Error in block user:", error); // Log any errors / تسجيل أي أخطاء
    }
    return true; // Continue to next plugin / الاستمرار إلى البرنامج المساعد التالي
}

// Export the plugin module / تصدير وحدة البرنامج المساعد
module.exports = {
    name: "Autoblock Chat Pribadi", // Plugin name / اسم البرنامج المساعد
    priority: 10, // Plugin priority / أولوية البرنامج المساعد
    process, // Process function / دالة المعالجة
};