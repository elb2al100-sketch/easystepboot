const fs = require('fs');
const path = require('path');

// Function to handle the "listjadibot" command
// دالة لمعالجة أمر "listjadibot"
async function handle(sock, messageInfo) {
    const { remoteJid, message, sender } = messageInfo;

    try {
        // Send reaction as processing indicator
        // إرسال رد فعل كإشارة إلى أن العملية جارية
        await sock.sendMessage(remoteJid, { react: { text: "🤌🏻", key: message.key } });

        // Session folder path
        // مسار مجلد الجلسات
        const SESSION_PATH = './session/';

        // Check if session folder exists
        // التحقق من وجود مجلد الجلسات
        if (!fs.existsSync(SESSION_PATH)) {
            await sock.sendMessage(
                remoteJid,
                { text: `⚠️ Session folder not found / مجلد الجلسات غير موجود.` },
                { quoted: message }
            );
            return;
        }

        // Read contents of the session folder
        // قراءة محتويات مجلد الجلسات
        const sessionFolders = fs.readdirSync(SESSION_PATH).filter((folderName) => {
            const folderPath = path.join(SESSION_PATH, folderName);
            return fs.lstatSync(folderPath).isDirectory(); // Ensure only directories / التأكد من المجلدات فقط
        });

        // If no subfolders found
        // إذا لم يتم العثور على أي مجلد فرعي
        if (sessionFolders.length === 0) {
            await sock.sendMessage(
                remoteJid,
                { text: `📂 No Jadibot sessions found / لم يتم العثور على أي جلسة Jadibot.` },
                { quoted: message }
            );
            return;
        }

        // Create a numbered list of phone numbers from folder names
        // إنشاء قائمة مرقمة بأسماء الجلسات (أسماء المجلدات)
        const listMessage = `📜 *Jadibot List / قائمة Jadibot:*\n\n${sessionFolders.map((folder, index) => `*${index + 1}.* ${folder}`).join('\n')}`;

        // Send the list to the user
        // إرسال القائمة إلى المستخدم
        await sock.sendMessage(
            remoteJid,
            { text: listMessage },
            { quoted: message }
        );

    } catch (error) {
        console.error('An error occurred / حدث خطأ:', error);
        await sock.sendMessage(
            remoteJid,
            { text: `⚠️ An error occurred while processing the command / حدث خطأ أثناء معالجة الأمر.` },
            { quoted: message }
        );
    }
}

module.exports = {
    handle,
    Commands    : ['listjadibot'],
    OnlyPremium : false,
    OnlyOwner   : true
};