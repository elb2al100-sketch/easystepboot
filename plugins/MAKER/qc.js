const ApiAutoresbot = require('api-autoresbot'); 
// 🔹 Import API Autoresbot
// استدعاء مكتبة API Autoresbot المسؤولة عن إنشاء الصور / الملصقات

const config = require("@config");
// 🔹 Import configuration (contains API key, sticker pack info, etc.)
// استدعاء ملف الإعدادات الذي يحتوي على مفتاح API ومعلومات الحزمة

const { getProfilePictureUrl } = require("@lib/cache");
// 🔹 Function to get user's profile picture
// دالة للحصول على صورة الملف الشخصي للمستخدم

const { sendImageAsSticker } = require("@lib/exif");
// 🔹 Function to send image as sticker
// دالة لإرسال صورة على شكل ستيكر في واتساب

// ---------------------------

async function handle(sock, messageInfo) {
    const { remoteJid, message, sender, content, isQuoted, prefix, command, pushName } = messageInfo;

    try {
        const text = content && content.trim() !== '' ? content : isQuoted?.text ?? null;
        // 🔹 Get the text from the message or quoted message
        // 🔹 الحصول على النص من الرسالة أو من الرسالة المقتبسة إذا كانت موجودة

        // Validasi input konten
        // ✅ Validate user input
        // ✅ التحقق من إدخال المستخدم
        if (!text) {
            await sock.sendMessage(remoteJid, {
                text: `_⚠️ Format Penggunaan:_ \n\n_💬 Contoh:_ _*${prefix + command} resbot*_`
                // 🟨 Indonesian: "⚠️ Usage format:\n💬 Example: .qc resbot"
                // 🟩 English: "⚠️ Usage format:\n💬 Example: .qc resbot"
                // 🟥 Arabic: "⚠️ تنسيق الاستخدام:\n💬 مثال: .qc resbot"
            }, { quoted: message });
            return; // Hentikan eksekusi jika tidak ada konten
                    // Stop execution if no content
                    // إيقاف التنفيذ إذا لم يُدخل المستخدم نصًا
        }

        // Kirimkan pesan loading dengan reaksi emoji
        // 🔹 Send loading reaction emoji
        // 🔹 إرسال رمز تعبيري للإشارة إلى أن العملية جارية
        await sock.sendMessage(remoteJid, {
            react: { text: "🤌🏻", key: message.key }
        });

        // 🔹 Get user profile picture
        // 🔹 جلب صورة الملف الشخصي للمستخدم
        const ppUser = await getProfilePictureUrl(sock, sender);

        // Buat instance API dan ambil data dari endpoint
        // 🔹 Create API instance and fetch image data from endpoint
        // 🔹 إنشاء اتصال بواجهة API Autoresbot للحصول على الصورة المطلوبة
        const api = new ApiAutoresbot(config.APIKEY);
        const buffer = await api.getBuffer('/api/maker/qc', { 
            name : pushName,   // اسم المستخدم (الاسم المعروض)
            pp : ppUser,       // رابط صورة الملف الشخصي
            text: text         // النص الذي أرسله المستخدم
        });

        const options = {
            packname: config.sticker_packname, // اسم حزمة الملصقات
            author: config.sticker_author,     // اسم المؤلف
        };

        // Kirim stiker
        // 🔹 Send the generated image as sticker
        // 🔹 إرسال الصورة الناتجة إلى المستخدم على شكل ستيكر
        await sendImageAsSticker(sock, remoteJid, buffer, options, message);

    } catch (error) {
        console.log(error);
        // Tangani kesalahan dan kirimkan pesan error ke pengguna
        // 🔹 Handle any errors and notify the user
        // 🔹 معالجة الخطأ وإبلاغ المستخدم برسالة واضحة
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
    Commands    : ['qc'],    
    // اسم الأمر الذي يستدعي هذا الكود (.qc)
    OnlyPremium : false,     
    // لا يتطلب حساب بريميوم
    OnlyOwner   : false      
    // لا يتطلب صلاحية المالك (أي يمكن لأي مستخدم استعماله)
};