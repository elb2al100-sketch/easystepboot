const config = require("@config");

const spam_limit    = config.SPAM.limit;       // Maximum messages allowed
// الحد الأقصى للرسائل المسموح بها
const spam_cooldown = config.SPAM.couldown * 1000; // Cooldown time in milliseconds
// وقت الانتظار بالمللي ثانية
const max_warnings  = config.SPAM.warning;     // Maximum number of warnings
// الحد الأقصى للتحذيرات

// Spam detection module
// وحدة كشف الرسائل المزعجة
const spamDetection = (() => {
    const senderLog = {};  // Temporary storage for sender data
    // تخزين مؤقت لبيانات المرسل
    const warnings = {};   // Storage for warnings per sender
    // تخزين التحذيرات لكل مرسل

    return (sender) => {
        const now = Date.now();

        // Initialize sender data if not exists
        // تهيئة بيانات المرسل إذا لم تكن موجودة
        if (!senderLog[sender]) {
            senderLog[sender] = [];
        }

        if (!warnings[sender]) {
            warnings[sender] = 0;
        }

        // Remove old entries based on cooldown
        // إزالة الإدخالات القديمة وفقًا لفترة الانتظار
        senderLog[sender] = senderLog[sender].filter((timestamp) => now - timestamp <= spam_cooldown);

        // Add new timestamp entry for sender
        // إضافة طابع زمني جديد للمرسل
        senderLog[sender].push(now);

        // Spam detection
        // كشف الرسائل المزعجة
        if (senderLog[sender].length > spam_limit) {
            warnings[sender] += 1; // Add warning for sender
            // إضافة تحذير للمرسل
            senderLog[sender] = []; // Reset sender log
            // إعادة تعيين سجل المرسل

            // If sender has exceeded the maximum warnings
            // إذا تجاوز المرسل الحد الأقصى للتحذيرات
            if (warnings[sender] >= max_warnings) {
                return { status: "blocked", totalWarnings: warnings[sender] }; // Sender is blocked
                // تم حظر المرسل
            }

            return { status: "warning", totalWarnings: warnings[sender] }; // Warning given
            // تم إعطاء تحذير
        }

        return { status: "safe", totalWarnings: warnings[sender] }; // No spam detected
        // لا توجد رسائل مزعجة
    };
})();

module.exports = spamDetection;