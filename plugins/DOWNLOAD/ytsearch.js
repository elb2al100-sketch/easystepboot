const yts = require('yt-search');
// YouTube search library / مكتبة البحث في YouTube
const { logCustom } = require("@lib/logger");
// Logger / مسجل الأخطاء

/**
 * Send a message quoting the original message
 * إرسال رسالة مقتبسة
 */
async function sendMessageWithQuote(sock, remoteJid, message, text) {
    await sock.sendMessage(remoteJid, { text }, { quoted: message });
}

/**
 * Main handler for YouTube search command
 * الدالة الرئيسية لمعالجة أمر البحث في YouTube
 */
async function handle(sock, messageInfo) {
    const { remoteJid, message, content, prefix, command } = messageInfo;

    try {
        // Validate input / التحقق من صحة المدخلات
        if (!content.trim() || content.trim() == '') {
            return sendMessageWithQuote(
                sock,
                remoteJid,
                message,
                `_⚠️ Format Usage / صيغة الاستخدام:_ \n\n_💬 Example / مثال:_ _*${prefix + command} matahariku*_`
            );
        }

        // Show "Loading" reaction / عرض رد فعل أثناء المعالجة
        await sock.sendMessage(remoteJid, { react: { text: "😎", key: message.key } });

        // Perform YouTube search using yts / إجراء البحث في YouTube باستخدام yts
        const search = await yts(content);

        // Compose search result text / صياغة نص نتائج البحث
        let teks = `*YouTube Search / نتائج بحث YouTube*\n\nResult for / النتائج عن: _${content}_\n\n`;
        let no = 1;

        for (let video of search.all) {
            teks += `⭔ No / الرقم: ${no++}\n` +
                    `⭔ Type / النوع: ${video.type}\n` +
                    `⭔ Video ID / معرف الفيديو: ${video.videoId}\n` +
                    `⭔ Title / العنوان: ${video.title}\n` +
                    `⭔ Views / المشاهدات: ${video.views}\n` +
                    `⭔ Duration / المدة: ${video.timestamp}\n` +
                    `⭔ Upload At / تاريخ الرفع: ${video.ago}\n` +
                    `⭔ URL / الرابط: ${video.url}\n\n` +
                    `─────────────────\n\n`;
        }

        // Send search results / إرسال نتائج البحث
        await sock.sendMessage(remoteJid, { 
            image: { url: search.all[0].thumbnail }, 
            caption: teks 
        }, { quoted: message });

    } catch (error) {
        console.error("Error while searching YouTube / خطأ أثناء البحث في YouTube:", error);
        logCustom('info', content, `ERROR-COMMAND-${command}.txt`);

        // Handle errors and notify user / معالجة الأخطاء وإعلام المستخدم
        const errorMessage = `Sorry, an error occurred while processing your request. Please try again later. / عذراً، حدث خطأ أثناء معالجة طلبك. يرجى المحاولة لاحقاً.\n\nError Details / تفاصيل الخطأ: ${error.message || error}`;
        await sendMessageWithQuote(sock, remoteJid, message, errorMessage);
    }
}

module.exports = {
    handle,
    Commands    : ['yts', 'ytsearch'], // Commands handled by this module / الأوامر التي يعالجها هذا الهاندلر
    OnlyPremium : false,
    OnlyOwner   : false,
    limitDeduction  : 1, // Number of limits to deduct / عدد الخصومات من الحد اليومي
};