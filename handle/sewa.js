// Feature toggle: if true, only rented groups will respond / مفتاح تفعيل: إذا كانت true، سيتم الرد فقط على المجموعات المؤجرة
const ONLY_GC_SEWA = false;

// Import required libraries / استيراد المكتبات المطلوبة
const { findSewa, deleteSewa }  = require("@lib/sewa"); // Find and delete rental data / البحث وحذف بيانات الإيجار
const config = require("@config"); // Configuration / الإعدادات
const { selisihHari, danger, logTracking } = require("@lib/utils"); // Utility functions / دوال مساعدة
const { logCustom } = require("@lib/logger"); // Custom logging / تسجيل مخصص
const { getGroupMetadata } = require("@lib/cache"); // Get group metadata / الحصول على بيانات المجموعة
const mess = require('@mess'); // Message templates / قوالب الرسائل

const notificationDays = 3; // Number of days before sending notification / عدد الأيام قبل إرسال الإشعار
const notifiedGroups = new Set(); // Cache for groups that already received notifications / مجموعة لتخزين المجموعات التي تم إشعارها
const nonSewaGroups = new Set(); // Cache for non-rental groups / مجموعة لتخزين المجموعات غير المؤجرة

// Function to leave a group with retry attempts / دالة للخروج من المجموعة مع إعادة المحاولة
async function leaveGroupWithRetry(sock, remoteJid, maxRetries = 3) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            logTracking(`Sewa Handler - leaving group ${remoteJid}`);
            await sock.groupLeave(remoteJid); // Leave group / الخروج من المجموعة
            console.log(`Successfully left the group on attempt ${attempt}`);
            break; // Exit loop if successful / الخروج من الحلقة إذا نجحت
        } catch (err) {
            console.error(`Failed to leave group (attempt ${attempt}):`, err);
            if (attempt === maxRetries) {
                console.error(`Failed after ${maxRetries} attempts.`);
            } else {
                await new Promise(resolve => setTimeout(resolve, 1000)); 
                // Wait 1 second before retry / الانتظار ثانية واحدة قبل المحاولة مرة أخرى
            }
        }
    }
}

// Main process function for rental handling / الدالة الرئيسية لمعالجة الإيجار
async function process(sock, messageInfo) {
    const { remoteJid, isGroup, message } = messageInfo;

    if (!isGroup) {
        return true; // Skip if not a group / تخطي إذا لم تكن رسالة من مجموعة
    }

    const dataSewa = await findSewa(remoteJid); // Find rental data / البحث عن بيانات الإيجار

    if (dataSewa) {
        const now = Date.now(); // Current timestamp in milliseconds / الطابع الزمني الحالي بالميلي ثانية
        const notificationMs = notificationDays * 24 * 60 * 60 * 1000; // Notification in milliseconds / وقت الإشعار بالميلي ثانية
        const timeRemaining = dataSewa.expired - now; // Remaining time in milliseconds / الوقت المتبقي بالميلي ثانية

        const selisihHariSewa = selisihHari(dataSewa.expired); // Difference in days / الفرق بالأيام

        const groupMetadata = await getGroupMetadata(sock, remoteJid);
        const participants = groupMetadata.participants; // Group participants / أعضاء المجموعة

        if (timeRemaining <= notificationMs && timeRemaining > 0) {
            // If within notification period / إذا كانت المدة ضمن فترة الإشعار
            if (!notifiedGroups.has(remoteJid)) {
                if (mess.handler.sewa_notif) {
                    let warningMessage = mess.handler.sewa_notif
                        .replace('@date', selisihHariSewa); 
                    logTracking(`Sewa Handler - Send rental notification to ${remoteJid}`);
                    await sock.sendMessage(
                        remoteJid, 
                        { text: warningMessage, mentions: participants.map(p => p.id) }, 
                        { quoted: message }
                    );
                }
                notifiedGroups.add(remoteJid); // Mark group as notified / وضع علامة على المجموعة بأنها تم إشعارها
                return false;
            }
        } else if (timeRemaining <= 0) {
            // If rental has expired / إذا انتهت مدة الإيجار
            if (mess.handler.sewa_out) {
                let warningMessage = mess.handler.sewa_out
                    .replace('@ownernumber', config.owner_number[0]);
                logTracking(`Sewa Handler - Send rental expired notification to ${remoteJid}`);
                await sock.sendMessage(
                    remoteJid, 
                    { text: warningMessage, mentions: participants.map(p => p.id) }, 
                    { quoted: message }
                );
            }

            // Delete rental data / حذف بيانات الإيجار
            await deleteSewa(remoteJid);

            try {
                await leaveGroupWithRetry(sock, remoteJid);
                danger('Rental Expired', `Successfully left group: ${remoteJid}`);
            } catch (error) {
                console.error(`Failed to leave group ${remoteJid}:`, error);
                danger('Rental Expired', `Failed to leave group: ${remoteJid}`);
                logCustom('info', 'Failed to leave group', `failed-leave-group-sewa-${remoteJid}.txt`);
            }
            return false;
        }
    } else {
        // Log non-rental groups only once / تسجيل المجموعات غير المؤجرة مرة واحدة فقط
        if (!nonSewaGroups.has(remoteJid)) {
            logCustom('info', 'THIS GROUP IS NOT A RENTAL BOT', `non-sewa-${remoteJid}.txt`);
            nonSewaGroups.add(remoteJid); // Mark group as non-rental / وضع علامة على المجموعة بأنها غير مؤجرة
        }
        if (ONLY_GC_SEWA) {
            return false; // Skip non-rental groups if ONLY_GC_SEWA is true / تخطي المجموعات غير المؤجرة إذا كانت ONLY_GC_SEWA true
        }
    }
}

// Export the plugin module / تصدير وحدة البرنامج المساعد
module.exports = {
    name: "Sewa Handle", // Plugin name / اسم البرنامج المساعد
    priority: 10, // Plugin priority / أولوية البرنامج المساعد
    process, // Process function / دالة المعالجة
};