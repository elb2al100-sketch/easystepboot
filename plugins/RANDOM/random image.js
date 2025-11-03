const ApiAutoresbot = require("api-autoresbot");
const config = require("@config");
const mess = require("@mess");

async function handle(sock, messageInfo) {
  const { remoteJid, message, command } = messageInfo;
  try {
    // Kirim reaksi sementara / Send temporary reaction
    await sock.sendMessage(remoteJid, {
      react: { text: "🤌🏻", key: message.key },
    });

    // Inisialisasi API / Initialize API
    const api = new ApiAutoresbot(config.APIKEY);
    const buffer = await api.getBuffer(`/api/random/${command}`);

    // Kirim gambar dengan caption sukses / Send image with success caption
    await sock.sendMessage(
      remoteJid,
      { image: buffer, caption: mess.general.success + " / تم بنجاح" },
      { quoted: message }
    );
  } catch (error) {
    console.error("Error in handle function:", error.message);

    const errorMessage = `⚠️ Sorry, an error occurred while processing your request / عذراً، حدث خطأ أثناء معالجة طلبك.\n\n*Error Details / تفاصيل الخطأ:* ${
      error.message || "Unknown error / خطأ غير معروف"
    }`;

    await sock.sendMessage(
      remoteJid,
      { text: errorMessage },
      { quoted: message }
    );
  }
}

module.exports = {
  handle,
  Commands: [
    "aesthetic",
    "cecan",
    "cogan",
    "cosplay",
    "darkjoke",
    "hacker",
    "kucing",
    "memeindo",
    "motivasi",
    "thailand",
    "vietnam",
    "walhp",
  ],
  OnlyPremium: false,
  OnlyOwner: false,
  limitDeduction: 1, // Jumlah limit yang akan dikurangi / Number of limit to deduct
};