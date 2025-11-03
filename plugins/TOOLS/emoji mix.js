const { reply, fetchJson, getBuffer } = require("@lib/utils");
const { sendImageAsSticker } = require("@lib/exif");
const sharp = require("sharp");
const config = require("@config");

async function handle(sock, messageInfo) {
    const { m, remoteJid, message, prefix, command, content } = messageInfo;

    try {
        // Validate input / التحقق من الإدخال
        if (!content || !content.includes("+")) {
            return await reply(
                m, 
                `_⚠️ Usage Format / صيغة الاستخدام:_\n💬 *Example / مثال:* ${prefix + command} 😅+🤔`
            );
        }

        let [emoji1, emoji2] = content.split("+").map(e => e.trim());
        if (!emoji1 || !emoji2) {
            return await reply(
                m, 
                `_⚠️ Usage Format / صيغة الاستخدام:_\n💬 *Example / مثال:* ${prefix + command} 😅+🤔`
            );
        }

        // React to the message / إرسال تفاعل على الرسالة
        await sock.sendMessage(remoteJid, { react: { text: "🤌🏻", key: message.key } });

        // Fetch data from Emoji Kitchen API / جلب البيانات من API Emoji Kitchen
        const apiResponse = await fetchJson(
            `https://tenor.googleapis.com/v2/featured?key=AIzaSyAyimkuYQYF_FXVALexPuGQctUWRURdCYQ&contentfilter=high&media_filter=png_transparent&component=proactive&collection=emoji_kitchen_v5&q=${encodeURIComponent(emoji1)}_${encodeURIComponent(emoji2)}`
        );

        if (!apiResponse || !apiResponse.results || apiResponse.results.length === 0) {
            throw new Error(`❌ _No result found for emoji combination ${emoji1} and ${emoji2} / لم يتم العثور على نتيجة لتوليفة الرموز التعبيرية ${emoji1} و ${emoji2}._`);
        }

        const imageUrl = apiResponse.results[0].url;
        const imageBuffer = await getBuffer(imageUrl);
        const webpBuffer = await sharp(imageBuffer).webp().toBuffer();

        // Send sticker / إرسال الملصق
        const options = {
            packname: config.sticker_packname,
            author: config.sticker_author,
        };
        await sendImageAsSticker(sock, remoteJid, webpBuffer, options, message);
    } catch (error) {
        console.error("Error in handle function / خطأ في دالة المعالجة:", error);
        const errorMessage = error.message || "Unknown error occurred / حدث خطأ غير معروف.";
        return await reply(m, `_⚠️ Error / خطأ: ${errorMessage}_`);
    }
}

module.exports = {
    handle,
    Commands    : ["emojimix"], // Command for Emoji Kitchen / أمر توليفة الرموز التعبيرية
    OnlyPremium : false,
    OnlyOwner   : false,
    limitDeduction  : 1, // Amount of usage limit to deduct / عدد حدود الاستخدام التي سيتم خصمها
};