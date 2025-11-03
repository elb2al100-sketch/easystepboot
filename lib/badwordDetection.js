const config = require("@config");
const max_warnings = config.BADWORD.warning; // Maximum warnings before block / الحد الأقصى للتحذيرات قبل الحظر

// Badword detection module / وحدة كشف الكلمات السيئة
const badwordDetection = (() => {
    const senderLog = {}; // Temporary storage for sender data / تخزين مؤقت لبيانات المرسل
    const warnings = {}; // Storage for warnings per sender / تخزين عدد التحذيرات لكل مرسل

    return (sender) => {
        if (!senderLog[sender]) {
            senderLog[sender] = [];
        }

        if (!warnings[sender]) {
            warnings[sender] = 0;
        }

        // If sender exceeds maximum warnings / إذا تجاوز المرسل الحد الأقصى للتحذيرات
        if (warnings[sender] >= max_warnings) {
            return { status: "blocked", totalWarnings: warnings[sender] }; 
            // Sender is blocked / تم حظر المرسل
        }

        // Add a warning for the sender / إضافة تحذير للمرسل
        warnings[sender]++;
        return { status: "warning", totalWarnings: warnings[sender] }; 
        // Warning given / تم إعطاء تحذير
    };
})();

module.exports = badwordDetection;