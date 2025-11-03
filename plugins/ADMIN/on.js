const { findGroup, updateGroup } = require("@lib/group");
const { getGroupMetadata } = require("@lib/cache");
const { updateSocket } = require('@lib/scheduled');
const mess = require('@mess');

// Icons to show feature status
// أيقونات لعرض حالة الميزات
const icon_on = '🟩';
const icon_off = '🟥';

// Function to format feature status
// دالة لتنسيق حالة الميزة (مفعل / غير مفعل)
const formatFeatureStatus = (status) => status ? icon_on : icon_off;

// List of all group features
// قائمة بكل الميزات المتاحة في المجموعة
const featureList = [
    { name: 'antilink', label: 'ᴀɴᴛɪʟɪɴᴋ' },
    { name: 'antilinkv2', label: 'ᴀɴᴛɪʟɪɴᴋᴠ2' },
    { name: 'antilinkwa', label: 'ᴀɴᴛɪʟɪɴᴋᴡᴀ' },
    { name: 'antilinkwav2', label: 'ᴀɴᴛɪʟɪɴᴋᴡᴀᴠ2' },
    { name: 'antilinkch', label: 'ᴀɴᴛɪʟɪɴᴋᴄʜ' },
    { name: 'antilinkchv2', label: 'ᴀɴᴛɪʟɪɴᴋᴄʜᴠ2' },
    { name: 'antidelete', label: 'ᴀɴᴛɪᴅᴇʟᴇᴛᴇ' },
    { name: 'antiedit', label: 'ᴀɴᴛɪᴇᴅɪᴛ' },
    { name: 'antigame', label: 'ᴀɴᴛɪɢᴀᴍᴇ' },
    { name: 'antifoto', label: 'ᴀɴᴛɪғᴏᴛᴏ' },
    { name: 'antivideo', label: 'ᴀɴᴛɪᴠɪᴅᴇᴏ' },
    { name: 'antiaudio', label: 'ᴀɴᴛɪᴀᴜᴅɪᴏ' },
    { name: 'antidocument', label: 'ᴀɴᴛɪᴅᴏᴄᴜᴍᴇɴᴛ' },
    { name: 'antikontak', label: 'ᴀɴᴛɪᴋᴏɴᴛᴀᴋ' },
    { name: 'antisticker', label: 'ᴀɴᴛɪsᴛɪᴄᴋᴇʀ' },
    { name: 'antipolling', label: 'ᴀɴᴛɪᴘᴏʟʟɪɴɢ' },
    { name: 'antispamchat', label: 'ᴀɴᴛɪsᴘᴀᴍᴄʜᴀᴛ' },
    { name: 'antivirtex', label: 'ᴀɴᴛɪᴠɪʀᴛᴇx' },
    { name: 'autoai', label: 'ᴀᴜᴛᴏᴀɪ', desc : '_To use this feature reply to the bot chat or say *ai* in every message_\n_لاستخدام هذه الميزة، قم بالرد على رسالة البوت أو اذكر *ai*_'},
    { name: 'autosimi', label: 'ᴀᴜᴛᴏsɪᴍɪ', desc : '_To use this feature reply to the bot chat or say *simi* in every message_\n_لاستخدام هذه الميزة، قم بالرد على رسالة البوت أو اذكر *simi*_'},
    { name: 'autorusuh', label: 'ᴀᴜᴛᴏʀᴜsᴜʜ' },
    { name: 'badword', label: 'ʙᴀᴅᴡᴏʀᴅ' },
    { name: 'badwordv2', label: 'ʙᴀᴅᴡᴏʀᴅv2' },
    { name: 'badwordv3', label: 'ʙᴀᴅᴡᴏʀᴅv3' },
    { name: 'detectblacklist', label: 'ᴅᴇᴛᴇᴄᴛʙʟᴀᴄᴋʟɪꜱᴛ' },
    { name: 'detectblacklist2', label: 'ᴅᴇᴛᴇᴄᴛʙʟᴀᴄᴋʟɪꜱᴛ2' },
    { name: 'demote', label: 'demote' },
    { name: 'left', label: 'ʟᴇғᴛ' },
    { name: 'promote', label: 'promote' },
    { name: 'welcome', label: 'ᴡᴇʟᴄᴏᴍᴇ' },
    { name: 'waktusholat', label: 'ᴡᴀᴋᴛᴜꜱʜᴏʟᴀᴛ' },
    { name: 'onlyadmin', label: 'ᴏɴʟʏᴀᴅᴍɪɴ' },
    { name: 'antibot', label: 'ᴀɴᴛɪʙᴏᴛ' },
    { name: 'antitagsw', label: 'ᴀɴᴛɪᴛᴀɢꜱᴡ' },
    { name: 'antitagsw2', label: 'ᴀɴᴛɪᴛᴀɢꜱᴡ2' },
    { name: 'antitagmeta', label: 'ᴀɴᴛɪᴛᴀɢᴍᴇᴛᴀ' },
    { name: 'antitagmeta2', label: 'ᴀɴᴛɪᴛᴀɢᴍᴇᴛᴀ2' },
    { name: 'antiforward', label: 'ᴀɴᴛɪꜰᴏʀᴡᴀʀᴅ' },
    { name: 'antiforward2', label: 'ᴀɴᴛɪꜰᴏʀᴡᴀʀᴅ2' },
    { name: 'antihidetag', label: 'ᴀɴᴛɪʜɪᴅᴇᴛᴀɢ' },
    { name: 'antihidetag2', label: 'ᴀɴᴛɪʜɪᴅᴇᴛᴀɢ2' }
];

// Function to create a template showing the status of each feature
// دالة لإنشاء رسالة تعرض حالة كل ميزة
const createTemplate = (fitur) => {
    let template = `USE *.on COMMAND*\n\n`;

    featureList.forEach(({ name, label }) => {
        template += `[${formatFeatureStatus(fitur[name])}] ${label}\n`;
    });

    template += `

EXAMPLE: *.on antilink*

LEGEND:
${icon_on} = Feature Active
${icon_off} = Feature Not Active`;

    return template;
};

// Function to activate a feature dynamically
// دالة لتفعيل ميزة بشكل ديناميكي
const activateFeature = async (remoteJid, featureName, currentStatus, desc) => {
    if (currentStatus) {
        return `⚠️ _Feature *${featureName}* is already active._\n⚠️ _الميزة *${featureName}* مفعلة بالفعل._`;
    }

    const updateData = { fitur: { [featureName]: true } };
    await updateGroup(remoteJid, updateData);

    if (['promote','demote','welcome','left'].includes(featureName)) {