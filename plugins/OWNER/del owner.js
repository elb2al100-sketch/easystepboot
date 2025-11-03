const { reply }     = require("@lib/utils");
const { delOwner }  = require("@lib/users");

async function handle(sock, messageInfo) {
    const { m, prefix, command, content } = messageInfo;

    // Validate empty input | التحقق من الإدخال الفارغ
    if (!content || !content.trim()) {
        return await reply(
            m,
            `_⚠️ Usage Format | صيغة الاستخدام:_ \n\n_💬 Example | مثال:_ _*${prefix + command} 628xxx*_`
        );
    }

    // Clean input to only numbers | تنظيف الإدخال ليكون أرقام فقط
    const ownerNumber = content.replace(/\D/g, ''); // Remove non-digit characters | إزالة الأحرف غير الرقمية

    // Validate number format (10-15 digits) | التحقق من صيغة الرقم (10-15 رقم)
    if (!/^\d{10,15}$/.test(ownerNumber)) {
        return await reply(
            m,
            `_⚠️ Invalid number. Ensure the format is correct | رقم غير صالح. تأكد من صحة الصيغة_\n\n_💬 Example | مثال: *${prefix + command} 628xxx*_`
        );
    }

    // Remove number from owner list | إزالة الرقم من قائمة المالكين
    try {
        const result = delOwner(ownerNumber);
        if (result) {
            return await reply(m, `_✅ Number ${ownerNumber} successfully removed from owner list | تم إزالة الرقم ${ownerNumber} بنجاح من قائمة المالكين._`);
        } else {
            return await reply(m, `_⚠️ Number ${ownerNumber} was already removed from owner list | الرقم ${ownerNumber} تمت إزالته مسبقًا من قائمة المالكين._`);
        }
    } catch (error) {
        console.error('Error deleting owner:', error);
        return await reply(m, `_❌ An error occurred while processing the request | حدث خطأ أثناء معالجة الطلب._`);
    }
}

module.exports = {
    handle,
    Commands    : ['delowner'],
    OnlyPremium : false,
    OnlyOwner   : true
};