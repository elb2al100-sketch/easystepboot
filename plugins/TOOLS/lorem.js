const mess = require("@mess");
const { reply } = require("@lib/utils");
const moment = require("moment-timezone");
const config = require("@config");

// Function to generate random Lorem Ipsum text
// دالة لإنشاء نص Lorem Ipsum عشوائي
function loremIpsum(e) {
    // If input is not a number, default to 50 / إذا لم يكن الإدخال رقمًا، يتم استخدام 50 كافتراضي
    let t = isNaN(parseInt(e)) ? 50 : parseInt(e);
    t = Math.min(t, 500); // Limit maximum words to 500 / تحديد الحد الأقصى للكلمات بـ 500
    const r = ["Lorem", "ipsum", "dolor", "sit", "amet", "consectetur", "adipiscing", "elit", "sed", "do", "eiusmod", "tempor", "incididunt", "ut", "labore", "et", "dolore", "magna", "aliqua"];
    let n = "";
    for (let e = 0; e < t; e++) n += r[Math.floor(Math.random() * r.length)] + " ";
    return n.trim();
}

async function handle(sock, messageInfo) {
    const { m, remoteJid, message, content } = messageInfo;

    try {
        // Generate Lorem Ipsum text with the number of words from content or default 50
        // إنشاء نص Lorem Ipsum بعدد الكلمات المحدد في content أو 50 افتراضي
        const data = content ? loremIpsum(content) : loremIpsum(50);
        
        // Send the generated text
        // إرسال النص الذي تم إنشاؤه
        await reply(m, data);
        
    } catch (error) {
        console.error("Error while processing:", error);

        // Send error message
        // إرسال رسالة الخطأ
        await sock.sendMessage(
            remoteJid,
            { text: '⚠️ An error occurred / ⚠️ حدث خطأ ما' },
            { quoted: message }
        );
    }
}

module.exports = {
    handle,
    Commands    : ['lorem'], // Command to generate Lorem Ipsum text / أمر لإنشاء نص Lorem Ipsum
    OnlyPremium : false,
    OnlyOwner   : false,
};