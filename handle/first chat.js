// Set to track senders who have already received a response / مجموعة لتتبع المرسلين الذين تم الرد عليهم مسبقاً
const respondedSenders  = new Set();

// Import greeting function / استيراد دالة التحية
const { getGreeting }   = require('@lib/utils');

// Main processing function / الدالة الرئيسية لمعالجة الرسائل
async function process(sock, messageInfo) {
    const { sender, remoteJid, isGroup, message, pushName, fullText } = messageInfo;

    // COMMENT THIS TO ACTIVATE / علق هذا لتفعيل الميزة
    return true;

    const salam = getGreeting(); // Get greeting text / الحصول على نص التحية
    if (isGroup) return true; // Ignore if message is from a group / تجاهل الرسائل من المجموعات
    if (pushName == 'Unknown') return true; // Ignore if sender name is unknown / تجاهل إذا كان اسم المرسل غير معروف
    if (!fullText) return true; // Ignore if no text / تجاهل إذا لم يكن هناك نص
    if (["batu", "kertas", "gunting"].includes(fullText.toLowerCase())) return; 
    // Ignore "rock, paper, scissors" messages / تجاهل رسائل "حجر، ورقة، مقص"

    if (remoteJid == 'status@broadcast') return true; // Ignore status/story messages / تجاهل القصص أو الستوري

    // Check if sender has already received a response / التحقق مما إذا كان المرسل قد تم الرد عليه مسبقًا
    if (respondedSenders.has(sender)) return true;

    const response = `🌟 _*Pesan Otomatis*_ 🌟 

👋 _${salam}_ _Kak_ *${pushName}*, _Nomor ini adalah nomor bot yang tersedia untuk di sewa pada sebuah grub._

⚠️ _Kami sangat melarang jika bot kami digunakan untuk tindak penipuan atau kegiatan ilegal lainnya._

_*Informasi lebih lanjut*_
📞 Owner : https://wa.me/6285246154386?text=sewabot+4.0
💻 Website : https://autoresbot.com
👉 Saluran : https://whatsapp.com/channel/0029VabMgUy9MF99bWrYja2Q`;
// Response message template / قالب رسالة الرد التلقائي

    try {
        // Send response message to sender / إرسال رسالة الرد إلى المرسل
        await sock.sendMessage(sender, { text: response }, { quoted: message });

        // Mark sender as already responded / وضع علامة على المرسل بأنه تم الرد عليه
        respondedSenders.add(sender);
    } catch (error) {
        console.error("Error in first chat process:", error); 
        // Log any errors / تسجيل أي أخطاء
    }

    return true; // Continue to next plugin / الاستمرار إلى البرنامج المساعد التالي
}

// Export the plugin module / تصدير وحدة البرنامج المساعد
module.exports = {
    name: "First Chat", // Plugin name / اسم البرنامج المساعد
    priority: 10, // Plugin priority / أولوية البرنامج المساعد
    process, // Process function / دالة المعالجة
};