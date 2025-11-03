// Function to determine which Azan audio to play / دالة لتحديد أي صوت أذان سيتم تشغيله
function getGreeting() {
    const now = new Date();
    const utcHours = now.getUTCHours(); // Current hour in UTC / الساعة الحالية بتوقيت UTC
    const wibHours = (utcHours + 7) % 24; // Convert to WIB / تحويل إلى توقيت WIB (UTC+7)

    // Select audio file based on hour / تحديد ملف الصوت بناءً على الساعة
    let fileName;
    if (wibHours >= 3 && wibHours <= 5) {
        fileName = 'https://api.autoresbot.com/mp3/azan-subuh.m4a'; // Azan Fajr / أذان الفجر
    } else {
        fileName = 'https://api.autoresbot.com/mp3/azan-umum.m4a'; // General Azan / أذان عام
    }
    return fileName;
}

// Handle function for 'azan' command / دالة معالجة أمر 'azan'
async function handle(sock, messageInfo) {
    const { remoteJid, message } = messageInfo;

    try {
        // Send reaction to indicate processing / إرسال رد فعل 🕌
        await sock.sendMessage(remoteJid, { react: { text: "🕌", key: message.key } });

        // Get the audio URL based on current time / الحصول على رابط صوتي حسب الوقت الحالي
        const audioUrl = getGreeting();

        // Send Azan audio to user / إرسال صوت الأذان للمستخدم
        await sock.sendMessage(remoteJid, {
            audio: { url: audioUrl },
            mimetype: 'audio/mp4'
        }, { quoted: message });
    } catch (e) {
        // Send error reaction if failed / إرسال رد فعل ⛔ إذا فشل الإرسال
        return await sock.sendMessage(remoteJid, { react: { text: "⛔", key: message.key } });
    }
}

// Export module / تصدير الوحدة
module.exports = {
    handle,
    Commands    : ['azan'],  // Command name / اسم الأمر
    OnlyPremium : false,     // Accessible to all users / متاح لجميع المستخدمين
    OnlyOwner   : false      // Not restricted to bot owner / غير مقيد بالمالك
};