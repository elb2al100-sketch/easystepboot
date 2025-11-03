async function handle(sock, messageInfo) {
  const { remoteJid, message, sender } = messageInfo;

  try {
    // Send sender's JID
    // إرسال معرف المرسل
    await sock.sendMessage(
      remoteJid,
      {
        text: sender, // sender JID / معرف المرسل
      },
      { quoted: message } // Reply to the original message / الرد على الرسالة الأصلية
    );
    return;
  } catch (error) {
    // If an error occurs
    // في حالة حدوث خطأ
    await sock.sendMessage(
      remoteJid,
      { text: "⚠️ Sorry, an error occurred / عذرًا، حدث خطأ ما" },
      { quoted: message }
    );
  }
}

module.exports = {
  handle,
  Commands: ["id"], 
  // Command to display sender's ID
  // أمر لعرض معرف المرسل
  OnlyPremium: false,
  OnlyOwner: false,
};