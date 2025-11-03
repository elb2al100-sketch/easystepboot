async function handle(sock, messageInfo) {
    const { remoteJid, message, content, sender, prefix, command } = messageInfo;

    try {
        // Validate input: must exist and contain whatsapp.com
        // / التحقق من الإدخال: يجب أن يحتوي على "whatsapp.com"
        if (!content || content.trim() === '' || !content.includes('whatsapp.com')) {
            return await sock.sendMessage(
                remoteJid,
                {
                    text: `_⚠️ Usage Format:_ \n\n_💬 Example:_ _*${prefix + command} https://chat.whatsapp.com/xxx*_`
                    // _⚠️ صيغة الاستخدام:_
                    // مثال: .join https://chat.whatsapp.com/xxx
                },
                { quoted: message }
            );
        }

        // Send a loading reaction / إرسال رمز انتظار أثناء المعالجة
        await sock.sendMessage(remoteJid, { react: { text: "🤌🏻", key: message.key } });

        // Extract group ID from invite link / استخراج معرف المجموعة من الرابط
        const groupId = content.split('chat.whatsapp.com/')[1];
        if (!groupId) {
            return await sock.sendMessage(
                remoteJid,
                { text: `⚠️ Invalid group link.` },
                { quoted: message }
            );
        }

        // Try joining the group / محاولة الانضمام إلى المجموعة
        try {
            await sock.groupAcceptInvite(groupId);
            await sock.sendMessage(
                remoteJid,
                { text: `✅ Successfully joined the group.` },
                { quoted: message }
            );
        } catch (error) {
            let info = '_Make sure the group link is valid._';
            // _تأكد من صحة رابط المجموعة_

            // Check error messages / التحقق من رسائل الخطأ
            if (error instanceof Error && error.message.includes('not-authorized')) {
                info = `_You might have been removed from the group before. Solution: invite the bot again or add manually._`;
                // _ربما تم طردك مسبقًا من المجموعة. الحل: أعد دعوة البوت أو أضفه يدويًا._
            }

            if (error instanceof Error && error.message.includes('conflict')) {
                info = `_Bot is already in the group._`;
                // _البوت موجود بالفعل في المجموعة_
            }

            // Send error message to user / إرسال رسالة خطأ للمستخدم
            return await sock.sendMessage(
                remoteJid,
                {
                    text: `⚠️ _Failed to join the group._\n\n${info}`
                    // ⚠️ فشل في الانضمام إلى المجموعة
                },
                { quoted: message }
            );
        }
    } catch (error) {
        console.error('An error occurred:', error);
        await sock.sendMessage(
            remoteJid,
            { text: `⚠️ An error occurred while processing the command.` },
            { quoted: message }
        );
    }
}

// Export module / تصدير الموديول
module.exports = {
    handle,
    Commands    : ['join'],     // command name / اسم الأمر
    OnlyPremium : false,        // only premium users? / للمميزين فقط؟ لا
    OnlyOwner   : true           // only owner? / للمالك فقط؟ نعم
};