const { groupFetchAllParticipating } = require("@lib/cache");

async function handle(sock, messageInfo) {
    const { remoteJid, message } = messageInfo;

    try {
        // Send reaction to indicate processing / إرسال رد فعل لإظهار أن العملية جارية
        await sock.sendMessage(remoteJid, { react: { text: "🤌🏻", key: message.key } });

        // Fetch all groups the bot is participating in / جلب جميع المجموعات التي يشارك فيها البوت
        const allGroups = await groupFetchAllParticipating(sock);

        // Initialize counters / تهيئة العدادات
        let totalCommunities = 0; // Total community groups / مجموع مجموعات المجتمع
        let totalRegularGroups = 0; // Total regular groups / مجموع المجموعات العادية

        // Count different types of groups / عد أنواع المجموعات
        for (const groupId in allGroups) {
            const group = allGroups[groupId];

            // Count communities / عد المجموعات المجتمعية
            if (group.isCommunity) {
                totalCommunities++;
            } else {
                totalRegularGroups++;
            }
        }

        // Send total regular groups / إرسال إجمالي المجموعات العادية
        await sock.sendMessage(
            remoteJid,
            {
                text: `◧ Total Regular Groups / إجمالي المجموعات العادية: *${totalRegularGroups}*`,
            },
            { quoted: message }
        );
    } catch (error) {
        // Log error and notify user / تسجيل الخطأ وإبلاغ المستخدم
        console.error("Error in handle function / خطأ في دالة المعالجة:", error);
        await sock.sendMessage(
            remoteJid,
            { text: "_⚠️ An error occurred while processing the command / حدث خطأ أثناء معالجة الأمر._" },
            { quoted: message }
        );
    }
}

module.exports = {
    handle,
    Commands: ['totalgc2', 'totalgrub2', 'totalgroub2', 'totalgrup2', 'totalgroup2'],
    OnlyPremium: false,
    OnlyOwner: true
};