const ApiAutoresbot = require('api-autoresbot'); 
// 🔹 Import API library
// استدعاء مكتبة واجهة برمجة التطبيقات (API)

const config = require("@config");
// 🔹 Import configuration (API key, sticker name, etc.)
// استدعاء ملف الإعدادات (يحتوي على مفتاح API وبيانات الملصق)

const { sendImageAsSticker } = require("@lib/exif");
// 🔹 Function to send an image as a sticker
// دالة لإرسال صورة على شكل ستيكر

const { logCustom } = require("@lib/logger");
// 🔹 Custom logging function (to record errors or actions)
// دالة لتسجيل الأحداث أو الأخطاء

// ---------------------------

async function handle(sock, messageInfo) {
    const { remoteJid, message, content, isQuoted, prefix, command } = messageInfo;

    try {
        const text = content && content.trim() !== '' ? content : isQuoted?.text ?? null;
        // 🔹 Get the user's input text, or use quoted message text if available
        // جلب النص الذي أرسله المستخدم أو النص الموجود في الرسالة المقتبسة (إن وُجد)

        // Validasi input konten
        // ✅ Input content validation
        // ✅ التحقق من إدخال المستخدم
        if (!text) {
            await sock.sendMessage(remoteJid, {
                text: `_⚠️ Format Penggunaan:_ \n\n_💬 Contoh:_ _*${prefix + command} resbot*_`
                // 🟨 Indonesian: Usage format + Example
                // 🟩 English: "⚠️ Usage Format:\n💬 Example: .bratvid resbot"
                // 🟥 Arabic: "⚠️ تنسيق الاستخدام:\n💬 مثال: .bratvid resbot"
            }, { quoted: message });
            return; // Hentikan eksekusi jika tidak ada konten
                    // Stop execution if no content
                    // إيقاف التنفيذ إذا لم يتم إدخال نص
        }

        // Kirimkan pesan loading dengan reaksi emoji
        // 🔹 Send a loading reaction emoji
        // 🔹 إرسال رمز تعبيري (إيموجي) أثناء التحميل
        await sock.sendMessage(remoteJid, {
            react: { text: "🤌🏻", key: message.key }
        });

        // Bersihkan konten
        // 🔹 Clean up the text (remove newlines, encode safely)
        // 🔹 تنظيف النص (إزالة الأسطر الزائدة وترميزه بشكل آمن)
        const sanitizedContent = encodeURIComponent(text.trim().replace(/\n+/g, " "));

        // Buat instance API dan ambil data dari endpoint
        // 🔹 Create API instance and fetch data from endpoint
        // 🔹 إنشاء اتصال بواجهة API وجلب البيانات من المسار المحدد
        const api = new ApiAutoresbot(config.APIKEY);
        const buffer = await api.getBuffer('/api/maker/bratvid', { text: sanitizedContent });
        // مثال للرابط الناتج:
        // https://api.autoresbot.com/api/maker/bratvid?apikey=APIKEY&text=Hello%20World
        // Example: جلب فيديو مخصص بناءً على النص الذي أرسله المستخدم

        const options = {
            packname: config.sticker_packname,
            author: config.sticker_author,
            // معلومات الملصق (اسم الحزمة والمؤلف)
        };

        // Kirim stiker
        // 🔹 Send the generated sticker to the user
        // 🔹 إرسال الملصق الناتج إلى المستخدم
        await sendImageAsSticker(sock, remoteJid, buffer, options, message);

    } catch (error) {
        logCustom('info', content, `ERROR-COMMAND-${command}.txt`);
        // 🔹 Log the error with the command name
        // 🔹 تسجيل الخطأ في ملف خاص باسم الأمر

        // Tangani kesalahan dan kirimkan pesan error ke pengguna
        // 🔹 Handle error and send an error message to user
        // 🔹 التعامل مع الخطأ وإرسال رسالة تنبيه للمستخدم
        const errorMessage = `Maaf, terjadi kesalahan saat memproses permintaan Anda. Coba lagi nanti.\n\nError: ${error.message}`;
        // 🟨 Indonesian: "Sorry, an error occurred while processing your request. Try again later."
        // 🟩 English: "Sorry, an error occurred while processing your request. Please try again later."
        // 🟥 Arabic: "عذرًا، حدث خطأ أثناء معالجة طلبك. يرجى المحاولة لاحقًا."

        await sock.sendMessage(remoteJid, {
            text: errorMessage
        }, { quoted: message });
    }
}

// ---------------------------

module.exports = {
    handle,
    Commands    : ['bratvid'], 
    // اسم الأمر الذي يُستدعى في البوت (مثل .bratvid)
    OnlyPremium : false,       
    // لا يتطلب حساب بريميوم
    OnlyOwner   : false,       
    // لا يتطلب صلاحية المالك
    limitDeduction  : 1        
    // خصم 1 نقطة من الحد اليومي للمستخدم (إن وُجد نظام نقاط)
};