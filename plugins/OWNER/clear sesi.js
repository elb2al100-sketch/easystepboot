const fs = require("fs");
const path = require("path");

async function handle(sock, messageInfo) {
    const { remoteJid, message } = messageInfo;
    
    try {
        const sessionPath = path.join(process.cwd(), "session");
        if (!fs.existsSync(sessionPath)) {
            return await sock.sendMessage(
                remoteJid,
                { text: `⚠️ Session folder not found | مجلد الجلسات غير موجود.` },
                { quoted: message }
            );
        }

        let sessions = fs.readdirSync(sessionPath).filter(a => a !== "creds.json");
        
        if (sessions.length === 0) {
            return await sock.sendMessage(
                remoteJid,
                { text: `✅ No sessions need to be deleted | لا توجد جلسات بحاجة للحذف.` },
                { quoted: message }
            );
        }

        sessions.forEach(file => {
            fs.unlinkSync(path.join(sessionPath, file));
        });

        await sock.sendMessage(
            remoteJid,
            { text: `✅ All sessions have been deleted | تم حذف جميع الجلسات.` },
            { quoted: message }
        );
    } catch (error) {
        console.error('Error occurred:', error);
        await sock.sendMessage(
            remoteJid,
            { text: `⚠️ An error occurred while processing the command | حدث خطأ أثناء معالجة الأمر.` },
            { quoted: message }
        );
    }
}

module.exports = {
    handle,
    Commands    : ['clearsesi'],
    OnlyPremium : false,
    OnlyOwner   : true
};