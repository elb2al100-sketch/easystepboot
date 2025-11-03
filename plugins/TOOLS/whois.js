const whois = require("whois");
const { promisify } = require("util");
const { reply } = require("@lib/utils");
const { logCustom } = require("@lib/logger");

// Promisified version of whois.lookup
// نسخة Promisify من whois.lookup
const whoisLookup = promisify(whois.lookup);

// Function to extract domain from URL
// دالة لاستخراج اسم النطاق من الرابط
function extractDomain(url) {
    try {
        // Use URL object to remove protocol
        // استخدام كائن URL لإزالة البروتوكول
        const formattedUrl = url.startsWith("http") ? new URL(url).hostname : url;
        return formattedUrl.replace(/^www\./, ""); // Remove "www." if present / إزالة "www." إذا وُجد
    } catch {
        return null; // Return null if not a valid URL / إعادة null إذا لم يكن رابط صالح
    }
}

async function handle(sock, messageInfo) {
    const { m, remoteJid, message, prefix, command, content } = messageInfo;

    try {
        // Input validation / التحقق من الإدخال
        if (!content) {
            return await reply(m, `_⚠️ Usage:_ \n\n_💬 Example:_ _*${prefix + command} autoresbot.com*_`);
        }

        // Extract domain from input / استخراج اسم النطاق من الإدخال
        const domain = extractDomain(content);
        if (!domain) {
            return await reply(m, `_Invalid input. Example: ${prefix + command} autoresbot.com_`);
        }

        // Send loading reaction / إرسال رمز تعبيري "جارٍ التحميل"
        await sock.sendMessage(remoteJid, { react: { text: "🤌🏻", key: message.key } });

        // Process WHOIS lookup / معالجة طلب WHOIS
        const data = await whoisLookup(domain);

        // Send WHOIS result / إرسال نتائج WHOIS
        await reply(m, data || "_WHOIS data not found / لم يتم العثور على بيانات WHOIS._");
    } catch (error) {
        console.error("Error in handle function / خطأ في الدالة:", error);
        logCustom('info', content, `ERROR-COMMAND-${command}.txt`);
        await sock.sendMessage(remoteJid, { text: `_Error: ${error.message}_` }, { quoted: message });
    }
}

module.exports = {
    handle,
    Commands    : ["whois"],
    OnlyPremium : false,
    OnlyOwner   : false,
    limitDeduction  : 1, // Number of usage limits to deduct / عدد الحدود التي سيتم خصمها
};