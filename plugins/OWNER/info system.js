// Import required modules / استيراد المكتبات المطلوبة
const axios = require('axios');
const { getServerSpecs } = require('@lib/startup');

// Main handler function / الدالة الرئيسية لمعالجة الأمر
async function handle(sock, messageInfo) {
    const { remoteJid, message, sender, command } = messageInfo;

    try {
        // Send reaction 🤌🏻 to indicate processing / إرسال رمز 🤌🏻 للدلالة على المعالجة
        await sock.sendMessage(remoteJid, { react: { text: "🤌🏻", key: message.key } });

        // Get server specifications / الحصول على مواصفات الخادم
        const {
            hostname,
            platform,
            architecture,
            totalMemory,
            freeMemory,
            uptime,
            mode
        } = await getServerSpecs();

        // Get public IP / الحصول على الـ IP العام
        const response = await axios.get('https://api.ipify.org?format=json');
        const publicIp = response.data.ip;

        // Prepare system information message / إعداد رسالة معلومات النظام
        const data = `◧ Hostname: ${hostname}
◧ Platform: ${platform}
◧ Architecture: ${architecture || '-'}
◧ Total Memory: ${totalMemory}
◧ Free Memory: ${freeMemory}
◧ Uptime: ${uptime}
◧ Public IP: ${publicIp}
◧ Mode: ${mode}`;

        // Send system information message / إرسال رسالة معلومات النظام
        await sock.sendMessage(remoteJid, { text: data }, { quoted: message });

    } catch (error) {
        console.error('Error handling command:', error.message);

        // Send error message to user / إرسال رسالة خطأ للمستخدم
        await sock.sendMessage(
            remoteJid,
            { text: '❌ An error occurred while processing the request.' }
            // ❌ حدث خطأ أثناء معالجة الطلب
            ,
            { quoted: message }
        );
    }
}

// Export module info / تصدير بيانات الموديول
module.exports = {
    handle,
    Commands: ['infosistem', 'infosystem'], // command names / أسماء الأوامر
    OnlyPremium: false, // only premium users? / للمميزين فقط؟ لا
    OnlyOwner: true     // only owner? / للمالك فقط؟ نعم
};