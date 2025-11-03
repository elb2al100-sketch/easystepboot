const config = require("@config");
const { createServer, findUserByEmail, panelReady, saveServer } = require("@lib/panel");
const { reply } = require("@lib/utils");

/**
 * Validate email / التحقق من صحة البريد الإلكتروني
 * @param {string} email
 * @returns {string|null} Error message or null if valid / رسالة خطأ أو null إذا كان صحيح
 */
function validateEmail(email) {
    if (!email) 
        return "_Format: *.createserver email ram cpu nowa(optional)*_ \n\nExample / مثال : _*.createserver xxx@gmail.com 2 unlimited 6285246154386*_";
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email) 
        ? null 
        : "_Invalid email format. Example: xxx@gmail.com_\n_صيغة البريد الإلكتروني غير صحيحة. مثال: xxx@gmail.com_";
}

/**
 * Validate resource (RAM or CPU) / التحقق من صحة الموارد (RAM أو CPU)
 * @param {string} value
 * @param {string} name
 * @returns {string|null} Error message or null if valid / رسالة خطأ أو null إذا كان صحيح
 */
function validateResource(value, name) {
    if (!value || (isNaN(value) && value.toLowerCase() !== "unlimited")) {
        return `_Enter ${name} as a positive number or 'unlimited'_ / _ادخل ${name} كرقم موجب أو 'unlimited'_`;
    }
    if (!isNaN(value) && parseFloat(value) <= 0) {
        return `_Enter ${name} as a positive number or 'unlimited'_ / _ادخل ${name} كرقم موجب أو 'unlimited'_`;
    }
    return null;
}

async function handle(sock, messageInfo) {
    const { m, remoteJid, message, content, prefix, command } = messageInfo;

    try {

        // Check if panel is ready / التحقق من أن لوحة التحكم جاهزة
        if(!panelReady()){
            return await reply(m, '⚠️ _Panel configuration is not complete._\n\n_Please complete:_ *PANEL_URL*, *PANEL_PLTA*, and *PANEL_ID_EGG* _in config.js_\n\n_Make sure you are the panel owner or admin to get this info_\n⚠️ _لم يتم تكوين لوحة التحكم بعد._\n\n_اكمل الأقسام:_ *PANEL_URL*, *PANEL_PLTA*, و *PANEL_ID_EGG* _في ملف config.js_\n\n_تأكد أنك مالك أو مدير لوحة التحكم للحصول على هذه المعلومات_')
        }

        // Split content into parameters / فصل المحتوى إلى المعطيات
        const [email, ram, cpu, nowa] = content.split(" ");

        // Validate email / التحقق من صحة البريد الإلكتروني
        const emailError = validateEmail(email);
        if (emailError) {
            await sock.sendMessage(remoteJid, { text: emailError }, { quoted: message });
            return;
        }

        // Validate RAM and CPU / التحقق من صحة RAM و CPU
        const ramError = validateResource(ram, "RAM");
        if (ramError) {
            await sock.sendMessage(remoteJid, { text: ramError }, { quoted: message });
            return;
        }

        const cpuError = validateResource(cpu, "CPU");
        if (cpuError) {
            await sock.sendMessage(remoteJid, { text: cpuError }, { quoted: message });
            return;
        }

        // Send reaction 🤌🏻 to indicate processing / إرسال رد فعل 🤌🏻 للدلالة على بدء العملية
        await sock.sendMessage(remoteJid, { react: { text: "🤌🏻", key: message.key } });

        // Get user data by email / جلب بيانات المستخدم باستخدام البريد الإلكتروني
        const user = await findUserByEmail(email);
        if(!user) {
            return await reply(m, `⚠️ _User with email ${email} not found_\n\n_Create a user using *.createuser*_ / _لم يتم العثور على المستخدم بالبريد الإلكتروني ${email}_\n\n_انشئ مستخدم باستخدام *.createuser*_`)
        }

        const { id, username } = user.attributes;

        const serverName = `${username} - ${ram}`;
        const memory = isNaN(ram) ? 0 : 1024 * parseFloat(ram);

        const resources = {
            memory,
            swap: 0,
            disk: config.PANEL.default_disk,
            io: 500,
            cpu: config.PANEL.cpu_default,
        };

        // Create server / إنشاء الخادم
        const server = await createServer(serverName, id, resources);

        if(server) {
            await saveServer(); // Save server data / حفظ بيانات الخادم
        }

        if (nowa) {
            // Add '@s.whatsapp.net' if not exists / أضف '@s.whatsapp.net' إذا لم يكن موجود
            const remoteJid_User = nowa.endsWith('@s.whatsapp.net') ? nowa : nowa + '@s.whatsapp.net';
            const sendToUser = `📋 _Your Panel Info / معلومات لوحة التحكم_\n
☍ _*ID:*_ ${server.attributes.id}
☍ _*Name:*_ ${server.attributes.name}
☍ _*Status:*_ ${server.attributes.status}

☍ _*Link:*_ ${config.PANEL.URL}/server/${server.attributes.identifier}`;

            await sock.sendMessage(remoteJid_User, { text: sendToUser });
        }

        const messageText = server
            ?  "✅ _Panel server created successfully_ / ✅ _تم إنشاء خادم لوحة التحكم بنجاح_"
            : "❌ _Failed to create server_ / ❌ _فشل إنشاء الخادم_";
        await sock.sendMessage(remoteJid, { text: messageText }, { quoted: message });

    } catch (error) {
        console.error("Error in handle function:", error);

        // Format error message / صياغة رسالة الخطأ
        const header = "❌ An error occurred: / حدث خطأ:\n";
        const errorDetails = error.errors?.map(err => `- ${err.detail}`).join("\n") || error.message || "No error details / لا توجد تفاصيل للخطأ.";

        const errorMessage = `${header}\n${errorDetails}`;

        // Send error message to user / إرسال رسالة الخطأ للمستخدم
        await sock.sendMessage(remoteJid, { text: errorMessage }, { quoted: message });
    }
}

module.exports = {
    handle,
    Commands    : ["createserver"], // Command / الأمر
    OnlyPremium : false,
    OnlyOwner   : true
};