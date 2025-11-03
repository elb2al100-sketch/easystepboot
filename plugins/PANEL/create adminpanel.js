const config = require("@config");
const { createUser, saveUser } = require("@lib/panel");

async function handle(sock, messageInfo) {
    const { remoteJid, message, content, prefix, command } = messageInfo;

    try {
        // Validate input content / التحقق من صحة المحتوى
        if (!content || !content.includes(" ")) {
            await sock.sendMessage(remoteJid, {
                text: `_⚠️ Usage format: / صيغة الاستخدام_\n\n_💬 Example:_ _*${prefix + command} xxx@gmail.com pass123*_`
            }, { quoted: message });
            return;
        }

        // Split string into email and password / فصل النص إلى بريد إلكتروني وكلمة مرور
        const [email, password] = content.split(" ");

        // Validate email format / التحقق من صحة البريد الإلكتروني
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            await sock.sendMessage(remoteJid, {
                text: "_Invalid email format. Example: xxx@gmail.com_\n_صيغة البريد الإلكتروني غير صحيحة. مثال: xxx@gmail.com_"
            }, { quoted: message });
            return;
        }

        // Extract username from email / استخراج اسم المستخدم من البريد الإلكتروني
        const username = email.split('@')[0];

        // Send reaction to indicate process is running / إرسال رد فعل ⏰ للدلالة على بدء العملية
        await sock.sendMessage(remoteJid, { react: { text: "⏰", key: message.key } });

        // Call createUser function to create admin user / استدعاء دالة createUser لإنشاء مستخدم لوحة تحكم
        const result = await createUser(email, username, password, true);

        if (result) {
            // If user created successfully, save user data / إذا تم إنشاء المستخدم بنجاح، احفظ البيانات
            await saveUser(); // Ensure saveUser correctly stores the latest data / تأكد من أن saveUser يحفظ البيانات بشكل صحيح
        }

        // Send success message after user creation / إرسال رسالة نجاح بعد إنشاء المستخدم
        await sock.sendMessage(remoteJid, {
            text: `✅ _Admin Panel user created successfully!_\n\n` +
                  `- Email: ${email}\n` +
                  `- Username: ${username}\n` +
                  `- Password: ${password}\n` +
                  `✅ _تم إنشاء مستخدم لوحة التحكم بنجاح!_\n\n` +
                  `- البريد الإلكتروني: ${email}\n` +
                  `- اسم المستخدم: ${username}\n` +
                  `- كلمة المرور: ${password}`
        }, { quoted: message });

    } catch (error) {
        console.error("Error in handle function:", error);

        // Construct error message / صياغة رسالة الخطأ
        let errorMessage = "❌ Error occurred while creating user. / حدث خطأ أثناء إنشاء المستخدم.\n";
        if (error.errors && Array.isArray(error.errors)) {
            errorMessage += "\n";
            error.errors.forEach(err => {
                errorMessage += `- ${err.detail}\n`;
            });
        }

        // Send error message to user / إرسال رسالة الخطأ للمستخدم
        try {
            if (remoteJid) {
                await sock.sendMessage(remoteJid, {
                    text: errorMessage.trim()
                }, { quoted: messageInfo?.message });
            } else {
                console.error("RemoteJid not available to send error message / لا يمكن إرسال رسالة الخطأ بدون RemoteJid");
            }
        } catch (sendError) {
            console.error("Error sending error message:", sendError);
        }
    }
}

module.exports = {
    handle,
    Commands    : ['createadminpanel'], // Command trigger / الأمر لتفعيل الوظيفة
    OnlyPremium : false,                // Not limited to premium / ليس مقتصرًا على المميزين
    OnlyOwner   : true,                 // Only bot owner can use / مقتصر على مالك البوت
};