const config        = require("@config");
const max_warnings  = config.BADWORD.warning; // 🇬🇧 Maximum allowed warnings
                                               // 🇸🇦 الحد الأقصى للتحذيرات المسموح بها

/**
 * 🇬🇧 Badword detection and warning handler with automatic messages
 * 🇸🇦 كشف الكلمات السيئة وإدارة التحذيرات مع رسائل تلقائية
 * 
 * @param {Function} sendMessage - Function to send a message to a user
 */
const badwordDetection = ((sendMessage) => {
    const senderLog = {}; // 🇬🇧 Temporary storage for sender data
                          // 🇸🇦 تخزين مؤقت لبيانات المرسل
    const warnings = {};  // 🇬🇧 Warning count per sender
                          // 🇸🇦 عدد التحذيرات لكل مرسل

    return async (sender, chatId) => {
        // 🇬🇧 Initialize sender log if not exists
        // 🇸🇦 تهيئة سجل المرسل إذا لم يكن موجودًا
        if (!senderLog[sender]) {
            senderLog[sender] = [];
        }

        // 🇬🇧 Initialize warnings for sender if not exists
        // 🇸🇦 تهيئة التحذيرات للمرسل إذا لم تكن موجودة
        if (!warnings[sender]) {
            warnings[sender] = 0;
        }

        // 🇬🇧 If sender exceeded maximum warnings
        // 🇸🇦 إذا تجاوز المرسل الحد الأقصى للتحذيرات
        if (warnings[sender] >= max_warnings) {
            // 🇬🇧 Send blocked message
            // 🇸🇦 إرسال رسالة الحظر
            if (sendMessage && chatId) {
                await sendMessage(chatId, `🚫 You have been blocked due to repeated badwords. / 🚫 تم حظرك بسبب استخدام كلمات سيئة متعددة.`);
            }
            return { status: "blocked", totalWarnings: warnings[sender] }; // 🇬🇧 Sender is blocked
                                                                            // 🇸🇦 تم حظر المرسل
        }

        // 🇬🇧 Add a warning to the sender
        // 🇸🇦 إضافة تحذير للمرسل
        warnings[sender]++;

        // 🇬🇧 Send warning message
        // 🇸🇦 إرسال رسالة تحذير
        if (sendMessage && chatId) {
            await sendMessage(
                chatId,
                `⚠️ Warning ${warnings[sender]}/${max_warnings}: Please avoid using badwords. / ⚠️ تحذير ${warnings[sender]}/${max_warnings}: الرجاء تجنب استخدام الكلمات السيئة.`
            );
        }

        return { status: "warning", totalWarnings: warnings[sender] }; // 🇬🇧 Warning given
                                                                        // 🇸🇦 تم إعطاء تحذير
    };
});

// 🇬🇧 Export the function
// 🇸🇦 تصدير الدالة
module.exports = badwordDetection;