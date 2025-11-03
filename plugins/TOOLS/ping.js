const axios = require('axios');

async function handle(sock, messageInfo) {
    const { remoteJid, message, content, sender } = messageInfo;

    const domain = "https://www.google.com";

    try {
        // First condition: If there is no content, only return local response time
        // الشرط الأول: إذا لم يكن هناك محتوى، قم فقط بإرجاع وقت الاستجابة المحلي
        if (!content) {
            const startTime = process.hrtime();
            const endTime = process.hrtime(startTime);
            const responseTime = endTime[0] + endTime[1] / 1e9;

            await sock.sendMessage(
                remoteJid,
                {
                    text: `⌬ _Response Time :_ ${responseTime.toFixed(6)} s / وقت الاستجابة`
                },
                { quoted: message }
            );
            return;
        }

        // Second condition: If there is content, perform a ping to the domain
        // الشرط الثاني: إذا كان هناك محتوى، قم بعمل ping إلى الدومين
        await sock.sendMessage(remoteJid, { react: { text: "👻", key: message.key } });

        const startTime = process.hrtime();
        await axios.get(domain);
        const endTime = process.hrtime(startTime);
        const responseTime = endTime[0] + endTime[1] / 1e9;

        await sock.sendMessage(
            remoteJid,
            {
                text: `⌬ _Response Time :_ ${responseTime.toFixed(6)} s / وقت الاستجابة\n⌬ _Ping :_ ${domain} / بينغ`
            },
            { quoted: message }
        );
    } catch (error) {
        console.error("Error in ping handler:", error);

        await sock.sendMessage(
            remoteJid,
            { text: "⚠️ An error occurred while pinging. Please try again later! / حدث خطأ أثناء تنفيذ البينغ. حاول مرة أخرى لاحقاً!" },
            { quoted: message }
        );
    }
}

module.exports = {
    handle,
    Commands: ["ping"],
    OnlyPremium: false,
    OnlyOwner: false
};