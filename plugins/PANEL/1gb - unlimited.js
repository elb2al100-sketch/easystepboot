const config = require("@config");
const {
    createUser,       // Function to create user / دالة لإنشاء مستخدم
    createServer,     // Function to create server / دالة لإنشاء سيرفر
    findUserByEmail,  // Find user by email / البحث عن مستخدم عن طريق البريد
    panelReady,       // Check if panel is ready / التحقق من جاهزية لوحة التحكم
    saveUser,         // Save user data / حفظ بيانات المستخدم
    saveServer        // Save server data / حفظ بيانات السيرفر
} = require("@lib/panel");
const { reply, getCurrentDate, random } = require("@lib/utils"); // Utility functions / دوال مساعدة

async function handle(sock, messageInfo) {
    const { m, remoteJid, message, content, prefix, command } = messageInfo;
    const date = getCurrentDate(); // Current date / التاريخ الحالي
    const passwordRandom = random(5); // Random password for new user / كلمة مرور عشوائية للمستخدم الجديد
    let memory = 0;

    // Determine RAM memory from command / تحديد حجم الرام من الأمر
    if (command === 'unlimited') {
        memory = 0; // Unlimited RAM / رام غير محدود
    } else if (command.endsWith('gb')) {
        memory = parseFloat(command) * 1024 || 0; // Convert GB to MB / تحويل GB إلى MB
    } else {
        memory = parseFloat(command) || 0; // If just a number, use as MB / إذا كان رقم فقط اعتبره MB
    }

    try {
        // Check if panel configuration is ready / تحقق من جاهزية إعدادات اللوحة
        if (!panelReady()) {
            return await reply(
                m,
                '⚠️ _Panel configuration is not completed yet._\n' +
                '_Please fill the fields:_ *PANEL_URL*, *PANEL_PLTA*, and *PANEL_ID_EGG* _in config.js._\n' +
                '_Make sure you are the owner or admin of the panel to access this information._\n\n' +
                '⚠️ _تكوين لوحة التحكم لم يكتمل بعد._\n' +
                '_يرجى ملء الحقول: _ *PANEL_URL*, *PANEL_PLTA*, و *PANEL_ID_EGG* _في ملف config.js._\n' +
                '_تأكد من أنك مالك أو مدير اللوحة للوصول لهذه المعلومات._'
            );
        }

        // Validate input / التحقق من صحة البيانات المدخلة
        if (!content) {
            return await reply(
                m,
                `⚠️ _Invalid usage format_\n_Example: ${prefix + command} azhari,6285246154386_\n` +
                '⚠️ _صيغة الاستخدام غير صحيحة_\n_مثال: ${prefix + command} azhari,6285246154386_'
            );
        }

        // Split user input into name and WhatsApp number / فصل الاسم ورقم الواتساب
        let [nama, nowa] = content.split(",");
        if (!nama || !nowa) {
            return await reply(
                m,
                `⚠️ _Wrong format! Make sure to use: ${prefix + command} name,number_\n` +
                '⚠️ _الصيغة خاطئة! تأكد من استخدام: ${prefix + command} name,number_'
            );
        }

        const email = `${nama.trim()}@gmail.com`; // Create email from name / إنشاء بريد إلكتروني من الاسم

        // Send processing reaction / إرسال رد فعل "🤌🏻" للدلالة على بدء العملية
        await sock.sendMessage(remoteJid, { react: { text: "🤌🏻", key: message.key } });

        // Initialize user and server data / تهيئة بيانات المستخدم والسيرفر
        let user = await findUserByEmail(email);
        let id, username, newPassword;
        if (!user) {
            // Create new user if not found / إنشاء مستخدم جديد إذا لم يوجد
            const result = await createUser(email, nama, passwordRandom);
            if (!result) throw new Error("Failed to create new user. / فشل في إنشاء مستخدم جديد.");

            await saveUser(); // Save user to database / حفظ المستخدم في قاعدة البيانات
            id = result.attributes.id;
            username = result.attributes.username;
            newPassword = passwordRandom;
        } else {
            id = user.attributes.id;
            username = user.attributes.username;
        }

        // Configure server resources / إعداد موارد السيرفر
        const serverName = `${username} - ${date}`;
        const resources = {
            memory,                          // RAM memory / الرام
            swap: 0,                          // Swap memory / مساحة swap
            disk: config.PANEL.default_disk,  // Disk size / حجم القرص
            io: 500,                          // IO limit / حد IO
            cpu: config.PANEL.cpu_default     // CPU cores / عدد نوى المعالج
        };

        // Create server / إنشاء السيرفر
        const server = await createServer(serverName, id, resources);
        if (!server) throw new Error("Failed to create server. / فشل في إنشاء السيرفر.");

        await saveServer(); // Save server data / حفظ بيانات السيرفر

        // Send server info to user via WhatsApp / إرسال بيانات السيرفر للمستخدم عبر واتساب
        if (nowa) {
            nowa = nowa.trim();
            const remoteJidUser = nowa.endsWith("@s.whatsapp.net") ? nowa : `${nowa}@s.whatsapp.net`;

            const msgResult = `📋 *_Your Panel Info_*\n\n` +
                `🔑 _ID:_ ${server.attributes.id}\n` +
                `🛠️ _UUID:_ ${server.attributes.uuid}\n` +
                `👤 _Name:_ ${server.attributes.name}\n` +
                `🔧 _Status:_ ${server.attributes.status}\n\n` +
                `*Login Data*\n` +
                `📧 _Email:_ ${email}\n` +
                `🔒 _Password:_ ${newPassword || ''}\n\n` +
                `🌐 _Alternative Link:_ ${config.PANEL.URL}/server/${server.attributes.identifier}`;

            await sock.sendMessage(remoteJidUser, { text: msgResult });
        }

        // Send success notification / إرسال إشعار نجاح
        await sock.sendMessage(remoteJid, { text: "✅ _Server Panel created successfully!_\n✅ _تم إنشاء السيرفر بنجاح!_" }, { quoted: message });

    } catch (error) {
        console.error("Error in handle function:", error);

        // Format error message / صياغة رسالة الخطأ
        const header = "❌ Error occurred: / حدث خطأ:\n";
        const errorDetails = error.errors?.map(err => `- ${err.detail}`).join("\n") || error.message || "No error details. / لا توجد تفاصيل للخطأ.";
        const errorMessage = `${header}${errorDetails}`;

        // Send error message to user / إرسال رسالة الخطأ للمستخدم
        await sock.sendMessage(remoteJid, { text: errorMessage }, { quoted: message });
    }
}

// Export module / تصدير الوحدة
module.exports = {
    handle,
    Commands    : ['1gb', '2gb', '3gb', '4gb', '5gb', '6gb', '7gb', '8gb', 'unlimited'], // RAM commands / أوامر الرام
    OnlyPremium : false, // Not limited to premium / ليس مقتصر على المميزين
    OnlyOwner   : true   // Only bot owner / مقتصر على مالك البوت
};