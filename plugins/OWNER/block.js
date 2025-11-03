const { reply } = require("@lib/utils");
const { findUser, updateUser } = require("@lib/users");

async function handle(sock, messageInfo) {
    const { m, prefix, command, content, mentionedJid } = messageInfo;

    try {
        // Validate empty input
        // التحقق من إدخال فارغ
        if (!content || !content.trim()) {
            return await reply(
                m,
                `_⚠️ Usage Format | صيغة الاستخدام:_ \n\n_💬 Example | مثال:_ _*${prefix + command} 628xxx*_\n\n` +
                `_Feature *block* will prevent user from using the bot in all groups and private chats_\n` +
                `_ميزة *block* ستمنع المستخدم من استخدام البوت في جميع الجروبات والدردشات الخاصة_\n\n` +
                `_Use *ban* feature to block user only in this group_\n` +
                `_استخدم ميزة *ban* لحظر المستخدم في هذا الجروب فقط_`
            );
        }

        // Determine target number
        // تحديد الرقم المستهدف
        let targetNumber = (mentionedJid?.[0] || content).replace(/\D/g, '');
        const originalNumber = targetNumber;

        // Validate number format (10-15 digits)
        // التحقق من صحة الرقم (10-15 رقم)
        if (!/^\d{10,15}$/.test(targetNumber)) {
            return await reply(
                m,
                `_⚠️ Invalid number. Make sure the format is correct | رقم غير صالح. تأكد من صحة الصيغة_\n\n` +
                `_💬 Example | مثال:_ *${prefix + command} 628xxx*_`
            );
        }

        // Add @s.whatsapp.net if missing
        // إضافة @s.whatsapp.net إذا لم يكن موجود
        if (!targetNumber.endsWith('@s.whatsapp.net')) {
            targetNumber += '@s.whatsapp.net';
        }

        // Get user data from database
        // جلب بيانات المستخدم من قاعدة البيانات
        const dataUser = await findUser(targetNumber);

        if (!dataUser) {
            return await reply(
                m,
                `_⚠️ Number ${originalNumber} not found in database | الرقم ${originalNumber} غير موجود في قاعدة البيانات_\n\n` +
                `_Make sure the number is correct and registered in the database | تأكد من أن الرقم صحيح ومُسجل في قاعدة البيانات_`
            );
        }

        // Update user status to "block"
        // تحديث حالة المستخدم إلى "block"
        await updateUser(targetNumber, { status: "block" });
        await sock.updateBlockStatus(targetNumber, "block");

        return await reply(
            m,
            `_✅ Number ${originalNumber} successfully blocked! | الرقم ${originalNumber} تم حظره بنجاح_\n\n` +
            `_⚠️ Info | معلومات: Blocked numbers cannot use any bot features until unblocked using command *${prefix}unblock*_\n` +
            `_الأرقام المحظورة لن تستطيع استخدام أي ميزة من ميزات البوت حتى يتم رفع الحظر بواسطة الأمر *${prefix}unblock*_`
        );

    } catch (error) {
        console.error("Error handling command:", error);
        return await reply(
            m,
            `_❌ An error occurred while processing the request. Please try again later | حدث خطأ أثناء معالجة الطلب. الرجاء المحاولة لاحقاً._`
        );
    }
}

module.exports = {
    handle,
    Commands    : ['block'],
    OnlyPremium : false,
    OnlyOwner   : true
};