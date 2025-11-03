async function handle(sock, messageInfo) {
    const { remoteJid, isGroup, message } = messageInfo;

    // English: Only for groups
    // العربية: فقط للمجموعات
    if (!isGroup) return;

    // English: Send a message about renting a bot or creating a bot
    // العربية: إرسال رسالة حول استئجار بوت أو إنشاء بوت
    await sock.sendMessage(
        remoteJid,
        { 
            text: `_*WHAT'S UP, LEADER? WANT TO RENT A BOT OR CREATE A BOT? PM THE OWNER / ما الأخبار يا قائد؟ هل تريد استئجار بوت أو إنشاء بوت؟ راسل المالك مباشرة_*` 
        },
        { quoted: message }
    );
}

module.exports = {
    handle,
    Commands    : ["bot"], 
    // English: Command name
    // العربية: اسم الأمر
    OnlyPremium : false, 
    // English: Not limited to premium users
    // العربية: لا يقتصر على المستخدمين المميزين
    OnlyOwner   : false
    // English: Not limited to bot owner
    // العربية: لا يقتصر على مالك البوت
};