const { reply } = require("@lib/utils");
const { resetMemberOld } = require("@lib/users");
const { readGroup, replaceGroup } = require("@lib/group");
const { groupFetchAllParticipating } = require("@lib/cache");

async function handle(sock, messageInfo) {
    const { m, prefix, command, content, mentionedJid } = messageInfo;

    try {
        // Validate if no arguments
        // التحقق إذا لم توجد مدخلات
        if (!content || !content.trim()) {
            return await reply(
                m,
                `_⚠️ This feature will delete | هذه الميزة ستحذف:_\n` +
                `• Group data that has left the bot | بيانات المجموعات التي خرجت من البوت\n` +
                `• User data inactive for more than 30 days | بيانات المستخدمين غير النشطين لأكثر من 30 يومًا\n\n` +
                `_💡 How to use | طريقة الاستخدام:_\n*${prefix + command} -y*`
            );
        }

        if(content == '-y') {
            const allGroups = await sock.groupFetchAllParticipating();
            const activeGroupIds = Object.keys(allGroups); 

            // Get all saved group data
            // الحصول على جميع بيانات المجموعات المحفوظة
            const savedGroups = await readGroup();

            // Create a new object only with active groups
            // إنشاء كائن جديد يحتوي فقط على المجموعات النشطة
            const filteredGroups = {};
            for (const groupId of activeGroupIds) {
                if (savedGroups[groupId]) {
                    filteredGroups[groupId] = savedGroups[groupId];
                }
            }

            // Replace database content with only active groups
            // استبدال محتوى قاعدة البيانات بالمجموعات النشطة فقط
            await replaceGroup(filteredGroups);

            // Reset inactive members
            // إعادة تعيين الأعضاء غير النشطين
            await resetMemberOld();

            return await reply(
                m,
                `_✅ Successfully cleaned DB | تم تنظيف قاعدة البيانات بنجاح_`
            );
        }

    } catch (error) {
        console.error("Error handling command:", error);
        return await reply(
            m,
            `_❌ An error occurred while processing the command | حدث خطأ أثناء معالجة الأمر. يرجى المحاولة لاحقًا._`
        );
    }
}

module.exports = {
    handle,
    Commands: ['cleandb'],
    OnlyPremium: false,
    OnlyOwner: true
};