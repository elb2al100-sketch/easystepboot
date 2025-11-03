// SETLEFT: Set the "Left" message when someone leaves the group
// تعيين_الرسالة_لـ "Left": تعيين الرسالة التي تُرسل عند خروج أحد الأعضاء من المجموعة

const { setLeft } = require("@lib/participants");
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
        const MSG = `_⚠️ Format Penggunaan:_ \n\n_💬 Contoh:_ _*${prefix + command} Selamat tinggal beban grub @name*_\n\n_*List Variable*_\n\n${global.group.variable}`;
        return await sock.sendMessage(
            remoteJid,
            { text: MSG },
            { quoted: message }
        );
    }

    // Set the "Left" message using the provided content
    // تعيين رسالة "Left" باستخدام النص المرسل
    await setLeft(remoteJid, content);

    // Send success message
    // إرسال رسالة نجاح
    return await sock.sendMessage(
        remoteJid,
        {
            text: `✅ _Left Berhasil di set_\n\n_Pastikan fitur sudah di aktifkan dengan mengetik *.on left*_`
            // ✅ تم تعيين رسالة Left بنجاح
            // تأكد من تفعيل الميزة عن طريق كتابة *.on left*
        },
        { quoted: message }
    );
}

module.exports = {
    handle,
    Commands    : ["setleft"],
    OnlyPremium : false,
    OnlyOwner   : false,
};