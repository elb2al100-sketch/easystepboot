const path = require('path');
const fs = require('fs');
const { getGroupMetadata } = require("@lib/cache");

// English: Function to get group's open and close schedule
// العربية: دالة للحصول على أوقات فتح وإغلاق المجموعة
function getGroupSchedule(filePath) {
    if (!fs.existsSync(filePath)) return { openTime: '-', closeTime: '-' };

    const schedules = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    let openTime = '-';
    let closeTime = '-';

    for (const groupData of Object.values(schedules)) {
        openTime = groupData.openTime ?? openTime;
        closeTime = groupData.closeTime ?? closeTime;
    }

    return { openTime, closeTime };
}

async function handle(sock, messageInfo) {
    const { remoteJid, isGroup, message } = messageInfo;

    // English: Only works in group chats
    // العربية: يعمل فقط في مجموعات
    if (!isGroup) return;

    try {
        // English: Get group metadata (subject, size, id)
        // العربية: الحصول على بيانات المجموعة (الاسم، عدد الأعضاء، المعرف)
        const groupMetadata = await getGroupMetadata(sock, remoteJid);

        // English: Path to the JSON file with group schedule
        // العربية: مسار ملف JSON الخاص بجدول المواعيد
        const jsonPath = path.resolve(process.cwd(), './database/additional/group participant.json');
        const { openTime, closeTime } = getGroupSchedule(jsonPath);

        // English: Get group invite code
        // العربية: الحصول على رابط الدعوة للمجموعة
        let response = await sock.groupInviteCode(remoteJid);

        // English & Arabic: Prepare response message
        let text = `┏━『 *${groupMetadata.subject}* 』━◧
┣
┣» Members | الأعضاء : ${groupMetadata.size}
┣» ID       | معرف : ${groupMetadata.id}
┣» Link     | الرابط : https://chat.whatsapp.com/${response}
┣
┣ *SCHEDULED | الجدول*
┣» Open Group  | وقت الفتح : ${openTime}
┣» Close Group | وقت الإغلاق : ${closeTime}
┗━━━━━━━━━━━━━◧
`;

        // English: Send success message
        // العربية: إرسال رسالة المعلومات
        await sock.sendMessage(remoteJid, { text }, { quoted: message });

    } catch (error) {
        console.error('Error getting group info:', error);

        // English: Send error message
        // العربية: إرسال رسالة خطأ
        await sock.sendMessage(
            remoteJid,
            { text: '⚠️ Failed to get group info. Make sure the format is correct and the bot has permission.\n⚠️ فشل في الحصول على معلومات المجموعة. تأكد من الصلاحيات والصيغة الصحيحة.' },
            { quoted: message }
        );
    }
}

module.exports = {
    handle,
    Commands    : ['infogc', 'infogrub', 'infogroub', 'infogrup', 'infogroup'], // Command aliases | أسماء الأوامر
    OnlyPremium : false,
    OnlyOwner   : false
};