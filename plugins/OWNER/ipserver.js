const axios = require('axios');
const { reply } = require('@lib/utils');

/**
 * Checks IPv4 and IPv6 addresses with a timeout of 15 seconds.
 * / يتحقق من عناوين IPv4 و IPv6 مع مهلة 15 ثانية
 * @returns {Promise<string>} The response message containing IPv4 and IPv6 details.
 * / رسالة الرد تحتوي على تفاصيل IPv4 و IPv6
 */
const checkIPs = async () => {
    try {
        const timeout = 15000; // Timeout in milliseconds / المهلة بالميلي ثانية

        // Check IPv4 / التحقق من IPv4
        const ipv4Response = await axios.get('https://api.ipify.org', { timeout });
        const ipv4 = ipv4Response.data.trim();

        // Check IPv6 / التحقق من IPv6
        let ipv6 = 'Not Supported'; // غير مدعوم بشكل افتراضي
        try {
            const ipv6Response = await axios.get('https://api6.ipify.org', { timeout });
            ipv6 = ipv6Response.data.trim();
        } catch (error) {
            console.warn(`Failed to fetch IPv6: ${error.message}`);
            // فشل في جلب IPv6
        }

        // Prepare response / إعداد الرسالة
        return `_SERVER IP_
IPv4: ${ipv4}
IPv6: ${ipv6}`;
        // _عنوان IP السيرفر_
        // IPv4: ...
        // IPv6: ...
    } catch (error) {
        return `Failed to check IP: ${error.message}`;
        // فشل في التحقق من IP
    }
};

/**
 * Handles the "ipserver" command.
 * / الدالة لمعالجة أمر "ipserver"
 * @param {object} sock - The socket connection object / كائن الاتصال بالسيرفر
 * @param {object} messageInfo - Information about the incoming message / معلومات عن الرسالة الواردة
 */
async function handle(sock, messageInfo) {
    const { m, remoteJid, message } = messageInfo;

    try {
        // Send a loading reaction / إرسال رمز انتظار أثناء المعالجة
        await sock.sendMessage(remoteJid, { react: { text: "🤌🏻", key: message.key } });

        // Fetch IP details / جلب تفاصيل IP
        const response = await checkIPs();

        // Send the IP details as a message / إرسال تفاصيل IP كمكالمة
        await sock.sendMessage(remoteJid, { text: response }, { quoted: message });
    } catch (error) {
        // Handle errors / معالجة الأخطاء
        console.error('Error in handle function:', error);
        const errorMessage = `Sorry, an error occurred while processing your request. Please try again later.
        
Detail: ${error.message}`;
        // عذرًا، حدث خطأ أثناء معالجة طلبك. حاول لاحقًا.
        // التفاصيل: ...
        await sock.sendMessage(remoteJid, { text: errorMessage }, { quoted: message });
    }
}

// Export module info / تصدير بيانات الموديول
module.exports = {
    handle,
    Commands    : ['ipserver'], // command name / اسم الأمر
    OnlyPremium : false,         // only premium users? / للمميزين فقط؟ لا
    OnlyOwner   : true           // only owner? / للمالك فقط؟ نعم
};