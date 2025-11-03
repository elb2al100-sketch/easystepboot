const config = require("@config");
const { listUser } = require("@lib/panel");

async function handle(sock, messageInfo) {
    const { remoteJid, message, content, prefix, command } = messageInfo;

    try {
        // Send reaction to indicate data is being processed / إرسال رد فعل لإظهار أن البيانات قيد المعالجة
        await sock.sendMessage(remoteJid, { react: { text: "🤌🏻", key: message.key } });

        let page;
        if (content && !isNaN(content) && Number(content) > 0) {
            page = Number(content); // Use page number from content if valid / استخدام الرقم من المحتوى إذا كان صالحًا
        } else {
            page = 1; // Default to page 1 if invalid / الافتراضي للصفحة 1 إذا لم يكن صالحًا
        }

        const result = await listUser(page);

        // Check if there is any user data / التحقق من وجود بيانات المستخدمين
        if (!result.data || result.data.length === 0) {
            await sock.sendMessage(remoteJid, {
                text: `⚠️ No user data found / لم يتم العثور على بيانات المستخدمين.`,
            }, { quoted: message });
            return;
        }

        // Format user list / تنسيق قائمة المستخدمين
        let userList = "📋 *User List / قائمة المستخدمين:*\n\n";
        result.data.forEach((user, index) => {
            const { attributes } = user;
            const username = attributes.username || "No Name / لا يوجد اسم";
            const email = attributes.email || "No Email / لا يوجد بريد إلكتروني";
            const id = attributes.id || "No ID / لا يوجد معرف";

            userList += `*${index + 1}. ID:* ${id}\n`;
            userList += `   *Username / الاسم:* ${username}\n`;
            userList += `   *Email / البريد الإلكتروني:* ${email}\n\n`;
        });

        if(result.data.length >= 50) {
            userList += `"_📄 Each page shows up to 50 users. To view the next page, use the command:_ .listuser [page number] Example: _*.listuser 2*_ / كل صفحة تعرض حتى 50 مستخدمًا. لعرض الصفحة التالية استخدم الأمر: .listuser [رقم الصفحة]_"`;
        }

        // Send user list / إرسال قائمة المستخدمين
        await sock.sendMessage(remoteJid, {
            text: userList.trim(),
        }, { quoted: message });

    } catch (error) {
        console.error("Error in handle function:", error);

        // Prepare error message / تحضير رسالة الخطأ
        let errorMessage = "❌ An error occurred while fetching the user list / حدث خطأ أثناء جلب قائمة المستخدمين.\n";
        if (error.errors && Array.isArray(error.errors)) {
            error.errors.forEach(err => {
                errorMessage += `- ${err.detail}\n`;
            });
        }

        // Send error message to user / إرسال رسالة الخطأ للمستخدم
        try {
            await sock.sendMessage(remoteJid, {
                text: errorMessage.trim(),
            }, { quoted: messageInfo?.message });
        } catch (sendError) {
            console.error("Error sending error message:", sendError);
        }
    }
}

module.exports = {
    handle,
    Commands    : ['listuser'],
    OnlyPremium : false,
    OnlyOwner   : true,
};