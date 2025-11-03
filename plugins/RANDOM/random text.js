const ApiAutoresbot = require("api-autoresbot");
const config = require("@config");

async function handle(sock, messageInfo) {
    const { remoteJid, message, command } = messageInfo;
    try {
        let commands = command;
        if (commands === 'quote' || commands === 'quotes') {
            commands = 'randomquote';
        }

        const api = new ApiAutoresbot(config.APIKEY);
        const response = await api.get(`/api/random/${commands}`);

        await sock.sendMessage(
            remoteJid,
            { text: response.data + "\n\n✅ / تم بنجاح" }, // Tambahkan tanda sukses bilingual
            { quoted: message }
        );
    } catch (error) {
        console.error("Error in handle function:", error.message);

        const errorMessage = `⚠️ Sorry, an error occurred while processing your request / عذراً، حدث خطأ أثناء معالجة طلبك.\n\n*Error Details / تفاصيل الخطأ:* ${error.message || "Unknown error / خطأ غير معروف"}`;

        await sock.sendMessage(
            remoteJid,
            { text: errorMessage },
            { quoted: message }
        );
    }
}

module.exports = {
    handle,
    Commands    : [
        'animequotes', 'bucinquote', 'dilanquote', 'faktaunik', 
        'jawaquote', 'jokes', 'pantun', 'quote', 'quotes', 'randomquote'
    ],
    OnlyPremium : false,
    OnlyOwner   : false,
    limitDeduction  : 1, // Jumlah limit yang akan dikurangi / Number of limit to deduct
};