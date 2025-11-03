const mess  = require('@mess');
const { getGroupMetadata } = require("@lib/cache");

// FITUR: Enable/disable the feature
// FITUR: تمكين / تعطيل الخاصية
const FITUR = true; 
// Set to true if you want to force enable the feature
// اجعله true إذا كنت تريد تفعيل الميزة بالقوة

async function handle(sock, messageInfo) {
    const { remoteJid, isGroup, message, sender, content, prefix, command } = messageInfo;

    if(!FITUR) {
        await sock.sendMessage(remoteJid, 
            {
                text: `_⚠️ This feature is currently disabled due to the risk of ban_\n_⚠️ هذه الخاصية معطلة حالياً بسبب خطر الحظر_`,
            },
            { quoted: message }
        );
        return;
    }

    if (!isGroup) { 
        // Group only
        // للمجموعات فقط
        await sock.sendMessage(remoteJid, { text: mess.general.isGroup }, { quoted: message }); 
        return;
    }

    // Get group metadata
    // الحصول على بيانات المجموعة
    const groupMetadata = await getGroupMetadata(sock, remoteJid);
    const participants  = groupMetadata.participants;
    const isAdmin       = participants.some(participant => participant.id === sender && participant.admin);
    if(!isAdmin) {
        await sock.sendMessage(remoteJid, { text: mess.general.isAdmin }, { quoted: message });
        return;
    }

    // Validate phone number input
    // التحقق من صحة رقم الهاتف المدخل
    const nomor = content.replace(/[^0-9]/g, ""); 
    const whatsappJid = `${nomor}@s.whatsapp.net`;

    // Validate phone number format (min 10 digits, max 15 digits)
    // التحقق من تنسيق الرقم (الحد الأدنى 10 أرقام، الحد الأقصى 15 رقم)
    if (!/^\d{10,15}$/.test(nomor)) {
        await sock.sendMessage(remoteJid, 
            {
                text: `_⚠️ Usage Format:_ \n\n_💬 Example:_ _*${prefix + command} 6285246154386*_\n_⚠️ صيغة الاستخدام:_ \n\n_💬 مثال:_ _*${prefix + command} 6285246154386*_`,
            },
            { quoted: message }
        );
        return;
    }

    try {
        // Add user to group
        // إضافة المستخدم إلى المجموعة
        const response = await sock.groupParticipantsUpdate(remoteJid, [whatsappJid], "add");
        const status = response[0]?.status;

        if (status == 409) {
            // If the number is already in the group
            // إذا كان الرقم موجوداً بالفعل في المجموعة
            await sock.sendMessage(
                remoteJid,
                { text: `⚠️ _Number *${nomor}* is already in the group._\n⚠️ _الرقم *${nomor}* موجود بالفعل في المجموعة._` },
                { quoted: message }
            );
        } else if (status == 403) {
            // If privacy settings prevent adding
            // إذا منعت إعدادات الخصوصية إضافة الرقم
            await sock.sendMessage(
                remoteJid,
                { text: `❌ _Cannot add number *${nomor}* due to user privacy settings._\n❌ _لا يمكن إضافة الرقم *${nomor}* بسبب إعدادات الخصوصية للمستخدم._` },
                { quoted: message }
            );
        } else {
            // Successfully added
            // تم إضافة الرقم بنجاح
            await sock.sendMessage(
                remoteJid,
                { text: `✅ _Successfully added member *${nomor}* to the group._\n✅ _تمت إضافة العضو *${nomor}* إلى المجموعة بنجاح._` },
                { quoted: message }
            );
        }
    } catch (error) {
        // Unexpected error
        // حدث خطأ غير متوقع
        await sock.sendMessage(
            remoteJid,
            {
                text: `❌ _Cannot add number_ *${nomor}* _to the group._\n❌ _لا يمكن إضافة الرقم_ *${nomor}* _إلى المجموعة._`,
            },
            { quoted: message }
        );
    }
}

module.exports = {
    handle,
    Commands    : ['add'],
    OnlyPremium : false,
    OnlyOwner   : false
};