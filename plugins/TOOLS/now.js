const moment = require('moment-timezone');

async function handle(sock, messageInfo) {
    const { remoteJid, message } = messageInfo;

    // Format for date and time
    // صيغة التاريخ والوقت
    const format = "DD-MM-YYYY HH:mm";

    // International Time (UTC)
    // الوقت الدولي (UTC)
    const utcTime = moment().tz("UTC").format(format);

    // Local Cairo Time (Egypt / القاهرة مصر)
    // الوقت المحلي القاهرة (مصر)
    const cairoTime = moment().tz("Africa/Cairo").format(format);

    // Send message with UTC and Cairo time
    // إرسال رسالة تحتوي على توقيت UTC والقاهرة
    const response = `🤌🏻 Current Time / الوقت الحالي:

🌍 UTC: 
${utcTime}

🇪🇬 Cairo Time / توقيت القاهرة: 
${cairoTime}`;

    // Send the message quoting the original message
    // إرسال الرسالة مع اقتباس الرسالة الأصلية
    return await sock.sendMessage(remoteJid, { text: response }, { quoted: message });
}

module.exports = {
    handle,
    Commands: ["now"], // Command to show current time / أمر لعرض الوقت الحالي
    OnlyPremium: false,
    OnlyOwner: false
};