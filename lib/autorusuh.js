const { danger, reply, pickRandom } = require('@lib/utils');

// Databases of automatic aggressive replies
// قواعد بيانات الردود العدوانية التلقائية
const DB_IMAGE = [
    // Responses for images / ردود على الصور
    'Malah Ngirim Gambar Babi Kau',
    'Ngapain kirim gambar sini, gelud lah',
    // ... (keep all other items as-is / احتفظ بجميع العناصر الأخرى كما هي)
];

const DB_STICKER = [
    // Responses for stickers / ردود على الملصقات
    'Lo Ngirim Sticker di kira gua takut apa kontol',
    'kalo Berani sini gelud, gk usah main sticker babi',
    // ... (keep all other items as-is)
];

const DB_RUSUH = [
    // Responses when bot is mentioned / ردود عند ذكر البوت
    'Apaan lu kontol, mau gelud lawan bot?',
    'wei walaupun gue bot, gua bisa gelud ama lu babi',
    // ... (keep all other items as-is)
];

const DB_MAX = [
    // Maximum aggressive responses / الردود العدوانية القصوى
    'Apaan lu kontol, babi kau',
    'setan kau anjing',
    // ... (keep all other items as-is)
];

// Object to store chat processing status / كائن لتخزين حالة معالجة الدردشة
const processingChats = {};

/**
 * Main function to handle aggressive auto-replies
 * الدالة الرئيسية لمعالجة الردود العدوانية التلقائية
 * @param {object} sock - WhatsApp connection / اتصال واتساب
 * @param {object} messageInfo - Message details / تفاصيل الرسالة
 * @param {boolean} isQuotedMe - If the message quotes the bot / إذا كانت الرسالة اقتبست البوت
 */
async function autoRusuh(sock, messageInfo, isQuotedMe) {
    const { m, remoteJid, id, command, isQuoted, content, message, sender, pushName, type, fullText } = messageInfo;

    // Check if chat is already being processed / تحقق إذا كانت الدردشة قيد المعالجة
    if (processingChats[remoteJid]) {
        console.log(`Chat from ${remoteJid} is being processed. Waiting... / الدردشة من ${remoteJid} قيد المعالجة. الرجاء الانتظار...`);
        return; // Prevent processing multiple messages simultaneously / منع معالجة عدة رسائل في نفس الوقت
    }

    // Mark chat as processing / وضع علامة على الدردشة بأنها قيد المعالجة
    processingChats[remoteJid] = true;

    try {
        // Respond to images / الرد على الصور
        if(type == 'image') {
            await reply(m, pickRandom(DB_IMAGE));
            return;
        }

        // Respond to stickers / الرد على الملصقات
        if(type == 'sticker') {
            await reply(m, pickRandom(DB_STICKER));
            return;
        }

        // Respond when bot is mentioned / الرد عند ذكر البوت
        if(fullText.toLowerCase().includes('bot')) {
            await reply(m, pickRandom(DB_RUSUH));
            return;
        }

        // Respond aggressively if the bot is quoted / الرد بشكل عدواني إذا اقتبس المستخدم البوت
        if(isQuotedMe) {
            await reply(m, pickRandom(DB_MAX));
            return;
        }

    } catch (error) {
        // Handle errors and log / التعامل مع الأخطاء وتسجيلها
        danger(command, `Error in lib/autorusuh.js: ${error.message}`);
        await reply(m, `_Terjadi kesalahan: ${error.message}_`); // "An error occurred" / "حدث خطأ"
    } finally {
        // Remove chat from processing status / إزالة الدردشة من قائمة المعالجة
        delete processingChats[remoteJid];
    }
}

module.exports = autoRusuh;