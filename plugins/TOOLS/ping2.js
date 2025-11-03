async function handle(sock, messageInfo) {
    const { remoteJid, message } = messageInfo;

    try {
        // Send reaction emoji 👻 to indicate "ping"
        // إرسال رمز تعبيري 👻 كإشارة إلى "البينغ"
        await sock.sendMessage(remoteJid, { react: { text: "👻", key: message.key } });
    } catch (error) {
        // Send warning emoji ⚠️ if there is an error
        // إرسال رمز تحذير ⚠️ في حال حدوث خطأ
        await sock.sendMessage(remoteJid, { react: { text: "⚠️", key: message.key } });
    }
}

module.exports = {
    handle,
    Commands    : ["ping"], // Command to trigger ping / الأمر لتنفيذ البينغ
    OnlyPremium : false,
    OnlyOwner   : false
};