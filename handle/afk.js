// Import required libraries / استيراد المكتبات المطلوبة
const { findUser, updateUser } = require("@lib/users");
const { formatDuration, logTracking } = require("@lib/utils"); // Functions to calculate duration / دوال لحساب مدة الوقت
const { logCustom } = require("@lib/logger"); // Custom logging function / دالة لتسجيل الأحداث مخصص
const mess = require('@mess'); // Message templates / قوالب الرسائل

// Main AFK processing function / الدالة الرئيسية لمعالجة حالة AFK
async function process(sock, messageInfo) {
    const { remoteJid, message, sender, pushName, mentionedJid } = messageInfo;

    try {
        // Function to build an AFK message / دالة لبناء رسالة AFK
        const buildAfkMessage = (name, afkData) => {
            const durasiAfk = formatDuration(afkData.lastChat); // Duration of AFK / مدة الغياب
            const alasanTeks = afkData.alasan ? `\n\n📌 ${afkData.alasan}` : "\n\n📌 Tanpa Alasan"; // Reason text / نص السبب

            if (mess.handler.afk) {
                let warningMessage = mess.handler.afk
                    .replace('@sender', name) // Replace @sender with name / استبدال @sender بالاسم
                    .replace('@durasi', durasiAfk) // Replace @durasi with AFK duration / استبدال @durasi بمدة الغياب
                    .replace('@alasan', alasanTeks); // Replace @alasan with reason / استبدال @alasan بالسبب
                return warningMessage;
            }
            return null;
        };

        // Check the current AFK status of the user / التحقق من حالة AFK الحالية للمستخدم
        let userAfk = await findUser(sender);
    
        if (userAfk?.status === "afk" && userAfk.afk) {
            // If AFK message template exists / إذا كان قالب رسالة AFK موجود
            if (mess.handler?.afk_message) {
                const afkMessage = mess.handler.afk_message
                    .replace('@sender', pushName) // Replace sender name / استبدال اسم المرسل
                    .replace('@durasi', formatDuration(userAfk.afk.lastChat)) // Replace duration / استبدال مدة الغياب
                    .replace('@alasan', userAfk.afk.alasan ? `\n\n📌 ${userAfk.afk.alasan}` : "\n\n📌 Tanpa Alasan"); // Replace reason / استبدال السبب

                if (afkMessage) {
                    logTracking(`Afk Handler - ${sender}`); // Log AFK handling / تسجيل معالجة AFK
                    await sock.sendMessage(remoteJid, { text: afkMessage }, { quoted: message }); // Send AFK message / إرسال رسالة AFK
                }
            }
        
            await updateUser(sender, { status: "aktif", afk: null }); // Update user status to active / تحديث حالة المستخدم إلى نشط
            return false; // Stop further processing / إيقاف المعالجة الإضافية
        }
        
        // Check mentioned users / التحقق من المستخدمين المذكورين
        if (mentionedJid?.length > 0) {
            const mentionedUsers = await Promise.all(
                mentionedJid.map(async (jid) => {
                    return await findUser(jid); // Get user data by JID / الحصول على بيانات المستخدم بواسطة JID
                })
            );

            for (const mentionedUser of mentionedUsers) {
                if (mentionedUser?.status === "afk" && mentionedUser.afk) {
                    const afkMessage = buildAfkMessage(mentionedUser.name || "Pengguna", mentionedUser.afk); // Build AFK message / بناء رسالة AFK
                    if (afkMessage) {
                        logTracking(`Afk Handler - ${sender}`); // Log tracking / تسجيل التتبع
                        await sock.sendMessage(remoteJid, { text: afkMessage }, { quoted: message }); // Send message / إرسال الرسالة
                    }
                    break; // Exit loop after sending first message / الخروج من الحلقة بعد إرسال الرسالة الأولى
                }
            }
        }

    } catch (error) {
        console.error("Error in AFK process:", error); // Print error / طباعة الخطأ
        logCustom('info', error, `ERROR-AFK-HANDLE.txt`); // Log error to file / تسجيل الخطأ في الملف
    }

    return true; // Continue to the next plugin / الاستمرار إلى البرنامج المساعد التالي
}

// Export the AFK plugin module / تصدير وحدة AFK للبرنامج المساعد
module.exports = {
    name: "Afk", // Plugin name / اسم البرنامج المساعد
    priority: 3, // Plugin priority / أولوية البرنامج المساعد
    process, // Process function / دالة المعالجة
};