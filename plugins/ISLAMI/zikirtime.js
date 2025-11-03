const ApiAutoresbot = require("api-autoresbot");
const config = require("@config");

const INTERVAL_MINUTES = 90; // كل 90 دقيقة
const INTERVAL_MS = INTERVAL_MINUTES * 60 * 1000; // تحويل الدقائق إلى ميلي ثانية

async function sendZikir(sock, remoteJid, messageKey = null) {
  try {
    // إرسال رد فعل تحميل إذا كانت رسالة
    if (messageKey) {
      await sock.sendMessage(remoteJid, {
        react: { text: "🕋", key: messageKey },
      });
    }

    const api = new ApiAutoresbot(config.APIKEY);

    // استدعاء واجهة الأذكار
    const response = await api.get("/api/islami/zikir");

    if (response?.data) {
      const zikirMessage = `_*Daily Zikir / الأذكار اليومية*_:\n\n${response.data}`;
      await sock.sendMessage(
        remoteJid,
        { text: zikirMessage },
        messageKey ? { quoted: { key: messageKey } } : {}
      );
    } else {
      await sock.sendMessage(
        remoteJid,
        {
          text: "Sorry, no Zikir data is available at the moment / عذراً، لا توجد بيانات أذكار متاحة حالياً. Try again later / حاول مرة أخرى لاحقاً."
        }
      );
    }
  } catch (error) {
    console.error("Error sending Zikir:", error);
    await sock.sendMessage(
      remoteJid,
      {
        text: `❌ Error while sending Zikir / خطأ أثناء إرسال الأذكار.\nError: ${error.message}`
      }
    );
  }
}

async function handle(sock, messageInfo) {
  const { remoteJid, message } = messageInfo;

  // إرسال عند استدعاء الأمر يدويًا
  await sendZikir(sock, remoteJid, message.key);

  // إعداد الإرسال التلقائي كل 90 دقيقة
  setInterval(async () => {
    await sendZikir(sock, remoteJid);
  }, INTERVAL_MS);
}

module.exports = {
  handle,
  Commands: ["zikirtime","ذكر"],
  OnlyPremium: false,
  OnlyOwner: false,
};