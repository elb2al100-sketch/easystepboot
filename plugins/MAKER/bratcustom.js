const ApiAutoresbot = require("api-autoresbot");
const config = require("@config");
const { sendImageAsSticker } = require("@lib/exif");
const { logCustom } = require("@lib/logger");

// 🟢 Main function to handle the "bratcustom" command
// 🟢 الدالة الرئيسية لمعالجة أمر "bratcustom"
async function handle(sock, messageInfo) {
    const { remoteJid, message, content, isQuoted, prefix, command } = messageInfo;

    try {
        // 🟣 Get the message content or quoted text
        // 🟣 الحصول على النص من الرسالة أو من الرسالة المقتبسة
        const textContent = content ?? isQuoted?.text ?? null;

        // 🟡 Split the text by "|" → Example: "red|blue|text"
        // 🟡 تقسيم النص باستخدام الفاصل "|" → مثال: "أحمر|أزرق|النص"
        const args = textContent?.trim().split("|") || [];
        let [textColor, bgColor, ...textParts] = args;

        // 🎨 Basic color dictionary (Indonesian → Hex codes)
        // 🎨 قاموس الألوان الأساسية (من الإندونيسية إلى الأكواد السداسية)
        const basicColors = {
            merah: "ff0000", // red / أحمر
            biru: "0000ff", // blue / أزرق
            hijau: "008000", // green / أخضر
            kuning: "ffff00", // yellow / أصفر
            hitam: "000000", // black / أسود
            putih: "ffffff", // white / أبيض
            ungu: "800080", // purple / بنفسجي
            oranye: "ffa500", // orange / برتقالي
            abuabu: "808080", // gray / رمادي
            coklat: "8b4513", // brown / بني
            merahmuda: "ffc0cb", // pink / وردي
            birutua: "00008b", // dark blue / أزرق غامق
            birumuda: "87ceeb", // light blue / أزرق فاتح
            hijautua: "006400", // dark green / أخضر غامق
            hijaumuda: "90ee90", // light green / أخضر فاتح
            emas: "ffd700", // gold / ذهبي
            perak: "c0c0c0", // silver / فضي
            cyan: "00ffff",
            magenta: "ff00ff",
            lavender: "e6e6fa",
            coral: "ff7f50",
            navy: "000080",
            teal: "008080",
            lime: "00ff00",
            violet: "ee82ee",
            crimson: "dc143c",
            khaki: "f0e68c",
            salmon: "fa8072",
            chocolate: "d2691e",
            tan: "d2b48c",
            sienna: "a0522d",
            beige: "f5f5dc",
            turquoise: "40e0d0",
            indigo: "4b0082",
            slateblue: "6a5acd",
            maroon: "800000",
            olive: "808000",
            mint: "98ff98",
            ivory: "fffff0",
            peach: "ffdab9",
            aquamarine: "7fffd4",
            wheat: "f5deb3",
            plum: "dda0dd",
            orchid: "da70d6",
        };

        // 🟠 Check if the given color names exist in the color list
        // 🟠 التحقق مما إذا كانت أسماء الألوان موجودة في القائمة
        textColor = basicColors[textColor?.toLowerCase()] || textColor;
        bgColor = basicColors[bgColor?.toLowerCase()] || bgColor;

        // 🟣 Combine the remaining parts of text
        // 🟣 دمج بقية أجزاء النص بعد الألوان
        const text = textParts.join(" ").trim();

        // 🟠 Validate input (must include text)
        // 🟠 التحقق من صحة الإدخال (يجب أن يحتوي على نص)
        if (!text) {
            await sock.sendMessage(
                remoteJid,
                {
                    // 🇮🇩 "_⚠️ Format Penggunaan:_ \n\n_💬 Contoh:_ _*${prefix + command} merah|biru|resbot*_"
                    // 🇬🇧 "_⚠️ Usage Format:_ \n\n_💬 Example:_ _*${prefix + command} red|blue|resbot*_"
                    // 🇸🇦 "_⚠️ تنسيق الاستخدام:_ \n\n_💬 مثال:_ _*${prefix + command} أحمر|أزرق|النص*_"
                    text: `_⚠️ Usage Format:_ \n\n_💬 Example:_ _*${prefix + command} red|blue|resbot*_`,
                },
                { quoted: message }
            );
            return; // 🚫 Stop execution if no text provided / إيقاف التنفيذ إذا لم يوجد نص
        }

        // 🕐 Send a loading reaction emoji while processing
        // 🕐 إرسال رمز تعبيري للإشارة إلى أن العملية قيد التنفيذ
        await sock.sendMessage(remoteJid, {
            react: { text: "🤌🏻", key: message.key },
        });

        // 🧹 Clean up the text and encode it for URL
        // 🧹 تنظيف النص من الأسطر الجديدة وترميزه لإرساله للـ API
        const sanitizedContent = encodeURIComponent(text.replace(/\n+/g, " "));

        // 🌐 Create API instance and request image from endpoint
        // 🌐 إنشاء كائن API واستدعاء نقطة النهاية لجلب الصورة
        const api = new ApiAutoresbot(config.APIKEY);
        const buffer = await api.getBuffer("/api/maker/brat", {
            text: sanitizedContent,
            textColor,
            bgColor,
        });

        // 🏷️ Sticker options (pack name and author)
        // 🏷️ إعدادات الستيكر (اسم الحزمة والمؤلف)
        const options = {
            packname: config.sticker_packname,
            author: config.sticker_author,
        };

        // 🟩 Send the sticker to the user
        // 🟩 إرسال الستيكر إلى المستخدم
        await sendImageAsSticker(sock, remoteJid, buffer, options, message);
    } catch (error) {
        // 🟥 Log error and send message to user
        // 🟥 تسجيل الخطأ وإرسال رسالة خطأ للمستخدم
        logCustom("info", content, `ERROR-COMMAND-${command}.txt`);

        // 🇮🇩 "Maaf, terjadi kesalahan saat memproses permintaan Anda. Coba lagi nanti."
        // 🇬🇧 "Sorry, an error occurred while processing your request. Please try again later."
        // 🇸🇦 "عذرًا، حدث خطأ أثناء معالجة طلبك. يرجى المحاولة لاحقًا."
        const errorMessage = `Sorry, an error occurred while processing your request. Please try again later.\n\nError: ${error.message}`;

        await sock.sendMessage(
            remoteJid,
            {
                text: errorMessage,
            },
            { quoted: message }
        );
    }
}

// 🧩 Export command configuration
// 🧩 تصدير إعدادات الأمر
module.exports = {
    handle,
    Commands: ["bratcustom"],  // The command keyword / كلمة الأمر
    OnlyPremium: false,        // Not for premium only / لا يقتصر على المستخدمين المميزين
    OnlyOwner: false,          // Not owner-only / لا يقتصر على المالك فقط
};