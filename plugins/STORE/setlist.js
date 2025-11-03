const { setList, deleteMessage } = require("@lib/participants"); // Functions to set or reset list / دوال لتعيين أو إعادة ضبط قائمة
const { getGroupMetadata } = require("@lib/cache"); // Get group metadata / الحصول على بيانات المجموعة
const mess = require("@mess"); // Predefined messages / رسائل جاهزة

async function handle(sock, messageInfo) {
    const { remoteJid, isGroup, message, content, sender, command, prefix } = messageInfo;

    // Check if message is from a group / التحقق إذا كانت الرسالة من مجموعة
    if (!isGroup) return;

    // Get group metadata / الحصول على بيانات المجموعة
    const groupMetadata = await getGroupMetadata(sock, remoteJid);
    const participants = groupMetadata.participants;

    // Check if sender is admin / التحقق من أن المرسل مشرف
    const isAdmin = participants.some(
        participant => participant.id === sender && participant.admin
    );
    if (!isAdmin) {
        await sock.sendMessage(remoteJid, { text: mess.general.isAdmin }, { quoted: message }); 
        // ⚠️ Only admin can use this command / ⚠️ فقط المشرف يمكنه استخدام هذا الأمر
        return;
    }

    // Validate input content / التحقق من محتوى الرسالة
    if (!content || !content.trim()) {
        const usageMessage = `⚠️ *Usage Format / صيغة الاستخدام:*

💬 *Example / مثال:* 
_${prefix}${command} LIST STORE_

_Here is the list template / فيما يلي قالب القائمة_
⌬ @x

════════════
_Parameters that can be used / المعاملات التي يمكن استخدامها_

☍ @x${global.group.variable}
`;

        await sock.sendMessage(remoteJid, { text: usageMessage }, { quoted: message });
        return;
    }

    // Set list template / تعيين قالب القائمة
    await setList(remoteJid, content);

    // Reset list if user types 'reset' / إعادة ضبط القائمة إذا كتب المستخدم "reset"
    if(content.toLowerCase() === 'reset') {
        await deleteMessage(remoteJid, 'setlist');
        await sock.sendMessage(remoteJid, { text: '_✅ Setlist has been successfully reset / تم إعادة ضبط Setlist بنجاح_' }, { quoted: message });
        return;
    }

    // Send success message / إرسال رسالة نجاح
    const successMessage = `✅ _Setlist has been successfully configured / تم إعداد Setlist بنجاح_

_Type *.list* to view the list / اكتب *.list* لعرض القائمة_ 
_or type .setlist reset to revert to default / أو اكتب .setlist reset للعودة إلى الإعداد الافتراضي_`;

    await sock.sendMessage(remoteJid, { text: successMessage }, { quoted: message });
}

module.exports = {
    handle,
    Commands: ["setlist"],
    OnlyPremium: false,
    OnlyOwner: false,
};