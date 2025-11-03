const { groupFetchAllParticipating } = require("@lib/cache");

async function handle(sock, messageInfo) {
    const { remoteJid, message, content, command, sender } = messageInfo;

    try {
        // If the command is empty or only spaces
        // إذا كان الأمر فارغًا أو يحتوي فقط على مسافات
        if (!content.trim()) {
            await sock.sendMessage(
                remoteJid,
                {
                    text: `⚠️ _This command will leave all WhatsApp groups that the bot is in._ / هذا الأمر سيجعل البوت يترك جميع المجموعات على واتساب.\n\nPlease type *.${command} -y* to confirm / يرجى كتابة *.${command} -y* للتأكيد.`,
                },
                { quoted: message }
            );
            return;
        }

        // If user confirms with "-y"
        // إذا أكد المستخدم بكتابة "-y"
        if (content.trim() === "-y") {
            const allGroups = await groupFetchAllParticipating(sock);

            // Loop to leave all groups
            // التكرار لمغادرة جميع المجموعات
            const leavePromises = Object.values(allGroups).map((group) => {
                if (group.id !== remoteJid) {
                    return sock.groupLeave(group.id);
                }
                return null;
            });

            // Wait for all groups to be processed
            // الانتظار حتى تنتهي عملية مغادرة جميع المجموعات
            await Promise.all(leavePromises);

            await sock.sendMessage(
                remoteJid,
                { text: "✅ _Successfully left all groups, except this one_ / ✅ تم مغادرة جميع المجموعات بنجاح، باستثناء هذه المجموعة" },
                { quoted: message }
            );
        }
    } catch (error) {
        console.error("An error occurred:", error);

        // Send error message
        // إرسال رسالة خطأ
        await sock.sendMessage(
            remoteJid,
            { text: "⚠️ An error occurred while processing your request / ⚠️ حدث خطأ أثناء معالجة طلبك." },
            { quoted: message }
        );
    }
}

module.exports = {
    handle,
    Commands    : ["outallgrup", "outallgroup", "outallgrub", "outallgroub","outallgc"],
    OnlyPremium : false,
    OnlyOwner   : true
};