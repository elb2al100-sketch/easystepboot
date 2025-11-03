// PICK WINNER FROM REACTS BY ADMIN REPLY
// اختيار فائز من ردود الفعل على رسالة معينة عند رد الأدمن عليها

const mess = require("@mess");
const { getGroupMetadata, getReactions } = require("@lib/cache");
const { sendMessageWithMention } = require("@lib/utils");

async function handle(sock, messageInfo) {
    const { remoteJid, isGroup, message, sender, isQuoted, senderType } = messageInfo;

    // Only for groups
    // فقط للمجموعات
    if (!isGroup) return;

    try {
        // Check if sender is admin
        // التحقق مما إذا كان المرسل مشرفًا
        const groupMetadata = await getGroupMetadata(sock, remoteJid);
        const participants = groupMetadata.participants;
        const isAdmin = participants.some(p => p.id === sender && p.admin);

        if (!isAdmin) {
            await sock.sendMessage(remoteJid, { text: mess.general.isAdmin }, { quoted: message });
            return;
        }

        // Ensure admin replied to a target message
        // التأكد من أن الأدمن رد على رسالة الهدف
        if (!isQuoted) {
            return await sock.sendMessage(remoteJid, {
                text: `_⚠️ Please reply to the target message to pick a winner! / الرجاء الرد على الرسالة التي تريد اختيار الفائز منها_`
            }, { quoted: message });
        }

        const targetMessage = message.quotedMessage;

        // Get all reactions for the target message
        // جلب جميع ردود الفعل على الرسالة المحددة
        const reactions = await getReactions(remoteJid, targetMessage.key.id);
        if (!reactions || reactions.length === 0) {
            return await sock.sendMessage(remoteJid, {
                text: `_⚠️ No one reacted to this message / لا يوجد أي شخص تفاعل مع هذه الرسالة_`
            }, { quoted: message });
        }

        // Pick a random winner
        // اختيار فائز عشوائي
        const winnerIndex = Math.floor(Math.random() * reactions.length);
        const winnerJid = reactions[winnerIndex].sender;

        // Send winner message with mention
        // إرسال رسالة الفائز مع منشن
        await sendMessageWithMention(
            sock,
            remoteJid,
            `🎉 _Congratulations @${winnerJid.split("@")[0]}, you are the winner!_ / مبروك @${winnerJid.split("@")[0]}، لقد فزت!`,
            message,
            senderType
        );

    } catch (error) {
        console.error("Error picking winner:", error);
        await sock.sendMessage(remoteJid, {
            text: `_❌ An error occurred while picking a winner / حدث خطأ أثناء اختيار الفائز_`
        }, { quoted: message });
    }
}

module.exports = {
    handle,
    Commands: ["pickwinner","win","pick"],
    OnlyPremium: false,
    OnlyOwner: false
};