const { listSewa, deleteSewa } = require("@lib/sewa");
const { selisihHari, hariini } = require("@lib/utils");
const { groupFetchAllParticipating } = require("@lib/cache");

async function handle(sock, messageInfo) {
    const { remoteJid, sender, message } = messageInfo;

    try {
        // Get rented list data / جلب بيانات القوائم المستأجرة
        const sewa = await listSewa();

        // If there is no rented list / إذا لم توجد قائمة مستأجرة
        if (!sewa || Object.keys(sewa).length === 0) {
            await sock.sendMessage(remoteJid, {
                text: '⚠️ _No rental list found / لم يتم العثور على قائمة الإيجار_'
            });
            return;
        }

        // Convert object to array and sort by latest expired / تحويل الكائن إلى مصفوفة وترتيبها حسب تاريخ الانتهاء
        const sortedSewa = Object.entries(sewa).sort(([, a], [, b]) => a.expired - b.expired);

        const allGroups = await groupFetchAllParticipating(sock);
    
        // Build message list / إنشاء رسالة القائمة
        let listMessage = '*▧ 「 RENTAL LIST / قائمة الإيجار 」*\n\n';
        sortedSewa.forEach(([groupId, data], index) => {
            // Get subject from allGroups if exists / جلب اسم المجموعة إذا وجد
            const subject = allGroups[groupId] ? allGroups[groupId].subject : 'Group Name Not Found / اسم المجموعة غير موجود';
        
            listMessage += `╭─
│ Subject / الاسم : ${subject}
│ Group ID / معرف المجموعة : ${groupId}
│ Expired / انتهى بعد : ${selisihHari(data.expired)}
╰────────────────────────\n`;
        });
        
        listMessage += `\n*Total / المجموع : ${sortedSewa.length}*`;
        
        // Send rental list message / إرسال رسالة القائمة
        await sock.sendMessage(remoteJid, {
            text: listMessage
        });

    } catch (error) {
        console.error(error);
        await sock.sendMessage(remoteJid, {
            text: '_⚠️ An error occurred while fetching rental list / حدث خطأ أثناء جلب قائمة الإيجار_'
        });
    }
}

module.exports = {
    handle,
    Commands    : ['listsewa'],
    OnlyPremium : false,
    OnlyOwner   : true
};