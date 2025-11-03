const config = require("@config");
// 🇬🇧 Import main bot configuration file
// 🇸🇦 استدعاء ملف إعدادات البوت الرئيسي

const { sendImageAsSticker } = require("@lib/exif");
// 🇬🇧 Function to send an image as a WhatsApp sticker
// 🇸🇦 دالة لإرسال الصور كملصقات (ستيكر) على واتساب

const { quote } = require('@scrape/quote');
// 🇬🇧 Import the quote generator function (creates quote images)
// 🇸🇦 استيراد دالة إنشاء صورة الاقتباس

// ===========================================================

async function handle(sock, messageInfo) {
    const { remoteJid, sender, message, content, isQuoted, prefix, command, pushName } = messageInfo;

    try {
        // 🇬🇧 Get the text from the message or quoted message
        // 🇸🇦 الحصول على النص من الرسالة أو من الرسالة المقتبسة
        const text = content ?? isQuoted?.text ?? null;

        // 🇬🇧 Validate input content
        // 🇸🇦 التحقق من وجود نص بعد الأمر
        if (!text) {
            await sock.sendMessage(remoteJid, {
                // 🇬🇧 Warning message if no text provided
                // 🇸🇦 رسالة تحذير إذا لم يُدخل المستخدم نصًا
                text: `_⚠️ Usage Format:_ \n\n_💬 Example:_ _*${prefix + command} resbot*_`
            }, { quoted: message });

            // 🇬🇧 Stop execution if no text provided
            // 🇸🇦 إيقاف التنفيذ إذا لم يُدخل المستخدم نصًا
            return;
        }

        // 🇬🇧 Send a loading reaction emoji
        // 🇸🇦 إرسال رمز تعبيري يدل على أن البوت يعالج الطلب
        await sock.sendMessage(remoteJid, {
            react: { text: "🤌🏻", key: message.key }
        });

        // 🇬🇧 Get user's profile picture URL (fallback to default if failed)
        // 🇸🇦 جلب صورة الملف الشخصي للمستخدم (واستخدام صورة بديلة إن فشل)
        const ppnyauser = await sock.profilePictureUrl(sender, 'image')
            .catch(() => 'https://telegra.ph/file/6880771a42bad09dd6087.jpg');

        // 🇬🇧 Generate the quote image using the quote API
        // 🇸🇦 توليد صورة الاقتباس باستخدام مكتبة quote
        const rest = await quote(text, pushName, ppnyauser);

        // 🇬🇧 Send the result as a WhatsApp sticker
        // 🇸🇦 إرسال النتيجة كملصق واتساب
        const options = {
            packname: config.sticker_packname, // 🇬🇧 Sticker pack name / 🇸🇦 اسم حزمة الملصقات
            author: config.sticker_author      // 🇬🇧 Sticker author name / 🇸🇦 اسم مؤلف الملصقات
        };

        await sendImageAsSticker(sock, remoteJid, rest.result, options, message);

    } catch (error) {
        // 🇬🇧 Handle error and send an error message
        // 🇸🇦 معالجة الخطأ وإرسال رسالة توضيحية للمستخدم
        const errorMessage =
            `Sorry, an error occurred while processing your request. Please try again later.\n\nError: ${error.message}\n\n` +
            `عذرًا، حدث خطأ أثناء معالجة طلبك. يرجى المحاولة لاحقًا.\n\nالخطأ: ${error.message}`;

        await sock.sendMessage(remoteJid, {
            text: errorMessage
        }, { quoted: message });
    }
}

// ===========================================================

module.exports = {
    handle,
    Commands        : ['qc2'],        // 🇬🇧 Command name / 🇸🇦 اسم الأمر
    OnlyPremium     : false,          // 🇬🇧 Not for premium only / 🇸🇦 متاح للجميع
    OnlyOwner       : false,          // 🇬🇧 Not owner-only / 🇸🇦 لا يقتصر على المالك
    limitDeduction  : 1               // 🇬🇧 Deducts 1 usage limit / 🇸🇦 يخصم استخدامًا واحدًا من الحد اليومي
};