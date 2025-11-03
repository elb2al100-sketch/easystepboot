const { reply } = require("@lib/utils");

async function handle(sock, messageInfo) {
    const { m, remoteJid, message, prefix, command, content } = messageInfo;

    try {
        // Check if input is empty / التحقق من وجود إدخال
        if (!content || !content.trim()) {
            return await reply(
                m,
                `_⚠️ Usage Format / صيغة الاستخدام:_\n\n📌 *${prefix + command} <number>*\n\n💬 *Example / مثال:* ${prefix + command} 201065537938`
            );
        }

        // Get and clean input / الحصول على الرقم وتنظيفه
        let phoneNumber = content.trim().replace(/[^0-9]/g, "");

        // Validate international phone number / التحقق من صحة الرقم الدولي
        if (!/^\d{10,15}$/.test(phoneNumber)) {
            return await reply(
                m,
                `_❌ Invalid number / رقم غير صالح._\nEnsure using international format without + or other characters / تأكد من استخدام الصيغة الدولية بدون + أو أي رموز أخرى. Example / مثال: 201065537938`
            );
        }

        // Ensure WhatsApp JID is valid / التأكد من صحة معرف واتساب
        const userJid = phoneNumber.includes("@s.whatsapp.net")
            ? phoneNumber
            : `${phoneNumber}@s.whatsapp.net`;

        const result = await sock.onWhatsApp(userJid);

        if (result?.[0]?.exists) {
            return await reply(m, `✅ _Number *${phoneNumber}* is registered on WhatsApp / الرقم *${phoneNumber}* مسجل على واتساب._`);
        } else {
            return await reply(m, `❌ _Number *${phoneNumber}* not found on WhatsApp / الرقم *${phoneNumber}* غير موجود على واتساب._`);
        }

    } catch (error) {
        console.error("Error in handle function / خطأ في دالة المعالجة:", error);
        const errorMessage = error?.message || "Unknown error occurred / حدث خطأ غير معروف.";
        return await sock.sendMessage(
            remoteJid,
            { text: `_⚠️ Error / خطأ: ${errorMessage}_` },
            { quoted: message }
        );
    }
}

module.exports = {
    handle,
    Commands: ["cekuser"], // Command to check if user is on WhatsApp / أمر للتحقق من وجود المستخدم على واتساب
    OnlyPremium: false,
    OnlyOwner: false,
    limitDeduction: 1, // Number of usage limits to deduct / عدد حدود الاستخدام التي سيتم خصمها
};