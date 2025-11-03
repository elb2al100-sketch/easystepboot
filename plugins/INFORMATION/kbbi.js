const ApiAutoresbot = require('api-autoresbot');
const config = require("@config");

// English: Function to remove HTML tags from text
// العربية: دالة لإزالة وسوم HTML من النص
const cleanHtml = (input) => input.replace(/<\/?[^>]+(>|$)/g, "");

// English: Helper function to send message with quoted reply
// العربية: دالة مساعدة لإرسال رسالة مع اقتباس للرسالة الأصلية
async function sendMessageWithQuote(sock, remoteJid, message, text, options = {}) {
    await sock.sendMessage(remoteJid, { text }, { quoted: message, ...options });
}

async function handle(sock, messageInfo) {
    const { remoteJid, message, content, prefix, command } = messageInfo;

    try {
        // English: Validate input
        // العربية: التحقق من صحة الإدخال
        if (!content.trim() || content.trim() === '') {
            return sendMessageWithQuote(
                sock,
                remoteJid,
                message,
                `_⚠️ Usage Format | صيغة الاستخدام:_ \n\n_💬 Example | مثال:_ _*${prefix + command} pohon*_`
            );
        }

        // English: Send "Loading" reaction
        // العربية: إرسال رد فعل "جاري التحميل"
        await sock.sendMessage(remoteJid, { react: { text: "😎", key: message.key } });

        // English: Initialize API
        // العربية: تهيئة API
        const api = new ApiAutoresbot(config.APIKEY);

        // English: Call API with the keyword
        // العربية: استدعاء API مع الكلمة المطلوبة
        const response = await api.get('/api/information/kbbi', { q: content });

        // English: Handle API response
        // العربية: معالجة استجابة API
        if (response.code === 200 && response.data) {
            const { kata, keterangan } = response.data;

            // English: Remove HTML tags from description
            // العربية: إزالة وسوم HTML من الشرح
            const bersih = cleanHtml(keterangan);

            const kbbiData = `_*Word | الكلمة:*_ ${kata}\n\n_*Meaning | المعنى:*_ ${bersih}`;

            // English: Send formatted message
            // العربية: إرسال الرسالة المنسقة
            await sendMessageWithQuote(sock, remoteJid, message, kbbiData);
        } else {
            // English: Handle empty or invalid response
            // العربية: معالجة الاستجابة الفارغة أو غير الصحيحة
            const errorMessage = response?.message || "Sorry, no response from the server. Please try again later | عذرًا، لم يتم الحصول على أي استجابة من الخادم. حاول لاحقًا.";
            await sendMessageWithQuote(sock, remoteJid, message, errorMessage);
        }
    } catch (error) {
        console.error("Error calling Autoresbot API | خطأ عند استدعاء API:", error);

        // English: Handle error and send message to user
        // العربية: معالجة الخطأ وإرسال رسالة للمستخدم
        const errorMessage = `Sorry, an error occurred while processing your request | عذرًا، حدث خطأ أثناء معالجة طلبك.\n\nError Details | تفاصيل الخطأ: ${error.message || error}`;
        await sendMessageWithQuote(sock, remoteJid, message, errorMessage);
    }
}

module.exports = {
    handle,
    Commands    : ['kbbi'],
    OnlyPremium : false,
    OnlyOwner   : false,
    limitDeduction  : 1 // English: Deduct 1 limit per use | العربية: خصم 1 من الحد عند الاستخدام
};