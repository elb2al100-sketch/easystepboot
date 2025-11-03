// Set to track already responded notifications / مجموعة لتتبع الإشعارات التي تم الرد عليها
const respondedSenders = new Set();

// Import required libraries / استيراد المكتبات المطلوبة
const { getGreeting } = require('@lib/utils'); // Function to get greeting / دالة للحصول على التحية
const { isOwner } = require("@lib/users"); // Function to check if user is owner / دالة للتحقق مما إذا كان المستخدم مالك
const axios = require('axios'); // HTTP request library / مكتبة لإرسال طلبات HTTP

const version = global.version; // Current bot version / نسخة البوت الحالية
const serverUrl = `https://api.autoresbot.com/api/updates/resbot?version=${version}`; 
// Server API URL to check updates / رابط API لفحص التحديثات

// Function to check for updates from server / دالة للتحقق من التحديثات من الخادم
async function checkUpdate() {
    try {
        const response = await axios.get(serverUrl);
        const data = response.data;
        return data;
    } catch (error) {
        return null; // Return null if API fails / إرجاع null إذا فشل API
    }
}

// Main process function / الدالة الرئيسية لمعالجة الإشعار
async function process(sock, messageInfo) {
    const { remoteJid, sender, message, pushName, fullText } = messageInfo;

    const salam = getGreeting(); // Get greeting / الحصول على التحية
    if (pushName == 'Unknown') return true; // Skip if sender name unknown / تخطي إذا كان اسم المرسل مجهول
    if (!fullText) return true; // Skip if no text / تخطي إذا لم يكن هناك نص

    if (respondedSenders.has('notif_update')) return; // Skip if already responded / تخطي إذا تم الرد مسبقًا

    const isOwnerUsers = await isOwner(sender); // Check if sender is owner / التحقق إذا كان المرسل مالك
    if (!isOwnerUsers) return;

    const result = await checkUpdate(); // Check update from server / التحقق من التحديث من الخادم

    if (!result) { // If API fails / إذا فشل API
        respondedSenders.add('notif_update');
        return true;
    }

    if (result.code == 200 && result.message == 'Anda sudah menggunakan versi terbaru.') {
        // Already using latest version / استخدام النسخة الأحدث بالفعل
        respondedSenders.add('notif_update');
        return true;
    }

    // Response message if update available / رسالة الرد عند وجود تحديث
    const response = `👋 _${salam}_ Owner! \n\n✨ Versi terbaru script sudah tersedia! ✨\nKetik *.update -y* untuk langsung memperbaruinya 🚀

atau ketik *.updateforce* untuk memperbarui semua yang tersedia`;

    try {
        // Send update notification to owner / إرسال إشعار التحديث للمالك
        await sock.sendMessage(remoteJid, { text: response }, { quoted: message });

        // Mark as responded / وضع علامة بأنه تم الرد
        respondedSenders.add('notif_update');
        return false;
    } catch (error) {
        console.error("Error in update notification process:", error); // Log error / تسجيل الخطأ
    }

    return true; // Continue to next plugin / متابعة إلى الإضافة التالية
}

// Export plugin module / تصدير وحدة البرنامج المساعد
module.exports = {
    name: "Notifikasi Update", // Plugin name / اسم البرنامج المساعد
    priority: 7, // Plugin priority / أولوية البرنامج المساعد
    process, // Process function / دالة المعالجة
};