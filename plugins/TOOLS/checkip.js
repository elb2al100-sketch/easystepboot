const ApiAutoresbot = require('api-autoresbot');
const config = require("@config");
const { isURL } = require("@lib/utils");
const mess = require('@mess');

// Function to send message with quote / دالة لإرسال رسالة مع اقتباس
async function sendMessageWithQuote(sock, remoteJid, message, text, options = {}) {
    await sock.sendMessage(remoteJid, { text }, { quoted: message, ...options });
}

async function handle(sock, messageInfo) {
    const { remoteJid, message, prefix, command, content } = messageInfo;

    try {
        // Validate input / التحقق من الإدخال
        if (!content.trim() || content.trim() == '') {
            return sendMessageWithQuote(
                sock, 
                remoteJid, 
                message, 
                `_⚠️ Usage Format / صيغة الاستخدام:_ \n\n💬 *Example / مثال:* _${prefix + command} 66.249.66.207_`
            );
        }

        // React to the message / إرسال تفاعل على الرسالة
        await sock.sendMessage(remoteJid, { react: { text: "🤌🏻", key: message.key } });

        const api = new ApiAutoresbot(config.APIKEY);

        // Call API with parameter / استدعاء API مع المعامل
        const response = await api.get('/api/stalker/ip', { 
            ip: content
        });

        if (response && response.data) {
            // Convert data to string / تحويل البيانات إلى نص
            const responseDataString = JSON.stringify(response.data, null, 2); // null and 2 for pretty formatting / لتنسيق جميل
            return await sock.sendMessage(
                remoteJid,
                { text: `${responseDataString}` },
                { quoted: message }
            );
        } else {
            // If no data found / إذا لم يتم العثور على بيانات
            return await sock.sendMessage(
                remoteJid,
                { text: "❌ _No data found from API / لم يتم العثور على بيانات من API._" },
                { quoted: message }
            );
        }

    } catch (error) {
        console.error("Error in handle function / خطأ في دالة المعالجة:", error);

        const errorMessage = error.message || "Unknown error occurred / حدث خطأ غير معروف.";
        return await sock.sendMessage(
            remoteJid,
            { text: `_⚠️ Error / خطأ: ${errorMessage}_` },
            { quoted: message }
        );
    }
}

module.exports = {
    handle,
    Commands    : ["ipcheck","checkip","cekip","ipchecker"], // Commands for IP checking / أوامر لفحص IP
    OnlyPremium : false,
    OnlyOwner   : false,
    limitDeduction  : 1, // Amount of usage limit to deduct / عدد حدود الاستخدام التي سيتم خصمها
};