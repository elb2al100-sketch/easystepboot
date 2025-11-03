const { listUser, deleteUser } = require("@lib/panel");

async function handle(sock, messageInfo) {
    const { remoteJid, message, content, prefix, command } = messageInfo;

    try {
        // Validate input / التحقق من صحة المدخلات
        if (!content || content.toLowerCase() !== '-y') {
            await sock.sendMessage(remoteJid, {
                text: `⚠️ This command will delete all user data.\n\nPlease type *.${command} -y* to continue / هذا الأمر سيحذف جميع بيانات المستخدمين.\n\nيرجى كتابة *.${command} -y* للمتابعة.`
            }, { quoted: message });
            return;
        }

        // Send reaction to indicate process is running / إرسال رد فعل لإظهار أن العملية جارية
        await sock.sendMessage(remoteJid, { react: { text: "🤌🏻", key: message.key } });

        // Fetch list of users / جلب قائمة المستخدمين
        const result = await listUser();
        let usersDeleted = 0;

        // If no users found / إذا لم يتم العثور على مستخدمين
        if (!result.data || result.data.length === 0) {
            await sock.sendMessage(remoteJid, {
                text: "❌ No users found to reset / لم يتم العثور على مستخدمين لإعادة التعيين."
            }, { quoted: message });
            return;
        }

        // Delete all non-admin users / حذف جميع المستخدمين غير المسؤولين
        for (const user of result.data) {
            const { id, root_admin } = user.attributes;

            if (!root_admin) {
                try {
                    await deleteUser(id);
                    usersDeleted++;
                } catch (err) {
                    console.error(`Failed to delete user with ID ${id}:`, err.message);
                }
            }
        }

        // Send completion message / إرسال رسالة بعد الانتهاء
        const msgResponse = `✅ User data has been successfully reset / تم إعادة تعيين بيانات المستخدمين بنجاح.\n\n${usersDeleted} users deleted / تم حذف ${usersDeleted} مستخدم.`;
        await sock.sendMessage(remoteJid, {
            text: msgResponse
        }, { quoted: message });

    } catch (error) {
        // Global error handling / التعامل مع الأخطاء بشكل عام
        console.error("Error while resetting users:", error);
        await sock.sendMessage(remoteJid, {
            text: `❌ An error occurred: ${error.message || 'Unknown / غير معروف'}`
        }, { quoted: message });
    }
}

module.exports = {
    handle,
    Commands    : ['resetuser'],
    OnlyPremium : false,
    OnlyOwner   : true,
};