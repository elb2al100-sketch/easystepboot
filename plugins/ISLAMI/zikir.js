const ApiAutoresbot = require("api-autoresbot");
const config = require("@config");

// Handle daily Zikir command / معالجة أمر الأذكار اليومية
async function handle(sock, messageInfo) {
  const { remoteJid, message } = messageInfo;

  try {
    // Send loading reaction / إرسال رد فعل التحميل
    await sock.sendMessage(remoteJid, {
      react: { text: "🕋", key: message.key },
    });

    const api = new ApiAutoresbot(config.APIKEY);

    // Call random Zikir API / استدعاء واجهة برمجة التطبيقات لأذكار عشوائية
    const response = await api.get("/api/islami/zikir");

    // Validate and format response / التحقق من الاستجابة وتنسيقها
    if (response?.data) {
      const zikirMessage = `_*Daily Zikir / الأذكار اليومية*_:\n\n${response.data}`;
      await sock.sendMessage(
        remoteJid,
        { text: zikirMessage },
        { quoted: message }
      );
    } else {
      // Message if no data / رسالة إذا لم توجد بيانات
      const noDataMessage =
        "Sorry, no Zikir data is available at the moment / عذراً، لا توجد بيانات أذكار متاحة حالياً. Try again later / حاول مرة أخرى لاحقاً.";
      await sock.sendMessage(
        remoteJid,
        { text: noDataMessage },
        { quoted: message }
      );
    }
  } catch (error) {
    console.error("Error calling Zikir API / خطأ أثناء استدعاء واجهة الأذكار:", error);

    // Error message to user / رسالة خطأ للمستخدم
    const errorMessage = `Sorry, an error occurred while processing your request / عذراً، حدث خطأ أثناء معالجة طلبك. Try again later / حاول مرة أخرى لاحقاً.\n\nError Details / تفاصيل الخطأ: ${error.message}`;
    await sock.sendMessage(
      remoteJid,
      { text: errorMessage },
      { quoted: message }
    );
  }
}

// Export module / تصدير الوحدة
module.exports = {
  handle,
  Commands: ["zikir"],  // Command triggers / أوامر التشغيل
  OnlyPremium: false,    // Not limited to premium users / غير مقتصر على المميزين
  OnlyOwner: false,      // Not limited to owner / غير مقتصر على المالك
};