const mess = require("@mess");

async function handle(sock, messageInfo) {
    const { remoteJid, message, content, prefix, command, sender } = messageInfo;

    try {
        // Validate input format
        // التحقق من صحة تنسيق المدخلات
        if (!content.trim() || !content.includes("@g.us")) {
            await sock.sendMessage(
                remoteJid,
                {
                    text: `⚠️ _Invalid format / تنسيق غير صالح._\n\nPlease type: *.${command} GROUPID* / يرجى كتابة: *.${command} IDGRUB*\n\nExample: ${prefix + command} 120363204743427585@g.us`,
                },
                { quoted: message }
            );
            return;
        }

        // Attempt to leave the group
        // محاولة مغادرة المجموعة
        try {
            await sock.groupLeave(content);
            await sock.sendMessage(
                remoteJid,
                {
                    text: `✅ _Successfully left the group with ID: *${content}*_ / ✅ تم مغادرة المجموعة بنجاح مع ID: *${content}*`,
                },
                { quoted: message }
            );
        } catch (err) {
            console.error("Failed to leave group:", err);
            await sock.sendMessage(
                remoteJid,
                {
                    text: "⚠️ Failed to leave the group. Make sure the Group ID is correct or the bot has sufficient permissions. / ⚠️ فشل في مغادرة المجموعة. تأكد من صحة ID المجموعة أو أن البوت لديه الصلاحيات الكافية.",
                },
                { quoted: message }
            );
        }
    } catch (error) {
        // Send general error message
        // إرسال رسالة خطأ عامة
        await sock.sendMessage(
            remoteJid,
            {
                text: "⚠️ _An error occurred while processing your request._ / ⚠️ حدث خطأ أثناء معالجة طلبك.",
            },
            { quoted: message }
        );
    }
}

module.exports = {
    handle,
    Commands    : ["outgrup", "outgroup", "outgrub", "outgroub", "outgc"],
    OnlyPremium : false,
    OnlyOwner   : true
};