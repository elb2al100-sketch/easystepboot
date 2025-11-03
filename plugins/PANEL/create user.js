const config = require("@config");
const { createUser, saveUser } = require("@lib/panel");
const { random } = require("@lib/utils");

async function handle(sock, messageInfo) {
    const { remoteJid, message, content, prefix, command } = messageInfo;

    try {
        // Validate input content / التحقق من محتوى الإدخال
        if (!content) {
            await sock.sendMessage(remoteJid, {
                text: `_⚠️ Usage Format: / صيغة الاستخدام:_ \n\n_💬 Example / مثال:_ _*${prefix + command} xxx@gmail.com pass123*_`
            }, { quoted: message });
            return;
        }

        // Split string into email and password / فصل السلسلة إلى بريد وكلمة مرور
        const [email, password] = content.split(/\s+/);

        let newPassword;
        if(password && password.length > 0) {
            newPassword = password; // Use provided password / استخدام كلمة المرور المقدمة
        } else {
            newPassword = random(5); // Generate random password if not provided / توليد كلمة مرور عشوائية إذا لم يتم توفيرها
        }

        // Validate email format / التحقق من صحة البريد الإلكتروني
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            await sock.sendMessage(remoteJid, {
                text: "_Invalid email format. Example: xxx@gmail.com_ / _صيغة البريد الإلكتروني غير صحيحة. مثال: xxx@gmail.com_"
            }, { quoted: message });
            return;
        }

        // Extract username from email / استخراج اسم المستخدم من البريد الإلكتروني
        const username = email.split('@')[0];

        // Send reaction to indicate processing / إرسال رد فعل للدلالة على بدء المعالجة
        await sock.sendMessage(remoteJid, { react: { text: "🤌🏻", key: message.key } });

        // Call createUser function to create the user / استدعاء دالة createUser لإنشاء المستخدم
        const result = await createUser(email, username, newPassword, false);

        if (result) {
            // If user created successfully, save user data / حفظ بيانات المستخدم بعد إنشائه
            await saveUser();
        }

        // Send success message to user / إرسال رسالة نجاح إلى المستخدم
        await sock.sendMessage(remoteJid, {
            text: `✅ _Panel user created successfully / تم إنشاء مستخدم لوحة التحكم بنجاح_
            
☍ _*Email:*_ ${email}
☍ _*Username:*_ ${username}
☍ _*Password:*_ ${newPassword}`
        }, { quoted: message });

    } catch (error) {
        console.error("Error in handle function:", error);

        // Collect error messages from 'errors' property if available / جمع رسائل الخطأ إذا كانت متاحة
        let errorMessage = "❌ An error occurred while creating user / حدث خطأ أثناء إنشاء المستخدم.\n";
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
                console.error("RemoteJid not available to send error message / رقم الوتساب غير متاح لإرسال رسالة الخطأ");
            }
        } catch (sendError) {
            console.error("Error sending error message:", sendError);
        }
    }
}

module.exports = {
    handle,
    Commands    : ['createuser'], // Command trigger / الأمر
    OnlyPremium : false,
    OnlyOwner   : true,
};