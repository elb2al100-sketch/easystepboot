const ApiAutoresbot = require('api-autoresbot');
const config = require("@config");

async function handle(sock, messageInfo) {
    const { remoteJid, message, prefix, command, content } = messageInfo;

    // English: Loading icon to indicate process is running
    // العربية: أيقونة تحميل لإظهار أن العملية جارية
    const loadingReaction = { react: { text: "😎", key: message.key } };

    // English: Default error message
    // العربية: رسالة خطأ افتراضية
    const errorMessage = "Sorry, an error occurred while processing your request. Try again later | عذرًا، حدث خطأ أثناء معالجة طلبك. حاول لاحقًا.";

    try {
        // English: Send loading reaction
        // العربية: إرسال رد فعل التحميل
        await sock.sendMessage(remoteJid, loadingReaction);

        const api = new ApiAutoresbot(config.APIKEY);

        // English: Call API endpoint to get earthquake information
        // العربية: استدعاء API للحصول على معلومات الزلازل
        const response = await api.get(`/api/information/gempadirasakan`);

        // English: Validate API response
        // العربية: التحقق من استجابة API
        if (response?.data?.length) {
            const gempaInfo = response.data[0];

            // English: Format earthquake info
            // العربية: تنسيق معلومات الزلزال
            const capt = `_*Latest Earthquake Information | آخر معلومات الزلزال*_

*◧ Date | التاريخ:* ${gempaInfo.Tanggal}
*◧ Region | المنطقة:* ${gempaInfo.Wilayah}
*◧ DateTime | التاريخ والوقت:* ${gempaInfo.DateTime}
*◧ Latitude | خط العرض:* ${gempaInfo.Lintang}
*◧ Longitude | خط الطول:* ${gempaInfo.Bujur}
*◧ Magnitude | القوة:* ${gempaInfo.Magnitude}
*◧ Depth | العمق:* ${gempaInfo.Kedalaman}
*◧ Felt | شعرت به:* ${gempaInfo.Dirasakan || "No information | لا توجد معلومات"}
`;

            // English: Send earthquake information to user
            // العربية: إرسال معلومات الزلزال للمستخدم
            await sock.sendMessage(remoteJid, { text: capt }, { quoted: message });
        } else {
            // English: Send default message if no data
            // العربية: إرسال رسالة افتراضية إذا لم تتوفر بيانات
            await sock.sendMessage(remoteJid, { text: "Sorry, no earthquake information available at the moment | عذرًا، لا توجد معلومات عن الزلازل حالياً." }, { quoted: message });
        }
    } catch (error) {
        console.error("Error calling earthquake API | خطأ عند استدعاء API الزلازل:", error);

        // English: Handle error and send message to user
        // العربية: معالجة الخطأ وإرسال رسالة للمستخدم
        await sock.sendMessage(remoteJid, { text: `${errorMessage}\n\nError Details | تفاصيل الخطأ: ${error.message}` }, { quoted: message });
    }
}

module.exports = {
    handle,
    Commands    : ['infogempa'],
    OnlyPremium : false,
    OnlyOwner   : false
};