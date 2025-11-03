const { listServer, deleteServer } = require("@lib/panel");

async function handle(sock, messageInfo) {
    const { remoteJid, message, content, prefix, command } = messageInfo;

    try {
        // Validate input / التحقق من صحة المدخلات
        if (!content || content.toLowerCase() !== '-y') {
            await sock.sendMessage(remoteJid, {
                text: `⚠️ This command will delete all server data.\n\nPlease type *.${command} -y* to continue / هذا الأمر سيحذف كل بيانات السيرفر.\n\nيرجى كتابة *.${command} -y* للمتابعة.`
            }, { quoted: message });
            return;
        }

        // Send reaction to indicate process is running / إرسال رد فعل لإظهار أن العملية جارية
        await sock.sendMessage(remoteJid, { react: { text: "🤌🏻", key: message.key } });

        // Fetch list of servers / جلب قائمة السيرفرات
        const result = await listServer();
        let serverDeleted = 0;

        // If no servers found / إذا لم يتم العثور على سيرفرات
        if (!result.data || result.data.length === 0) {
            await sock.sendMessage(remoteJid, {
                text: "❌ No servers found to reset / لم يتم العثور على سيرفرات لإعادة التعيين."
            }, { quoted: message });
            return;
        }

        // Delete all servers / حذف جميع السيرفرات
        for (const server of result.data) {
            const { id } = server.attributes;
            try {
                await deleteServer(id);
                serverDeleted++;
            } catch (err) {
                console.error(`Failed to delete server with ID ${id}:`, err.message);
            }
        }

        // Send completion message / إرسال رسالة بعد الانتهاء
        const msgResponse = `✅ Servers have been successfully reset / تم إعادة تعيين السيرفرات بنجاح.\n\n${serverDeleted} servers deleted / تم حذف ${serverDeleted} سيرفر.`;
        await sock.sendMessage(remoteJid, {
            text: msgResponse
        }, { quoted: message });

    } catch (error) {
        // Global error handling / التعامل مع الأخطاء بشكل عام
        console.error("Error while resetting servers:", error);
        await sock.sendMessage(remoteJid, {
            text: `❌ An error occurred: ${error.message || 'Unknown / غير معروف'}`
        }, { quoted: message });
    }
}

module.exports = {
    handle,
    Commands    : ['resetserver'],
    OnlyPremium : false,
    OnlyOwner   : true,
};