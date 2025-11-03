// Import the deleteSewa function / استيراد دالة حذف بيانات الإيجار
const { deleteSewa } = require("@lib/sewa");

// Main handler function / الدالة الرئيسية لمعالجة الأمر
async function handle(sock, messageInfo) {
    const { remoteJid, message, content, prefix, command } = messageInfo;

    // Validate input / التحقق من وجود محتوى / التحقق من صحة الإدخال
    if (!content || !content.trim()) {
        return await sock.sendMessage(
            remoteJid,
            {
                text: `_⚠️ Usage Format:_\n\n_💬 Example:_ _*${prefix + command} 123xxxxx@g.us*_\n\n_To get the group ID, type *.listsewa*_` 
                // _⚠️ تنسيق الاستخدام:_\n\n_💬 مثال:_ _*${prefix + command} 123xxxxx@g.us*_\n\n_للحصول على معرف المجموعة، اكتب *.listsewa*_
            },
            { quoted: message }
        );
    }

    // Validate group ID format / التحقق من صحة صيغة معرف المجموعة
    if (!content.includes("@g.us")) {
        return await sock.sendMessage(
            remoteJid,
            {
                text: `_⚠️ Invalid format!_\n\n_Make sure the group ID contains '@g.us'._\n\n_💬 Example:_ _*${prefix + command} 123xxxxx@g.us*_` 
                // _⚠️ صيغة غير صحيحة!_\n\n_تأكد أن معرف المجموعة يحتوي على '@g.us'_\n\n_💬 مثال:_ _*${prefix + command} 123xxxxx@g.us*_
            },
            { quoted: message }
        );
    }

    try {
        // Delete rental data based on group ID / حذف بيانات الإيجار حسب معرف المجموعة
        const result = await deleteSewa(content.trim());

        if (result) {
            // Success message / رسالة النجاح
            return await sock.sendMessage(
                remoteJid,
                {
                    text: `✅ _Successfully deleted rental data for group ID:_ *${content}*` 
                    // ✅ _تم حذف بيانات الإيجار بنجاح للمعرف:_ *${content}*
                },
                { quoted: message }
            );
        } else {
            // Group ID not found message / رسالة عند عدم وجود المعرف
            return await sock.sendMessage(
                remoteJid,
                {
                    text: `⚠️ _Group ID not found:_ *${content}*\n\n_Make sure the group ID is correct or listed in the rental list._`
                    // ⚠️ _المعرف غير موجود:_ *${content}*\n\n_تأكد أن معرف المجموعة صحيح أو موجود في قائمة الإيجار._
                },
                { quoted: message }
            );
        }
    } catch (error) {
        console.error("Failed to delete group ID:", error);

        // Error message / رسالة الخطأ
        return await sock.sendMessage(
            remoteJid,
            {
                text: `⚠️ _An error occurred while deleting rental data._\n\n_Error:_ ${error.message}`
                // ⚠️ _حدث خطأ أثناء حذف بيانات الإيجار._\n\n_خطأ:_ ${error.message}
            },
            { quoted: message }
        );
    }
}

// Export module info / تصدير بيانات الموديول
module.exports = {
    handle,
    Commands    : ["delsewa"], // command name / اسم الأمر
    OnlyPremium : false,       // Only premium users? / للمميزين فقط؟ لا
    OnlyOwner   : true         // Only owner? / للمالك فقط؟ نعم
};