// Import required modules / استيراد المكتبات المطلوبة
const fs = require('fs');
const path = require('path');
const { determineUser, deleteFolderRecursive } = require('@lib/utils');
const { sessions } = require('@lib/cache');

// Main handler function / الدالة الرئيسية لمعالجة الأمر
async function handle(sock, messageInfo) {
    const { remoteJid, message, content, sender, mentionedJid, isQuoted, prefix, command } = messageInfo;

    try {
        // Validate input content / التحقق من محتوى الرسالة / التحقق من صحة الإدخال
        if (!content) {
            await sock.sendMessage(remoteJid, {
                text: `_⚠️ Usage Format:_\n\n_💬 Example:_ _*${prefix + command} 201065537938*_`
                // _⚠️ تنسيق الاستخدام:_\n\n_💬 مثال:_ _*${prefix + command} 201065537938*_
            }, { quoted: message });
            return;
        }

        // Determine which user to act on / تحديد المستخدم المستهدف
        const userToAction = determineUser(mentionedJid, isQuoted, content);
        if (!userToAction) {
            return await sock.sendMessage(
                remoteJid,
                { text: `_⚠️ Usage Format:_ \n\n_💬 Example:_ _*${prefix + command} @NAME*_` },
                { quoted: message }
            );
        }

        // Extract only numbers from user input / استخراج الأرقام فقط من المحتوى
        let targetNumber = userToAction.replace(/\D/g, '');

        // Validate phone number length / التحقق من طول الرقم
        if (targetNumber.length < 10 || targetNumber.length > 15) {
            await sock.sendMessage(
                remoteJid,
                { text: `⚠️ Invalid number.` }
                // ⚠️ رقم غير صالح
                ,
                { quoted: message }
            );
            return;
        }

        // Append WhatsApp domain if missing / إضافة نطاق WhatsApp إذا لم يكن موجودًا
        if (!targetNumber.endsWith('@s.whatsapp.net')) {
            targetNumber += '@s.whatsapp.net';
        }

        // Send loading reaction / إرسال رمز الانتظار
        await sock.sendMessage(remoteJid, { react: { text: "🤌🏻", key: message.key } });

        // Ensure session folder exists / التأكد من وجود مجلد الجلسات
        const SESSION_PATH = './session/';
        const senderId = targetNumber.replace('@s.whatsapp.net', '');
        const sessionPath = path.join(SESSION_PATH, senderId);
        const sessionExists = fs.existsSync(sessionPath);

        // Delete active session if exists / حذف الجلسة النشطة إذا وجدت
        const sockSesi = sessions.get(`session/${senderId}`);
        if (sockSesi) {
            const { updateJadibot } = require('@lib/jadibot');
            await updateJadibot(senderId, 'stop');
            await sockSesi.ws.close(); // Close WebSocket / إغلاق WebSocket
            sessions.delete(`session/${senderId}`); // Remove from session list / حذف من قائمة الجلسات
        }

        if (sessionExists) {
            // Delete session folder / حذف مجلد الجلسة
            deleteFolderRecursive(sessionPath);
            await sock.sendMessage(
                remoteJid,
                { text: `✅ _Session folder for ${senderId} has been successfully deleted._` }
                // ✅ _تم حذف مجلد الجلسة للمستخدم ${senderId} بنجاح._
                ,
                { quoted: message }
            );
            const { deleteJadibot } = require('@lib/jadibot');
            await deleteJadibot(senderId);
        } else {
            await sock.sendMessage(
                remoteJid,
                { text: `⚠️ _Session folder for ${senderId} not found._` }
                // ⚠️ _مجلد الجلسة للمستخدم ${senderId} غير موجود._
                ,
                { quoted: message }
            );
        }

    } catch (error) {
        console.error('An error occurred:', error);
        // Error message / رسالة الخطأ
        await sock.sendMessage(
            remoteJid,
            { text: `⚠️ _An error occurred while processing the command._` }
            // ⚠️ _حدث خطأ أثناء معالجة الأمر._
            ,
            { quoted: message }
        );
    }
}

// Export module info / تصدير بيانات الموديول
module.exports = {
    handle,
    Commands    : ['deletejadibot','deljadibot'], // command names / أسماء الأوامر
    OnlyPremium : false, // only premium? / للمميزين فقط؟ لا
    OnlyOwner   : true   // only owner? / للمالك فقط؟ نعم
};