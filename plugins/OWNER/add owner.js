// Import utility functions
// استيراد الدوال المساعدة
const { reply } = require("@lib/utils");
const { addOwner } = require("@lib/users");

async function handle(sock, messageInfo) {
    const { m, prefix, command, content } = messageInfo;

    // Validate empty input
    // التحقق من المدخلات الفارغة
    if (!content || !content.trim()) {
        return await reply(
            m,
            `⚠️ _Please enter a valid format_\n_💬 Example:_ *${prefix + command} 628xxx*\n⚠️ _الرجاء إدخال تنسيق صحيح_\n_💬 مثال:_ *${prefix + command} 628xxx*`
        );
    }

    // Clean input to contain only numbers
    // تنظيف الرقم ليحتوي على أرقام فقط
    const ownerNumber = content.replace(/\D/g, ''); // Remove non-digit characters
    // إزالة الأحرف غير الرقمية

    // Validate number format (10-15 digits)
    // التحقق من صحة الرقم (من 10 إلى 15 رقمًا)
    if (!/^\d{10,15}$/.test(ownerNumber)) {
        return await reply(
            m,
            `⚠️ _Invalid number. Make sure the format is correct_\n_💬 Example:_ *${prefix + command} 628xxx*\n⚠️ _رقم غير صالح. تأكد من صحة التنسيق_\n_💬 مثال:_ *${prefix + command} 628xxx*`
        );
    }

    // Add number to owner list
    // إضافة الرقم إلى قائمة المالكين
    try {
        const result = addOwner(ownerNumber);
        if (result) {
            return await reply(
                m,
                `✅ _Number ${ownerNumber} successfully added as owner_\n✅ _تمت إضافة الرقم ${ownerNumber} كمالك بنجاح_`
            );
        } else {
            return await reply(
                m,
                `⚠️ _Number ${ownerNumber} is already in the owner list_\n⚠️ _الرقم ${ownerNumber} موجود بالفعل في قائمة المالكين_`
            );
        }
    } catch (error) {
        console.error('Error adding owner:', error);
        return await reply(
            m,
            `⚠️ _An error occurred while processing the request_\n⚠️ _حدث خطأ أثناء معالجة الطلب_`
        );
    }
}

module.exports = {
    handle,
    Commands    : ['addowner'], // Command name
    OnlyPremium : false,
    OnlyOwner   : true
};