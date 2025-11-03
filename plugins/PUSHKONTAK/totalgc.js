const { groupFetchAllParticipating } = require("@lib/cache");

async function handle(sock, messageInfo) {
    const { remoteJid, message } = messageInfo;

    try {
        // Send reaction to indicate processing / إرسال رد فعل لإظهار أن العملية جارية
        await sock.sendMessage(remoteJid, { react: { text: "🤌🏻", key: message.key } });

        // Fetch all groups the bot is participating in / جلب جميع المجموعات التي يشارك فيها البوت
        const allGroups = await groupFetchAllParticipating(sock);

        // Count total groups / عد مجموع المجموعات
        const totalGroups = Object.keys(allGroups).length;

        // Initialize counters / تهيئة العدادات
        let totalCommunities = 0; // Total community groups / مجموع مجموعات المجتمع
        let totalRegularGroups = 0; // Total regular groups / مجموع المجموعات العادية
        let totalOpenGroups = 0; // Total open groups / مجموع المجموعات المفتوحة
        let totalClosedGroups = 0; // Total closed groups / مجموع المجموعات المغلقة

        // Count different types of groups / عد أنواع المجموعات
        for (const groupId in allGroups) {
            const group = allGroups[groupId];

            // Count communities / عد المجموعات المجتمعية
            if (group.isCommunity) {
                totalCommunities++;
            } else {
                totalRegularGroups++;
            }

            // Count open and closed groups / عد المجموعات المفتوحة والمغلقة
            if (group.announce) {
                totalClosedGroups++;
            } else {
                totalOpenGroups++;
            }
        }

        // Send statistics to the user / إرسال إحصائيات للمستخدم
        await sock.sendMessage(
            remoteJid,
            {
                text: `*_Group Statistics / إحصائيات المجموعات:_*\n
◧ Total Groups / إجمالي المجموعات: *${totalGroups}*
◧ Community Groups / مجموعات المجتمع: *${totalCommunities}*
◧ Regular Groups / المجموعات العادية: *${totalRegularGroups}*
◧ Open Groups / المجموعات المفتوحة: *${totalOpenGroups}*
◧ Closed Groups / المجموعات المغلقة: *${totalClosedGroups}*`,
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
    Commands: ['totalgc', 'totalgrub', 'totalgroub', 'totalgrup', 'totalgroup'],
    OnlyPremium: false,
    OnlyOwner: true
};