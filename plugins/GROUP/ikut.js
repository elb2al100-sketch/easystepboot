async function handle(sock, messageInfo) {
    const { remoteJid, isGroup, sender, message, command } = messageInfo;

    // English: Only works in group chats
    // العربية: يعمل فقط في مجموعات
    if (!isGroup) return;

    // English: Call the function to join giveaway
    // العربية: استدعاء الدالة للانضمام إلى Giveaway
    await joinGiveaway(sock, messageInfo);
    return;
}

async function joinGiveaway(sock, messageInfo) {
    const { remoteJid, isGroup, message, sender } = messageInfo;

    // English: Only works in group chats
    // العربية: يعمل فقط في مجموعات
    if (!isGroup) return;

    // English: Check if giveaway has started
    // العربية: التحقق ما إذا كانت الـ Giveaway قد بدأت
    if (!global.giveawayParticipants[remoteJid]) {
        await sock.sendMessage(
            remoteJid, 
            { text: '⚠ Giveaway has not started yet! Admin can start it with the command *.giveaway*\n⚠ الـ Giveaway لم تبدأ بعد! يمكن للمشرف البدء بالأمر *.giveaway*' }, 
            { quoted: message }
        );
        return;
    }

    // English: Check if user has already joined
    // العربية: التحقق ما إذا كان المستخدم قد انضم مسبقاً
    if (global.giveawayParticipants[remoteJid].has(sender)) {
        await sock.sendMessage(
            remoteJid, 
            { 
                text: `⚠ @${sender.split('@')[0]}, you have already joined the giveaway!\n⚠ @${sender.split('@')[0]}، لقد انضممت مسبقاً للـ Giveaway!`, 
                quoted: message, 
                mentions: [sender] 
            }
        );
        return;
    }

    // English: Add user to giveaway participants
    // العربية: إضافة المستخدم لقائمة المشاركين في Giveaway
    global.giveawayParticipants[remoteJid].add(sender);

    // English: Send confirmation message
    // العربية: إرسال رسالة تأكيد
    await sock.sendMessage(
        remoteJid, 
        { 
            text: `✅ @${sender.split('@')[0]} has successfully joined the giveaway!\n✅ @${sender.split('@')[0]}، تم الانضمام بنجاح إلى الـ Giveaway!`, 
            quoted: message, 
            mentions: [sender] 
        }
    );
}

module.exports = {
    handle,
    Commands    : ["ikut"], // English: Command to join giveaway | العربية: أمر للانضمام إلى Giveaway
    OnlyPremium : false,
    OnlyOwner   : false
};