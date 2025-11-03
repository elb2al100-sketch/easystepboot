const { resetGroupData } = require('@lib/utils'); // Function to reset group data / دالة لإعادة ضبط بيانات المجموعة
const { getGroupMetadata } = require("@lib/cache"); // Get group metadata / الحصول على بيانات المجموعة
const { deleteCache } = require('@lib/globalCache'); // Manage cache / إدارة الذاكرة المؤقتة
const mess = require('@mess'); // Predefined messages / رسائل جاهزة

async function handle(sock, messageInfo) {
    const { remoteJid, message, sender, content, prefix, command } = messageInfo;

    try {
        // Get group metadata / الحصول على بيانات المجموعة
        const groupMetadata = await getGroupMetadata(sock, remoteJid);
        const participants  = groupMetadata.participants;

        // Check if sender is admin / التحقق من أن المرسل مشرف
        const isAdmin = participants.some(
            participant => participant.id === sender && participant.admin
        );
        if(!isAdmin) {
            await sock.sendMessage(
                remoteJid, 
                { text: mess.general.isAdmin }, // ⚠️ Only admin can use this command / ⚠️ فقط المشرف يمكنه استخدام هذا الأمر
                { quoted: message }
            );
            return;
        }

        // If the command is empty or only spaces / إذا كان الأمر فارغاً أو يحتوي على مسافات فقط
        if (!content.trim()) {
            await sock.sendMessage(
                remoteJid,
                {
                    text: `⚠️ _This command will delete all lists in this group / هذا الأمر سيحذف جميع القوائم في هذه المجموعة_\n\nPlease type *${prefix + command} -y* to proceed / الرجاء كتابة *${prefix + command} -y* للمتابعة.`,
                },
                { quoted: message }
            );
            return;
        }

        // If user confirms with -y / إذا أكد المستخدم بـ -y
        if (content.trim() === "-y") {
            await resetGroupData(remoteJid); // Reset all group lists / إعادة ضبط جميع القوائم في المجموعة
            deleteCache(`list-group`); // Reset cache / إعادة ضبط الكاش
            await sock.sendMessage(
                remoteJid, 
                { text: '_All lists in this group have been successfully reset / تم إعادة ضبط جميع القوائم في هذه المجموعة بنجاح_' }, 
                { quoted: message }
            );
        }

    } catch (error) {
        console.error('Error processing command / خطأ عند معالجة الأمر:', error);
        await sock.sendMessage(
            remoteJid, 
            { text: '_❌ Sorry, an error occurred while processing the data / عذراً، حدث خطأ أثناء معالجة البيانات._' }, 
            { quoted: message }
        );
    }
}

module.exports = {
    handle,
    Commands    : ['resetlist'], // Command name / اسم الأمر
    OnlyPremium : false,          // Available to all users / متاح لجميع المستخدمين
    OnlyOwner   : false,          // Not limited to owner / لا يقتصر على المالك
};