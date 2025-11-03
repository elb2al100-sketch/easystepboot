const { findSewa }          = require("@lib/sewa");
const { selisihHari }       = require("@lib/utils");
const { getGroupMetadata }  = require("@lib/cache");

async function handle(sock, messageInfo) {
    const { remoteJid, isGroup, message } = messageInfo;
    if (!isGroup) return; // English: Only for group | العربية: فقط للمجموعات

    // English: Get group metadata
    // العربية: الحصول على بيانات المجموعة
    const { subject } = await getGroupMetadata(sock, remoteJid);

    // English: Check rental data
    // العربية: التحقق من بيانات استئجار البوت
    const dataSewa = await findSewa(remoteJid);

    if (!dataSewa) {
        // English: If the group is not renting the bot
        // العربية: إذا لم يتم استئجار البوت في هذه المجموعة
        await sock.sendMessage(
            remoteJid,
            { text: '_Group is not renting the bot_\n_المجموعة لم تستأجر البوت_' },
            { quoted: message }
        );
        return;
    }

    // English: Check rental duration
    // العربية: التحقق من مدة الاستئجار
    const selisihHariSewa = selisihHari(dataSewa.expired);

    // English: Send rental information
    // العربية: إرسال معلومات مدة الاستئجار
    await sock.sendMessage(
        remoteJid,
        { 
            text: `_*Group Name:*_ ${subject}\n_اسم المجموعة:_ ${subject}\n\n_*Bot Rental Duration:*_ _*${selisihHariSewa} day(s)*_\n_مدة استئجار البوت:_ _*${selisihHariSewa} يوم*_`
        },
        { quoted: message }
    );
}

module.exports = {
    handle,
    Commands    : ['ceksewa'], // English: Check rental | العربية: تحقق من الاستئجار
    OnlyPremium : false,
    OnlyOwner   : false
};