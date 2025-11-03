const config = require("@config");
const { createUser, createServer, deleteServer, panelReady, deleteUser } = require("@lib/panel");
const { reply, random, logWithTime } = require("@lib/utils");
const axios = require("axios");

/**
 * Check if a domain is accessible / تحقق مما إذا كان النطاق متاحًا
 * @param {string} url
 * @returns {boolean}
 */
async function checkDomainAccessibility(url) {
    try {
        const response = await axios.get(url, { timeout: 5000 }); // Timeout 5 seconds / مهلة 5 ثوانٍ
        return response.status >= 200 && response.status < 300; // Success HTTP status / حالة HTTP ناجحة
    } catch (error) {
        return false; // If error, consider domain inaccessible / إذا حدث خطأ، اعتبر النطاق غير متاح
    }
}

async function handle(sock, messageInfo) {
    const { m, remoteJid, message, prefix, command } = messageInfo;

    try {
        // Check if panel is ready / تحقق مما إذا كان البانل جاهز
        if (!panelReady()) {
            const warningMessage = `
⚠️ _Panel configuration is incomplete / تكوين البانل غير مكتمل._

_Please complete the following fields:_ *PANEL_URL*, *PANEL_PLTA*, and *PANEL_ID_EGG* _in config.js / في ملف config.js._

_Make sure you are the panel owner or admin to get this information / تأكد من أنك مالك البانل أو مشرف للحصول على هذه المعلومات._`;
            return await reply(m, warningMessage.trim());
        }

        // Check domain accessibility / تحقق من إمكانية الوصول إلى النطاق
        const panelURL = config.PANEL.URL;
        const isDomainAccessible = await checkDomainAccessibility(panelURL);
        if (!isDomainAccessible) {
            const inaccessibleMessage = `❌ _Panel is not accessible / البانل غير متاح._ \n\n_Make sure domain ${panelURL} is active and reachable / تأكد من أن النطاق ${panelURL} نشط ويمكن الوصول إليه._`;
            return await reply(m, inaccessibleMessage);
        }

        // Send reaction to indicate process running / إرسال رد فعل لإظهار أن العملية جارية
        await sock.sendMessage(remoteJid, { react: { text: "🤌🏻", key: message.key } });

        // Generate testing user data / إنشاء بيانات مستخدم تجريبي
        const email = `testingpanel${random(4)}@gmail.com`;
        const username = `testingpanel${random(4)}`;
        const password = random();

        // Create testing user / إنشاء مستخدم تجريبي
        const userResult = await createUser(email, username, password);
        if (!userResult) throw new Error("Failed to create testing user / فشل في إنشاء مستخدم تجريبي.");
        const userId = userResult.attributes.id;

        // Define server resources / تحديد موارد السيرفر
        const resources = {
            memory: 1024,
            swap: 0,
            disk: config.PANEL.default_disk || 10240,
            io: 500,
            cpu: config.PANEL.cpu_default || 200,
        };

        // Create server for testing user / إنشاء سيرفر للمستخدم التجريبي
        const serverName = username;
        const serverResult = await createServer(serverName, userId, resources);
        if (!serverResult) {
            await deleteUser(userId); // Delete user if server creation fails / حذف المستخدم إذا فشل إنشاء السيرفر
            throw new Error("Failed to create server for testing user / فشل في إنشاء السيرفر للمستخدم التجريبي.");
        }

        logWithTime("PANEL", `Successfully created server / تم إنشاء السيرفر بنجاح`);
        const serverId = serverResult.attributes.id;

        // Delete server and user / حذف السيرفر والمستخدم
        await deleteServer(serverId);
        logWithTime("PANEL", `Successfully deleted server - ${serverId} / تم حذف السيرفر بنجاح - ${serverId}`);

        await deleteUser(userId);
        logWithTime("PANEL", `Successfully deleted user - ${userId} / تم حذف المستخدم بنجاح - ${userId}`);

        const successMessage = `✅ _Panel status: Connected / حالة البانل: متصل_`;
        return await reply(m, successMessage);

    } catch (error) {
        // Default header for error message / عنوان افتراضي لرسالة الخطأ
        const errorHeader = "❌ An error occurred / حدث خطأ:\n";

        // Check if error object contains 'errors' property / تحقق مما إذا كان هناك خاصية 'errors'
        let errorDetails = "No error details available / لا توجد تفاصيل للخطأ.";
        if (error.errors && Array.isArray(error.errors)) {
            // Combine all error details into a string / دمج جميع تفاصيل الخطأ في نص واحد
            errorDetails = error.errors
                .map((err) => `- ${err.detail || "Detail not available / لا توجد تفاصيل."} (${err.code || "Code not available / لا يوجد رمز"})`)
                .join("\n");
        } else if (error.message) {
            errorDetails = error.message;
        }

        // Format error message / صياغة رسالة الخطأ
        const errorMessage = `${errorHeader}\n${errorDetails}`;

        // Send error message to user / إرسال رسالة الخطأ للمستخدم
        await sock.sendMessage(remoteJid, { text: errorMessage }, { quoted: message });
    }
}

module.exports = {
    handle,
    Commands    : ["statuspanel"],
    OnlyPremium : false,
    OnlyOwner   : true
};