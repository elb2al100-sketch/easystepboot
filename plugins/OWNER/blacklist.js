const config = require("@config");
const { reply } = require("@lib/utils");
const { findUser, updateUser, addUser } = require("@lib/users");
const { isOwner } = require("@lib/users");

async function handle(sock, messageInfo) {
    const { m, prefix, remoteJid, command, content, mentionedJid, message } = messageInfo;

    try {
        // Validate empty input
        // التحقق من إدخال فارغ
        if (!content || !content.trim()) {
            return await reply(
                m,
                `_⚠️ Usage Format | صيغة الاستخدام:_ \n\n_💬 Example | مثال:_ _*${prefix + command} 628xxx*_\n\n` +
                `_Feature *blacklist* will kick user in all groups if enabled (.on detectblacklist2)_\n` +
                `_ميزة *blacklist* ستقوم بطرد المستخدم من جميع الجروبات عند تفعيلها (.on detectblacklist2)_`
            );
        }

        // Determine target number
        // تحديد الرقم المستهدف
        let targetNumber = (mentionedJid?.[0] || content).replace(/\D/g, '');
        let originalNumber = targetNumber;

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

        // Prevent blacklisting the bot number
        // منع وضع رقم البوت في القائمة السوداء
        if(`${config.phone_number_bot}@s.whatsapp.net` == targetNumber) {
            return await sock.sendMessage(
                remoteJid,
                { text: `⚠️ _Cannot blacklist bot number | لا يمكن وضع رقم البوت في القائمة السوداء_` },
                { quoted: message }
            );
        }

        // Prevent blacklisting owners
        // منع وضع مالك البوت في القائمة السوداء
        if(await isOwner(targetNumber)) {
            return await sock.sendMessage(
                remoteJid,
                { text: `⚠️ _Cannot blacklist owner number | لا يمكن وضع رقم المالك في القائمة السوداء_` },
                { quoted: message }
            );
        }

        // Get user data from database
        // جلب بيانات المستخدم من قاعدة البيانات
        const dataUser = await findUser(targetNumber);

        if (!dataUser) {
            const userData = {
                money: 0,
                role: "user",
                status: "blacklist"
            };
            // Add suffix if not present
            // إضافة النهاية إذا لم تكن موجودة
            if (!originalNumber.endsWith('@s.whatsapp.net')) {
                originalNumber += '@s.whatsapp.net';
            }
            await addUser(originalNumber, userData);

            return await reply(
                m,
                `_✅ Number ${originalNumber} has been added and successfully blacklisted! | تم إضافة الرقم ${originalNumber} وتم وضعه في القائمة السوداء بنجاح_\n\n` +
                `_⚠️ Info | معلومات: Blacklisted numbers will be detected in groups if feature is active_\n` +
                `_(on .detectblacklist)_ warning only | تحذير فقط\n` +
                `_(on .detectblacklist2)_ kick member | طرد العضو_`
            );
        }

        // Update user status to "blacklist"
        // تحديث حالة المستخدم إلى "blacklist"
        await updateUser(targetNumber, { status: "blacklist" });

        return await reply(
            m,
            `_✅ Number ${originalNumber} successfully blacklisted! | الرقم ${originalNumber} تم وضعه في القائمة السوداء بنجاح_\n\n` +
            `_⚠️ Info | معلومات: Blacklisted numbers will be detected in groups if feature is active_\n` +
            `_(on .detectblacklist)_ warning only | تحذير فقط\n` +
            `_(on .detectblacklist2)_ kick member | طرد العضو_`
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
    Commands    : ['blacklist'],
    OnlyPremium : false,
    OnlyOwner   : true
};