// Import required libraries / استيراد المكتبات المطلوبة
const { incrementUserChatCount } = require("@lib/totalchat"); // Function to increment user's chat count / دالة لزيادة عدد رسائل المستخدم
const { addChat } = require("@lib/chatManager"); // Function to add chat to manager / دالة لإضافة الرسائل إلى مدير الدردشة
const { downloadMedia } = require('@lib/utils'); // Function to download media / دالة لتحميل الوسائط

// Main chat processing function / الدالة الرئيسية لمعالجة الرسائل
async function process(sock, messageInfo) {
    const { remoteJid, message, id, sender, isGroup, fullText, type } = messageInfo;
    
    try {
        if (isGroup) { // Process only if message is from a group / معالجة الرسائل فقط إذا كانت من مجموعة

            await incrementUserChatCount(remoteJid, sender); 
            // Increment chat count for this sender in the group / زيادة عدد رسائل المرسل في المجموعة

            let newMessage;
            if (type === 'sticker') {
                const mediaPath = `./tmp/${await downloadMedia(message)}`; 
                // Download sticker / تحميل الملصق
                newMessage = {
                    id,
                    text: mediaPath, // Store path to media / تخزين مسار الوسائط
                    type,
                };
            } else if (fullText) {
                // If fullText is available, use it as text / إذا كان النص متاحًا، استخدمه كنص
                newMessage = {
                    id,
                    text: fullText,
                };
            }

            // If newMessage is set, add it to chat manager / إذا تم تعيين newMessage، أضفه إلى مدير الدردشة
            if (newMessage) {
                addChat(sender, newMessage);
            }
        }
    } catch (error) {
        console.error("Error dalam proses Chat:", error); 
        // Log any errors / تسجيل أي أخطاء
    }

    return true; // Continue to next plugin / الاستمرار إلى البرنامج المساعد التالي
}

// Export the chat plugin module / تصدير وحدة البرنامج المساعد
module.exports = {
    name: "Chat", // Plugin name / اسم البرنامج المساعد
    priority: 3, // Plugin priority / أولوية البرنامج المساعد
    process // Process function / دالة المعالجة
};