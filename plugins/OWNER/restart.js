const fs = require("fs");
const { exec } = require("child_process");

// Fungsi sleep untuk delay
// دالة لتأخير التنفيذ
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function handle(sock, messageInfo) {
    const { remoteJid, message } = messageInfo;

    try {
        // Send reaction to show processing started
        // إرسال رد فعل لإظهار أن العملية بدأت
        await sock.sendMessage(remoteJid, { react: { text: "🤌🏻", key: message.key } });

        // Create restaring.txt file with sender info
        // إنشاء ملف restaring.txt يحتوي على اسم المرسل (remoteJid)
        fs.writeFile("restaring.txt", remoteJid, (err) => {
            if (err) {
                console.error("Error while creating file:", err);
                return;
            }
        });

        // Wait 2 seconds before restarting
        // الانتظار 2 ثانية قبل إعادة التشغيل
        await sleep(2000);

        // Restart the bot
        // إعادة تشغيل البوت
        exec(`node index`);
    } catch (error) {
        console.error("An error occurred:", error);
    }
}

module.exports = {
    handle,
    Commands    : ["restart"],
    OnlyPremium : false,
    OnlyOwner   : true
};