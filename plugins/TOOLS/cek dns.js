const { reply, isURL } = require("@lib/utils");
const axios = require("axios");
const ApiAutoresbot = require("api-autoresbot");
const config = require("@config");
const mess = require("@mess");

async function handle(sock, messageInfo) {
    const { m, remoteJid, message, prefix, command, content } = messageInfo;

    try {
        // Validate input / التحقق من الإدخال
        if (!content || !isURL(content)) {
            return await reply(m, `_⚠️ Usage Format / صيغة الاستخدام:_ \n\n_💬 Example / مثال:_ _${prefix + command} https://autoresbot.com_`);
        }

        // React to the message / التفاعل مع الرسالة
        await sock.sendMessage(remoteJid, { react: { text: "🤌🏻", key: message.key } });

        // Check host using API / التحقق من المضيف باستخدام API
        const response = await axios.get('https://check-host.net/check-ping', {
            params: {
                host: content,
                max_nodes: 3
            },
            headers: {
                'Accept': 'application/json'
            }
        });

        const responseData = response.data;
        if (!responseData.ok) {
            return await reply(m, "_Failed to check host / فشل التحقق من المضيف._");
        }

        const permanentLink = responseData.permanent_link;

        // Initialize and call Autoresbot API / استدعاء API الخاص بـ Autoresbot
        const api = new ApiAutoresbot(config.APIKEY);
        const buffer = await api.getBuffer("/api/ssweb", {
            url: permanentLink,
            delay: 6000, // 6 seconds / 6 ثوانٍ
        });

        // Send screenshot / إرسال لقطة الشاشة
        await sock.sendMessage(
            remoteJid,
            {
                image: buffer,
                caption: mess.general.success,
            },
            { quoted: message }
        );
    } catch (error) {
        console.error("Error in handle function / خطأ في دالة المعالجة:", error);

        const errorMessage = error.message || "Unknown error occurred / حدث خطأ غير معروف.";
        return await sock.sendMessage(
            remoteJid,
            { text: `_Error: ${errorMessage}_` },
            { quoted: message }
        );
    }
}

module.exports = {
    handle,
    Commands: ["cekdns"], // Command to check DNS / أمر للتحقق من DNS
    OnlyPremium: false,
    OnlyOwner: false,
    limitDeduction: 1, // Number of usage limits to deduct / عدد حدود الاستخدام التي سيتم خصمها
};