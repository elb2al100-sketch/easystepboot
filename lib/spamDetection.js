const config = require("@config"); // استيراد إعدادات المشروع / Import project configuration

// إعدادات كشف الرسائل المزعجة / Spam detection settings
const spam_limit    = config.SPAM.limit;          // الحد الأقصى للرسائل قبل التحذير / Max messages before warning
const spam_cooldown = config.SPAM.couldown * 1000; // فترة التهدئة بين الرسائل بالمللي ثانية / Cooldown period in milliseconds
const max_warnings  = config.SPAM.warning;       // الحد الأقصى للتحذيرات قبل الحظر / Max warnings before block

// **Spam detection module / موديل كشف الرسائل المزعجة**
const spamDetection = (() => {
    const senderLog = {};   // Temporary storage for sender timestamps / تخزين مؤقت لأوقات الرسائل لكل مرسل
    const warnings  = {};   // Storage for warning counts / تخزين عدد التحذيرات لكل مرسل

    return (sender) => {
        const now = Date.now(); // الوقت الحالي بالمللي ثانية / Current timestamp in milliseconds

        // Initialize sender data if not exists / تهيئة بيانات المرسل إذا لم تكن موجودة
        if (!senderLog[sender]) senderLog[sender] = [];
        if (!warnings[sender])  warnings[sender]  = 0;

        // Remove old entries based on cooldown / حذف الرسائل القديمة بعد فترة التهدئة
        senderLog[sender] = senderLog[sender].filter(timestamp => now - timestamp <= spam_cooldown);

        // Add current timestamp / إضافة الوقت الحالي لسجل المرسل
        senderLog[sender].push(now);

        // Detect spam / اكتشاف الرسائل المزعجة
        if (senderLog[sender].length > spam_limit) {
            warnings[sender] += 1;      // Add a warning / إضافة تحذير
            senderLog[sender] = [];      // Reset sender log / إعادة ضبط سجل المرسل

            // If sender exceeds max warnings / إذا تجاوز عدد التحذيرات الحد الأقصى
            if (warnings[sender] >= max_warnings) {
                return { status: "blocked", totalWarnings: warnings[sender] }; // Block sender / حظر المرسل
            }

            return { status: "warning", totalWarnings: warnings[sender] }; // Warning given / إعطاء تحذير
        }

        return { status: "safe", totalWarnings: warnings[sender] }; // No spam detected / لا توجد رسائل مزعجة
    };
})();

module.exports = spamDetection; // تصدير الموديول / Export the module