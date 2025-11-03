// Import configuration and the "moment" library for date calculations
// استيراد ملف الإعدادات ومكتبة "moment" لحساب العمر من التواريخ
const config = require('@config');
const moment = require('moment'); // تأكد من تثبيت moment باستخدام الأمر: npm install moment

// Main handler function / الدالة الرئيسية لمعالجة الأمر
async function handle(sock, messageInfo) {
    const { 
        remoteJid,   // Chat ID / رقم المحادثة
        message,     // Message object / كائن الرسالة
        fullText,    // Full command text / النص الكامل للأمر
        content,     // Message content / محتوى الرسالة
        prefix,      // Command prefix / بادئة الأمر
        command      // Command name / اسم الأمر
    } = messageInfo;

    // ⚠️ Check if the user provided a date
    // ⚠️ التحقق مما إذا كان المستخدم قد أدخل تاريخ ميلاده
    if (!content) {
        return sock.sendMessage(
            remoteJid,
            {
                text: `_⚠️ Format Penggunaan:_ \n\n_💬 Contoh:_ _*${prefix + command} 12/01/2005*_`, 
                // Usage example / مثال على طريقة الاستخدام الصحيحة
            },
            { quoted: message } // Reply to the user's message / الرد على رسالة المستخدم
        );
    }

    // 📆 Extract the date from the text after the command
    // 📆 استخراج التاريخ من النص بعد الأمر
    const args = fullText.replace(prefix + command, '').trim();
    const birthDate = moment(args, 'DD/MM/YYYY', true); // Parse as DD/MM/YYYY / تحليل التاريخ بالتنسيق اليوم/الشهر/السنة

    // ❌ Validate the entered date format
    // ❌ التحقق من صحة تنسيق التاريخ المدخل
    if (!birthDate.isValid()) {
        return sock.sendMessage(
            remoteJid,
            {
                text: `_❌ Format tanggal tidak valid! Gunakan format: DD/MM/YYYY_\n\n_Contoh:_ *${prefix + command} 12/01/2005*`,
                // Invalid format message / رسالة خطأ لتنسيق غير صحيح
            },
            { quoted: message }
        );
    }

    // ⏳ Calculate the user's age
    // ⏳ حساب عمر المستخدم بناءً على التاريخ الحالي
    const now = moment(); // Current date / التاريخ الحالي
    const age = now.diff(birthDate, 'years'); // Age in years / العمر بالسنوات
    const months = now.diff(birthDate, 'months') % 12; // Remaining months / الأشهر المتبقية بعد السنوات الكاملة

    // 🧾 Create the response text
    // 🧾 إنشاء نص الرد المنسق
    const responseText = `📅 Umur kamu adalah *${age} tahun ${months} bulan*\n🗓️ Tanggal lahir: *${birthDate.format('DD MMMM YYYY')}*\n\n📜 _عمرك هو ${age} سنة و${months} شهرًا_\n📅 _تاريخ ميلادك: ${birthDate.format('DD MMMM YYYY')}_`;

    try {
        // ✉️ Send the formatted age result back to the user
        // ✉️ إرسال نتيجة الحساب إلى المستخدم
        await sock.sendMessage(remoteJid, { text: responseText }, { quoted: message });
    } catch (error) {
        // ❌ Handle any sending errors
        // ❌ التعامل مع أي خطأ أثناء إرسال الرسالة
        console.error('Error sending message:', error);
    }
}

// Export the module configuration for the bot command
// تصدير إعدادات الوحدة (اسم الأمر وخياراته)
module.exports = {
    handle,                 // Main function / الدالة الأساسية
    Commands    : ["cekumur"], // Command trigger name / اسم الأمر المستخدم في البوت
    OnlyPremium : false,       // Accessible to all users / متاح لجميع المستخدمين
    OnlyOwner   : false        // Not restricted to the owner / غير مقتصر على الأونر فقط
};