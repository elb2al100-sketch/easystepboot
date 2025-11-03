const { listSewa, deleteSewa } = require("@lib/sewa");
const { selisihHari } = require("@lib/utils");
const { groupFetchAllParticipating } = require("@lib/cache");

async function handle(sock, messageInfo) {
    const { remoteJid } = messageInfo;

    try {
        // Get rental list data / جلب بيانات السعات المستأجرة
        const sewa = await listSewa();

        // If there is no rental list / إذا لم توجد قائمة مستأجرة
        if (!sewa || Object.keys(sewa).length === 0) {
            await sock.sendMessage(remoteJid, {
                text: '⚠️ _No rental list found / لم يتم العثور على قائمة الإيجار_'
            });
            return;
        }

        // Convert object to array and sort by expired date / تحويل الكائن إلى مصفوفة وترتيبها حسب انتهاء الإيجار
        const sortedSewa = Object.entries(sewa).sort(([, a], [, b]) => a.expired - b.expired);

        // Get all participating groups / جلب جميع المجموعات المشاركة
        const allGroups = await groupFetchAllParticipating(sock);

        let listMessage = '*▧ 「 RENTAL LIST / قائمة الإيجار 」*\n\n';
        let count = 0;

        for (const [groupId, data] of sortedSewa) {
            const subject = allGroups[groupId]?.subject || 'Group Name Not Found / اسم المجموعة غير موجود';

            if (subject === 'Group Name Not Found / اسم المجموعة غير موجود') {
                // Delete rental data for group ID / حذف بيانات الإيجار إذا لم يتم العثور على اسم المجموعة
                await deleteSewa(groupId);
                continue;
            }

            listMessage += `╭─
│ Subject / الاسم : ${subject}
│ Group ID / معرف المجموعة : ${groupId}
│ Expired / انتهى بعد : ${selisihHari(data.expired)}
╰────────────────────────\n`;

            count++;
        }

        listMessage += `\n*Total / المجموع : ${count}*`;

        // Send the rental list message / إرسال رسالة القائمة
        await sock.sendMessage(remoteJid, {
            text: listMessage
        });

    } catch (error) {
        console.error(error);
        await sock.sendMessage(remoteJid, {
            text: '_⚠️ An error occurred while fetching the rental list / حدث خطأ أثناء جلب قائمة الإيجار_'
        });
    }
}

module.exports = {
    handle,
    Commands: ['listsewa2'],
    OnlyPremium: false,
    OnlyOwner: true
};