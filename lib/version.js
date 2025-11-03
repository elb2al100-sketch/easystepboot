// Do not change this if you want to receive updates
// لا تقم بتغييره إذا كنت تريد استقبال التحديثات
global.version = "4.2.6";

// Import function to update version strings / استيراد الدالة لتحديث نصوص الإصدار
const { updateVersionInStrings } = require("@lib/utils");

// Call the function to update version references / استدعاء الدالة لتحديث مراجع الإصدار
updateVersionInStrings();