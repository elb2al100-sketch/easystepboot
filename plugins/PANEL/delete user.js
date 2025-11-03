const config = require("@config");
const { deleteUser, saveUser } = require("@lib/panel");

async function handle(sock, messageInfo) {
    const { remoteJid, message, content, prefix, command } = messageInfo;

    try {
        // Validate input content / التحقق من محتوى الإدخال
        if (!content || isNaN(content) || Number(content) <= 0) {
            await sock.sendMessage(remoteJid, {
                text: `_Example / مثال: *${prefix + command} 1*_ (Use user ID / استخدم رقم المستخدم)`
            }, { quoted: message });
            return;
        }

        // Input valid, send reaction / إدخال صحيح، إرسال رد فعل
        await sock.sendMessage(remoteJid, { react: { text: "🤌🏻", key: message.key } });

        // Call deleteUser function / استدعاء دالة حذف المستخدم
        const result = await deleteUser(Number(content));

        if (result) {
            // Save user data after deletion / حفظ بيانات المستخدم بعد الحذف
            await saveUser();  
        }

        // Send success response / إرسال رسالة نجاح
        await sock.sendMessage(remoteJid, {
            text: `✅ User with ID ${content} successfully deleted / تم حذف المستخدم بالمعرف ${content} بنجاح`
        }, { quoted: message });

    } catch (error) {
        console.error("Error in handle function:", error);

        // Collect error messages if available / جمع رسائل الخطأ إذا كانت متاحة
        let errorMessage = "❌ An error occurred while deleting the user / حدث خطأ أثناء حذف المستخدم.\n";
        if (error.errors && Array.isArray(error.errors)) {
            errorMessage += "\n";
            error.errors.forEach(err => {
                errorMessage += `- ${err.detail}\n`;
            });
        }

        // Send error message to user / إرسال رسالة الخطأ للمستخدم
        try {
            await sock.sendMessage(remoteJid, {
                text: errorMessage.trim()
            }, { quoted: messageInfo?.message });
        } catch (sendError) {
            console.error("Error sending error message:", sendError);
        }
    }
}

module.exports = {
    handle,
    Commands    : ['deluser'],   // Command trigger / كلمة الأمر
    OnlyPremium : false,          // Not limited to premium / غير مقتصر على المميزين
    OnlyOwner   : true,           // Owner-only command / مقتصر على المالك
};