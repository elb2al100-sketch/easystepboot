const { findGroup, updateGroup } = require("@lib/group"); 
// Functions to find and update group data / دوال للبحث وتحديث بيانات المجموعة
const mess = require("@mess"); 
// Template messages / قوالب الرسائل
const { getGroupMetadata } = require("@lib/cache"); 
// Function to get group metadata / دالة للحصول على بيانات المجموعة

async function handle(sock, messageInfo) {
    const { remoteJid, isGroup, message, sender, command } = messageInfo;
    if (!isGroup) return; // Only for groups / مخصص للمجموعات فقط

    try {
        // Get group metadata / الحصول على بيانات المجموعة
        const groupMetadata = await getGroupMetadata(sock, remoteJid);
        const participants  = groupMetadata.participants;

        // Check if sender is admin / التحقق من أن المرسل مشرف
        const isAdmin = participants.some(participant => participant.id === sender && participant.admin);
        if(!isAdmin) {
            await sock.sendMessage(remoteJid, { text: mess.general.isAdmin }, { quoted: message });
            return;
        }

        // Find group data in database / البحث عن بيانات المجموعة في قاعدة البيانات
        const dataGroup = await findGroup(remoteJid);
        if (!dataGroup) {
            throw new Error("Data grup tidak ditemukan. / بيانات المجموعة غير موجودة");
        }

        // Determine response and data update based on command / تحديد الرد وتحديث البيانات بناءً على الأمر
        let responseText = "";
        let updateData = false;

        if (command === "mute") {
            updateData = { fitur: { ['mute']: true } }; // Enable mute / تفعيل الكتم
            responseText = mess.action.mute; // Message template / رسالة القالب
        } else if (command === "unmute") {
            updateData = { fitur: { ['mute']: false } }; // Disable mute / إلغاء الكتم
            responseText = mess.action.unmute;
        } else {
            responseText = "_Perintah tidak dikenali._ / الأمر غير معروف";
        }

        // Update group data if needed / تحديث بيانات المجموعة إذا كان الأمر صحيح
        if (updateData) {
            await updateGroup(remoteJid, updateData);
        }

        // Send confirmation message / إرسال رسالة تأكيد
        await sock.sendMessage(remoteJid, { text: responseText }, { quoted: message });
    } catch (error) {
        // Handle errors / التعامل مع الأخطاء
        console.error(error.message);
        await sock.sendMessage(
            remoteJid,
            { text: "Terjadi kesalahan saat memproses perintah. Silakan coba lagi. / حدث خطأ أثناء معالجة الأمر، يرجى المحاولة مرة أخرى" },
            { quoted: message }
        );
    }
}

module.exports = {
    handle,
    Commands    : ["mute", "unmute"], // Command names / أسماء الأوامر
    OnlyPremium : false,               // Not limited to premium users / ليس مقتصرًا على المميزين
    OnlyOwner   : false,               // Not limited to owner / ليس مقتصرًا على المالك
};