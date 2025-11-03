const { listSewa } = require("@lib/sewa");
const { groupFetchAllParticipating } = require("@lib/cache");

// Fungsi delay / دالة التأخير
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function handle(sock, messageInfo) {
    const { remoteJid } = messageInfo;

    try {
        // Ambil data sewa dan semua grup
        // الحصول على قائمة المجموعات المؤجرة وكل المجموعات التي ينتمي إليها البوت
        const sewa = await listSewa();
        const allGroups = await groupFetchAllParticipating(sock);

        let count = 0;
        let listMessage = '*▧ 「 LIST GRUP NON-SEWA 」* / قائمة المجموعات غير المؤجرة\n\n';

        // Iterasi semua grup
        // تكرار لكل المجموعات
        for (const [groupId, groupData] of Object.entries(allGroups)) {
            if (!sewa[groupId]) {
                try {
                    await sock.groupLeave(groupId); // Bot leaves the group / مغادرة البوت للمجموعة
                    await sleep(2000); // Delay 2 seconds / تأخير 2 ثانية

                    listMessage += `╭───────────────
│ *Subject* : ${groupData.subject}
│ *ID Grup* : ${groupId}
╰───────────────\n\n`;
                    count++;
                } catch (leaveErr) {
                    console.error(`Failed to leave group ${groupId}:`, leaveErr.message);
                    listMessage += `⚠️ *Failed to leave group / فشل في مغادرة المجموعة*: ${groupData.subject} (${groupId})\n\n`;
                }
            }
        }

        // Jika semua grup sewa
        // إذا كانت كل المجموعات مؤجرة
        if (count === 0) {
            listMessage = '✅ _Semua grup merupakan grup sewa / كل المجموعات مؤجرة._';
        } else {
            listMessage += `*Total keluar / إجمالي المغادرة: ${count} grup.*`;
        }

        // Kirim laporan ke user / إرسال التقرير للمستخدم
        await sock.sendMessage(remoteJid, { text: listMessage });

    } catch (error) {
        console.error(error);
        await sock.sendMessage(remoteJid, {
            text: '_Terjadi kesalahan saat mengambil data grup non-sewa / حدث خطأ أثناء الحصول على بيانات المجموعات غير المؤجرة._'
        });
    }
}

module.exports = {
    handle,
    Commands    : ['outnosewa'],
    OnlyPremium : false,
    OnlyOwner   : true
};