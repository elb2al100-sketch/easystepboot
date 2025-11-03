const config = require("@config");
const { saveUser } = require("@lib/panel");

async function handle(sock, messageInfo) {
    const { remoteJid, message, content, prefix, command } = messageInfo;

    try {
        // Send reaction to indicate the process is running / إرسال رد فعل لإظهار أن العملية جارية
        await sock.sendMessage(remoteJid, { react: { text: "🤌🏻", key: message.key } });

        // Call saveUser function to save users / استدعاء دالة saveUser لحفظ المستخدمين
        const result = await saveUser();  // Execute saving users / تنفيذ حفظ المستخدمين

        if (result) {
            // If successful, send message with the number of saved users / إذا نجحت العملية، أرسل رسالة بعدد المستخدمين المحفوظين
            await sock.sendMessage(remoteJid, {
                text: `✅ Successfully saved ${result} users / تم حفظ ${result} مستخدم بنجاح.`
            }, { quoted: message });
        } else {
            // If no data saved or result is empty / إذا لم يتم حفظ أي بيانات أو كانت النتيجة فارغة
            await sock.sendMessage(remoteJid, {
                text: "❌ No users were saved. Make sure user data is available / لم يتم حفظ أي مستخدم. تأكد من توفر بيانات المستخدمين."
            }, { quoted: message });
        }

    } catch (error) {
        console.error("Error in handle function:", error);

        // Send error message to user / إرسال رسالة خطأ للمستخدم
        await sock.sendMessage(remoteJid, {
            text: error.message || '❌ An error occurred while saving user data / حدث خطأ أثناء حفظ بيانات المستخدمين.'
        }, { quoted: message });
    }
}

module.exports = {
    handle,
    Commands    : ['saveuser'],
    OnlyPremium : false,
    OnlyOwner   : true,
};