const { listSewa } = require("@lib/sewa");

async function handle(sock, messageInfo) {
    const { remoteJid } = messageInfo;

    try {
        // Get the list of rented groups
        // جلب قائمة المجموعات المؤجرة (Sewa)
        const sewa = await listSewa();

        // If no list found
        // إذا لم يتم العثور على أي قائمة
        if (!sewa || Object.keys(sewa).length === 0) {
            await sock.sendMessage(remoteJid, {
                text: '⚠️ _No rental list found_\n⚠️ _Tidak Ada daftar sewa ditemukan_'
            });
            return;
        }

        // Prepare the message showing total rentals
        // إعداد الرسالة لعرض إجمالي عدد المجموعات المؤجرة
        const listMessage = `*Total : ${Object.keys(sewa).length}*\n*المجموع : ${Object.keys(sewa).length}*`;

        // Send the total rental count
        // إرسال عدد المجموعات المؤجرة
        await sock.sendMessage(remoteJid, {
            text: listMessage
        });

    } catch (error) {
        console.error(error);
        // Send error message to user
        // إرسال رسالة خطأ للمستخدم
        await sock.sendMessage(remoteJid, {
            text: '_An error occurred while fetching rental list_\n_حدث خطأ أثناء جلب قائمة السوا_'
        });
    }
}

module.exports = {
    handle,
    Commands    : ['totalsewa'],
    OnlyPremium : false,
    OnlyOwner   : true
};