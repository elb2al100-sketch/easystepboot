async function handle(sock, messageInfo) {
    const { remoteJid, message, content, prefix, command } = messageInfo;
    
    try {
        // Validate input name
        // التحقق من صحة الإدخال (النص)
        if (!content || !content.trim()) {
            return await sock.sendMessage(
                remoteJid,
                {
                    text: `_⚠️ Usage Format:_ \n\n_💬 Example:_ _*${prefix + command} smart bot*_ \n\n_⚠️ صيغة الاستخدام:_\n\n_💬 مثال:_ _*${prefix + command} بوت ذكي*_`
                },
                { quoted: message }
            );
        }

        // Update bot bio/status
        // تحديث الحالة/البايو الخاص بالبوت
        await sock.updateProfileStatus(content);

        // Send success message
        // إرسال رسالة نجاح
        return await sock.sendMessage(
            remoteJid,
            {
                text: `_✅ Successfully updated bot bio to *${content}*_\n\n_✅ تم تحديث البايو/الحالة للبوت إلى: *${content}*_`
            },
            { quoted: message }
        );
    } catch (error) {
        console.error("Error processing message:", error);

        // Send error message
        // إرسال رسالة خطأ
        return await sock.sendMessage(
            remoteJid,
            {
                text: "⚠️ An error occurred while processing the message.\n\n⚠️ حدث خطأ أثناء معالجة الرسالة."
            },
            { quoted: message }
        );
    }
}

module.exports = {
    handle,
    Commands    : ["setbio"],
    OnlyPremium : false,
    OnlyOwner   : true
};