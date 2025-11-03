const config = require("@config");
// 🇬🇧 Import main bot configuration
// 🇸🇦 استدعاء إعدادات البوت الرئيسية

const { sendImageAsSticker } = require("@lib/exif");
// 🇬🇧 Function to send an image as a WhatsApp sticker
// 🇸🇦 دالة لإرسال الصور كملصقات واتساب

const axios = require("axios");
// 🇬🇧 Import Axios library for making HTTP requests
// 🇸🇦 استدعاء مكتبة Axios لإرسال طلبات HTTP

// 🇬🇧 Map of color names to color hex codes
// 🇸🇦 خريطة تحتوي على أسماء الألوان مع رموزها
const colorMap = {
    merah: "#FF0000",   // 🇬🇧 red / 🇸🇦 أحمر
    hijau: "#00FF00",   // 🇬🇧 green / 🇸🇦 أخضر
    biru: "#0000FF",    // 🇬🇧 blue / 🇸🇦 أزرق
    kuning: "#FFFF00",  // 🇬🇧 yellow / 🇸🇦 أصفر
    hitam: "#000000",   // 🇬🇧 black / 🇸🇦 أسود
    putih: "#FFFFFF",   // 🇬🇧 white / 🇸🇦 أبيض
    abu: "#808080",     // 🇬🇧 gray / 🇸🇦 رمادي
    jingga: "#FFA500",  // 🇬🇧 orange / 🇸🇦 برتقالي
    ungu: "#800080",    // 🇬🇧 purple / 🇸🇦 بنفسجي
    pink: "#FFC0CB",    // 🇬🇧 pink / 🇸🇦 وردي
    coklat: "#A52A2A"   // 🇬🇧 brown / 🇸🇦 بني
};

// ===========================================================

async function handle(sock, messageInfo) {
    const { remoteJid, sender, message, content, isQuoted, prefix, command, pushName } = messageInfo;

    try {
        // 🇬🇧 Get text from message or quoted message
        // 🇸🇦 الحصول على النص من الرسالة أو من الرسالة المقتبسة
        const text = isQuoted?.text || content;

        // 🇬🇧 Validate input text
        // 🇸🇦 التحقق من أن المستخدم أدخل نصًا
        if (!text) {
            await sock.sendMessage(remoteJid, {
                // 🇬🇧 Send usage guide if no input
                // 🇸🇦 إرسال تعليمات الاستخدام في حال لم يُدخل المستخدم نصًا
                text: `_⚠️ Usage Format:_ \n\n_💬 Example:_ _*${prefix + command} resbot | color*_`
            }, { quoted: message });
            return; // 🇬🇧 Stop execution / 🇸🇦 إيقاف التنفيذ
        }

        // 🇬🇧 Split text and background color if provided
        // 🇸🇦 تقسيم النص ولون الخلفية إن وُجد
        const [text2, bgColorInput] = text.split('|').map(item => item.trim());

        // 🇬🇧 Check if color input is a color name or hex code
        // 🇸🇦 التحقق مما إذا كان اللون المدخل اسمًا أم كودًا
        const backgroundColor = colorMap[bgColorInput?.toLowerCase()] || bgColorInput || "#FFFFFF";

        // 🇬🇧 Send a "loading" reaction emoji
        // 🇸🇦 إرسال رمز تعبيري يشير إلى أن البوت يعالج الطلب
        await sock.sendMessage(remoteJid, {
            react: { text: "⏰", key: message.key }
        });

        // 🇬🇧 Get the user's profile picture (fallback if unavailable)
        // 🇸🇦 جلب صورة الملف الشخصي للمستخدم (مع استخدام صورة افتراضية في حال الفشل)
        const ppnyauser = await sock.profilePictureUrl(sender, 'image')
            .catch(() => 'https://telegra.ph/file/6880771a42bad09dd6087.jpg');

        // 🇬🇧 Configure JSON request for quote API
        // 🇸🇦 إعداد بيانات JSON لإرسالها إلى واجهة برمجة الاقتباسات
        const json = {
            type: "quote",
            format: "png",
            backgroundColor: backgroundColor, // 🇬🇧 background color / 🇸🇦 لون الخلفية
            width: 700,
            height: 580,
            scale: 2,
            "messages": [
                {
                    "entities": [],
                    "avatar": true,
                    "from": {
                        "id": 1,
                        "name": pushName, // 🇬🇧 sender's name / 🇸🇦 اسم المرسل
                        "photo": {
                            "url": ppnyauser // 🇬🇧 user's profile picture URL / 🇸🇦 رابط صورة الملف الشخصي
                        }
                    },
                    "text": text2, // 🇬🇧 message text / 🇸🇦 نص الرسالة
                    "replyMessage": {}
                }
            ],
        };

        // 🇬🇧 Send POST request to quote generation API
        // 🇸🇦 إرسال طلب POST إلى واجهة إنشاء صور الاقتباس
        const response = await axios.post(
            "https://bot.lyo.su/quote/generate",
            json,
            {
                headers: { "Content-Type": "application/json" },
            }
        );

        // 🇬🇧 Convert base64 image to buffer
        // 🇸🇦 تحويل الصورة من base64 إلى بيانات ثنائية (Buffer)
        const buffer = Buffer.from(response.data.result.image, "base64");

        // 🇬🇧 Send generated image as a sticker
        // 🇸🇦 إرسال الصورة الناتجة كملصق واتساب
        const options = {
            packname: config.sticker_packname, // 🇬🇧 sticker pack name / 🇸🇦 اسم حزمة الملصقات
            author: config.sticker_author      // 🇬🇧 sticker author name / 🇸🇦 اسم مؤلف الملصقات
        };

        await sendImageAsSticker(sock, remoteJid, buffer, options, message);

    } catch (error) {
        // 🇬🇧 Handle error and send error message to user
        // 🇸🇦 معالجة الخطأ وإرسال رسالة خطأ للمستخدم
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
    Commands        : ['qcstick'],   // 🇬🇧 Command name / 🇸🇦 اسم الأمر
    OnlyPremium     : false,         // 🇬🇧 Available for all users / 🇸🇦 متاح لجميع المستخدمين
    OnlyOwner       : false,         // 🇬🇧 Not restricted to owner / 🇸🇦 لا يقتصر على المالك
    limitDeduction  : 1              // 🇬🇧 Deducts one usage from daily limit / 🇸🇦 يخصم استخدامًا واحدًا من الحد اليومي
};