const { findGroup, updateGroup } = require("@lib/group"); 
// Find and update group data / للبحث وتحديث بيانات المجموعة
const { getGroupMetadata }  = require("@lib/cache"); 
// Get group metadata / للحصول على بيانات المجموعة
const { updateSocket }     = require('@lib/scheduled'); 
// Function to update scheduled tasks / لتحديث المهام المجدولة
const mess                  = require('@mess'); 
// Template messages / قوالب الرسائل

const icon_on  = '🟩'; // Active / مفعّل
const icon_off = '🟥'; // Inactive / غير مفعّل

// Format feature status / لتنسيق حالة الميزات
const formatFeatureStatus = (status) => status ? icon_on : icon_off;

// Feature list / قائمة الميزات
const featureList = [
    { name: 'antilink', label: 'ᴀɴᴛɪʟɪɴᴋ' },
    { name: 'autorusuh', label: 'ᴀᴜᴛᴏʀᴜsᴜʜ' },
    { name: 'waktusholat', label: 'ᴡᴀᴋᴛᴜꜱʜᴏʟᴀᴛ' },
    // ... كل الميزات الأخرى
];

// Create a template with status / إنشاء قالب يعرض حالة الميزات
const createTemplate = (fitur) => {
    let template = `ɢᴜɴᴀᴋᴀɴ *.off ᴄᴏᴍᴍᴀɴᴅ*\n\n`;
    featureList.forEach(({ name, label }) => {
        template += `[${formatFeatureStatus(fitur[name])}] ${label}\n`;
    });
    template += `
ᴄᴏɴᴛᴏʜ : *.ᴏff antilink*
Kᴇᴛᴇʀᴀɴɢᴀɴ
${icon_on} = Fɪᴛᴜʀ ᴀᴋᴛɪꜰ
${icon_off} = Fɪᴛᴜʀ ᴛɪᴅᴀᴋ ᴀᴋᴛɪꜰ`;
    return template;
};

// Function to deactivate a feature / دالة لإيقاف ميزة
const activateFeature = async (remoteJid, featureName, currentStatus) => {
    if (!currentStatus) {
        return `⚠️ _Fitur *${featureName}* sudah Nonaktifkan sebelumnya._`;
    }
    const updateData = { fitur: { [featureName]: false } };
    await updateGroup(remoteJid, updateData);
    return `🚀 _Berhasil Menonaktifkan Fitur *${featureName}*._`;
};

// Main handler / المعالج الرئيسي
async function handle(sock, messageInfo) {
    const { remoteJid, isGroup, message, content, sender } = messageInfo;
    if (!isGroup) return; // Only for groups / للمجموعات فقط

    try {
        // Get metadata / الحصول على بيانات المجموعة
        const groupMetadata = await getGroupMetadata(sock, remoteJid);
        const participants  = groupMetadata.participants;
        const isAdmin       = participants.some(p => p.id === sender && p.admin);
        if(!isAdmin) {
            await sock.sendMessage(remoteJid, { text: mess.general.isAdmin }, { quoted: message });
            return;
        }

        const dataGrub = await findGroup(remoteJid);
        if (!dataGrub) throw new Error("Group data not found / بيانات المجموعة غير موجودة");

        // Find matching feature / البحث عن الميزة المطابقة
        const feature = featureList.find(f => content.toLowerCase() === f.name.toLowerCase());
        
        if (feature) {
            const currentStatus = dataGrub.fitur[feature.name] || false;
            const result = await activateFeature(remoteJid, feature.name, currentStatus);

            if(content.toLowerCase() == 'waktusholat') updateSocket(sock); // Update scheduled task / تحديث مهمة مجدولة

            return await sock.sendMessage(remoteJid, { text: result }, { quoted: message });
        }

        // If no matching feature, send status template / إذا لم يوجد تطابق أرسل قالب الحالة
        const template_onchat = createTemplate(dataGrub.fitur);
        await sock.sendMessage(remoteJid, { text: template_onchat }, { quoted: message });

    } catch (error) {
        console.error("Error handling the message:", error);
        await sock.sendMessage(remoteJid, { text: 'Terjadi kesalahan saat memproses perintah. / حدث خطأ أثناء معالجة الأمر' }, { quoted: message });
    }
}

module.exports = {
    handle,
    Commands    : ['off'],
    OnlyPremium : false,
    OnlyOwner   : false
};