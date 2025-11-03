// SETDEMOTE: Set the list of users to demote
// تعيين_القائمة_لتخفيض_المشرفين: تعيين قائمة المستخدمين ليتم تخفيضهم من المشرفين

const { setDemote } = require("@lib/participants");
const { getGroupMetadata } = require("@lib/cache");
const mess = require("@mess");

async function handle(sock, messageInfo) {
    const { remoteJid, isGroup, message, content, sender, command, prefix } = messageInfo;

    if (!isGroup) return; // Only for groups
    // الرسائل من المجموعات فقط

    // Get group metadata
    // الحصول على بيانات المجموعة
    const groupMetadata = await getGroupMetadata(sock, remoteJid);
    const participants  = groupMetadata.participants;

    // Check if sender is admin
    // التحقق إذا كان المرسل مشرف
    const isAdmin = participants.some(participant => participant.id === sender && participant.admin);
    if(!isAdmin) {
        await sock.sendMessage(remoteJid, { text: mess.general.isAdmin }, { quoted: message });
        return;
    }

    // Validate if content is empty
    // التحقق إذا كان النص المرسل فارغ
    if (!content || !content.trim()) {
        const MSG = `_⚠️ Format Penggunaan:_ \n\n_💬 Contoh:_ _*${prefix + command} @name telah di turunkan dari admin*_\n\n_*List Variable*_\n\n${global.group.variable}`;
        return await sock.sendMessage(
            remoteJid,
            { text: MSG },
            { quoted: message }
        );
    }

    // Set demote list using the content provided
    // تعيين قائمة التخفيض باستخدام المحتوى المرسل
    await setDemote(remoteJid, content.trim());

    // Send success message
    // إرسال رسالة نجاح
    return await sock.sendMessage(
        remoteJid,
        {
            text: `✅ _Demote Berhasil di set_\n\n_Pastikan fitur sudah di aktifkan dengan mengetik *.on demote*_`
            // ✅ تم تعيين التخفيض بنجاح
            // تأكد من تفعيل الميزة عن طريق كتابة *.on demote* 
        },
        { quoted: message }
    );
}

module.exports = {
    handle,
    Commands    : ["setdemote"],
    OnlyPremium : false,
    OnlyOwner   : false,
};