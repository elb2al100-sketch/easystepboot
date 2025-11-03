const { reply } = require("@lib/utils");
const { findUser, updateUser } = require("@lib/users");

async function handle(sock, messageInfo) {
    const { m, prefix, command, content, mentionedJid } = messageInfo;

    try {
        // Validate if input is empty
        // التحقق من أن الإدخال ليس فارغًا
        if (!content || !content.trim()) {
            return await reply(
                m,
                `⚠️ _Enter a valid format_\n⚠️ _Masukkan format yang valid_\n\n_Example: *${prefix + command} 628xxx*_`
            );
        }

        // Determine target number
        // تحديد الرقم الهدف
        let targetNumber = (mentionedJid?.[0] || content).replace(/\D/g, '');
        const originalNumber = targetNumber;

        // Validate number format (10-15 digits)
        // التحقق من صحة الرقم (10-15 رقم)
        if (!/^\d{10,15}$/.test(targetNumber)) {
            return await reply(
                m,
                `⚠️ _Invalid number. Ensure the format is correct_\n⚠️ _Nomor tidak valid. Pastikan formatnya benar_\n\n_Example: *${prefix + command} 628xxx*_`
            );
        }

        // Add @s.whatsapp.net if not present
        // إضافة @s.whatsapp.net إذا لم يكن موجودًا
        if (!targetNumber.endsWith('@s.whatsapp.net')) {
            targetNumber += '@s.whatsapp.net';
        }

        // Fetch user data from database
        // جلب بيانات المستخدم من قاعدة البيانات
        const dataUser = await findUser(targetNumber);

        // If user not found in database
        // إذا لم يتم العثور على المستخدم في قاعدة البيانات
        if (!dataUser) {
            return await reply(
                m,
                `⚠️ _Number ${originalNumber} not found in database_\n⚠️ _Nomor ${originalNumber} tidak ditemukan di database._\n\n` +
                `_Ensure the number is correct and registered in the database_\n_Pastikan nomor yang dimasukkan benar dan terdaftar dalam database._`
            );
        }

        // Update user status to "active"
        // تحديث حالة المستخدم إلى "نشط"
        await updateUser(targetNumber, { status: "active" });

        // Send success message
        // إرسال رسالة نجاح
        return await reply(
            m,
            `✅ _Number ${originalNumber} has been removed from blacklist!_\n✅ _Nomor ${originalNumber} berhasil dibuka dari blacklist!_`
        );

    } catch (error) {
        console.error("Error handling command:", error);
        // Send error message
        // إرسال رسالة خطأ
        return await reply(
            m,
            `_An error occurred while processing the request. Please try again later._\n_Terjadi kesalahan saat memproses permintaan. Silakan coba lagi nanti._`
        );
    }
}

module.exports = {
    handle,
    Commands    : ['unblacklist'],
    OnlyPremium : false,
    OnlyOwner   : true,
};