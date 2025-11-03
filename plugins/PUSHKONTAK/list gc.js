const { groupFetchAllParticipating } = require("@lib/cache");

/**
 * Format group information / تنسيق معلومات المجموعة
 * @param {object} sock
 * @param {number} index
 * @param {object} grup
 * @returns {string}
 */
async function formatGrup(sock, index, grup) {
    try {
        const inviteCode = await sock.groupInviteCode(grup.id);
        const groupLink = `https://chat.whatsapp.com/${inviteCode}`;
        return `╭─「 ${index} 」 *${grup.subject}*
│ Members / الأعضاء : ${grup.participants.length}
│ Group ID / معرف المجموعة : ${grup.id}
│ Link / الرابط    : ${groupLink}
╰────────────────────────`;
    } catch (error) {
        // If invite code cannot be retrieved / إذا لم يتمكن من الحصول على كود الدعوة
        return `╭─「 ${index} 」 *${grup.subject}*
│ Members / الأعضاء : ${grup.participants.length}
│ Group ID / معرف المجموعة : ${grup.id}
╰────────────────────────`;
    }
    // │ Status : ${grup.announce ? 'Closed / مغلق' : 'Open / مفتوح'}
    // │ Admin : ${grup.restrict ? 'admin' : 'non-admin / ليس مشرف'}
}

async function handle(sock, messageInfo) {
    const { remoteJid, message } = messageInfo;

    try {
        // Send reaction to indicate processing / إرسال رد فعل لإظهار أن العملية جارية
        await sock.sendMessage(remoteJid, { react: { text: "🤌🏻", key: message.key } });

        // Fetch all groups the bot participates in / جلب جميع المجموعات التي يشارك فيها البوت
        const allGroups = await groupFetchAllParticipating(sock);

        // Sort groups by number of participants descending / ترتيب المجموعات حسب عدد الأعضاء تنازلياً
        const sortedGroups = Object.values(allGroups).sort((a, b) => b.participants.length - a.participants.length);

        // Format each group / تنسيق كل مجموعة
        const formattedGroups = await Promise.all(
            sortedGroups.map((group, index) => formatGrup(sock, index + 1, group))
        );

        const totalGroups = sortedGroups.length;
        const responseMessage = `_*Total Groups / إجمالي المجموعات: ${totalGroups}*_ \n\n${formattedGroups.join('\n\n')}`;

        // Send group list message / إرسال رسالة قائمة المجموعات
        await sock.sendMessage(remoteJid, { text: responseMessage }, { quoted: message });
    } catch (error) {
        console.error("Error in handle function:", error);
        await sock.sendMessage(
            remoteJid,
            { text: "_An error occurred while processing the command / حدث خطأ أثناء معالجة الأمر._" },
            { quoted: message }
        );
    }
}

module.exports = {
    handle,
    Commands    : ['listgc', 'listgrub', 'listgroub', 'listgrup', 'listgroup'],
    OnlyPremium : false,
    OnlyOwner   : true
};