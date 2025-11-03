const { listSewa } = require("@lib/sewa");
const { groupFetchAllParticipating } = require("@lib/cache");

async function handle(sock, messageInfo) {
    const { remoteJid } = messageInfo;

    try {
        // Fetch all rental data
        // جلب جميع بيانات الاستئجار
        const sewa = await listSewa();

        // Fetch all groups the bot participates in
        // جلب جميع المجموعات التي يشارك فيها البوت
        const allGroups = await groupFetchAllParticipating(sock);

        let count = 0;
        let listMessage = '*▧ 「 LIST NON-RENTED GROUPS / قائمة المجموعات غير المستأجرة 」*\n\n';

        // Iterate through all groups
        // تكرار عبر جميع المجموعات
        for (const [groupId, groupData] of Object.entries(allGroups)) {
            if (!sewa[groupId]) {
                listMessage += `╭─
│ Subject / اسم المجموعة : ${groupData.subject}
│ Group ID / معرف المجموعة : ${groupId}
╰────────────────────────\n`;
                count++;
            }
        }

        listMessage += `\n*Total / المجموع : ${count}*`;

        // If no non-rented groups found
        // إذا لم توجد أي مجموعة غير مستأجرة
        if (count === 0) {
            listMessage = '✅ All groups are rented / جميع المجموعات مستأجرة.';
        }

        // Send the list to the user
        // إرسال القائمة إلى المستخدم
        await sock.sendMessage(remoteJid, {
            text: listMessage
        });

    } catch (error) {
        console.error(error);
        await sock.sendMessage(remoteJid, {
            text: '_⚠️ An error occurred while fetching non-rented groups / حدث خطأ أثناء جلب بيانات المجموعات غير المستأجرة._'
        });
    }
}

module.exports = {
    handle,
    Commands    : ['listnosewa'],
    OnlyPremium : false,
    OnlyOwner   : true
};