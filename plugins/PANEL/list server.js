const config = require("@config");
const { listServer } = require("@lib/panel");

async function handle(sock, messageInfo) {
    const { remoteJid, message, content, prefix, command } = messageInfo;

    try {
        // Send reaction to indicate data is being processed / إرسال رد فعل لإظهار أن البيانات قيد المعالجة
        await sock.sendMessage(remoteJid, { react: { text: "🤌🏻", key: message.key } });

        let page;
        if (content && !isNaN(content) && Number(content) > 0) {
            page = Number(content); // Use page number from content if valid / استخدام الرقم من المحتوى إذا كان صالح
        } else {
            page = 1; // Default to page 1 if invalid / الافتراضي للصفحة 1 إذا لم يكن صالحًا
        }

        const result = await listServer(page);

        // Check if there is any server data / التحقق من وجود بيانات الخوادم
        if (!result.data || result.data.length === 0) {
            await sock.sendMessage(remoteJid, {
                text: `⚠️ No server data found / لم يتم العثور على بيانات الخوادم.`,
            }, { quoted: message });
            return;
        }

        // Format server list / تنسيق قائمة الخوادم
        let serverList = "📋 *Server List / قائمة الخوادم:*\n\n";
        result.data.forEach((server, index) => {
            const { attributes } = server;
            const id = attributes.id || "No ID / لا يوجد معرف";
            const identifier = attributes.identifier || "No Identifier / لا يوجد معرف";
            const uuid = attributes.uuid || "No UUID / لا يوجد UUID";
            const name = attributes.name || "No Name / لا يوجد اسم";

            serverList += `*${index + 1}. ID:* ${id}\n`;
            serverList += `*Name / الاسم:* ${name}\n`;
            serverList += `*Identifier / المعرف:* ${identifier}\n`;
            serverList += `*UUID:* ${uuid}\n\n`;
        });

        if(result.data.length >= 50) {
            serverList += `"_📄 Each page shows up to 50 servers. To view the next page, use the command:_ .listserver [page number] Example: _*.listserver 2*_ / كل صفحة تعرض حتى 50 خادم. لعرض الصفحة التالية استخدم الأمر: .listserver [رقم الصفحة]_"`;
        }

        // Send server list / إرسال قائمة الخوادم
        await sock.sendMessage(remoteJid, {
            text: serverList.trim(),
        }, { quoted: message });

    } catch (error) {
        console.error("Error in handle function:", error);

        // Prepare error message / تحضير رسالة الخطأ
        let errorMessage = "❌ An error occurred while fetching the server list / حدث خطأ أثناء جلب قائمة الخوادم.\n";
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
    Commands    : ['listserver'],
    OnlyPremium : false,
    OnlyOwner   : true
};