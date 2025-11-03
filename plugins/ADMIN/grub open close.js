const mess = require('@mess'); 
// Template messages / قوالب الرسائل
const { getGroupMetadata } = require("@lib/cache"); 
// Function to get group metadata / دالة لجلب بيانات المجموعة

async function handle(sock, messageInfo) {
    const { remoteJid, message, sender, isGroup, content, prefix, command } = messageInfo;
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

        // Validate input content / التحقق من محتوى الرسالة
        if (!content.trim() || content.trim() == '') {
            return sock.sendMessage(
                remoteJid,
                { text:  `_⚠️ Usage Format:_ \n\n_💬 Example:_ _*${prefix + command} open*_ \n_⚠️ صيغة الاستخدام:_ \n_💬 مثال:_ _*${prefix + command} open*_`.trim() },
                { quoted: message }
            );
        }

        // Extract action (open or close) / استخراج الأمر (فتح أو غلق)
        const [action] = content.split(' ');

        // Validate action / التحقق من صحة الأمر
        if (!['open', 'close'].includes(action)) {
            return sock.sendMessage(
                remoteJid,
                { text: `⚠️ Invalid format!\n_Type:_\n_${command} open_\n_${command} close_\n⚠️ صيغة غير صحيحة!\n_اكتب:_\n_${command} open_\n_${command} close_`.trim() },
                { quoted: message }
            );
        }

        // Determine response message / تحديد رسالة الرد
        const responseText = `${action === 'open' ? mess.action.grub_open : mess.action.grub_close}`;

        // Update group setting / تحديث إعدادات المجموعة
        await sock.groupSettingUpdate(remoteJid, action === 'open' ? 'not_announcement' : 'announcement');
    
        // Send confirmation message / إرسال رسالة تأكيد
        return sock.sendMessage(remoteJid, { text: responseText }, { quoted: message });

    } catch (error) {
        console.error(error);
        // Send error message / إرسال رسالة خطأ
        return sock.sendMessage(
            remoteJid,
            { text: '⚠️ An error occurred. Make sure the bot has admin rights to manage the group.\n⚠️ حدث خطأ. تأكد من أن البوت لديه صلاحيات المشرف لإدارة المجموعة.' },
            { quoted: message }
        );
    }
}

module.exports = {
    handle,
    Commands    : ['grub', 'group', 'grup', 'groub','gc'], // Command aliases / أسماء أوامر متعددة
    OnlyPremium : false,  // Available to all users / متاح لجميع المستخدمين
    OnlyOwner   : false,  // Not restricted to owner / ليس مقتصرًا على المالك
};