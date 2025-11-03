const { createBackup } = require('@lib/utils');
const config        = require('@config');

async function handle(sock, messageInfo) {
    const { remoteJid, message } = messageInfo;

    try {
        // React to indicate process start
        // إرسال رد فعل لبدء العملية
        await sock.sendMessage(remoteJid, { react: { text: "🤌🏻", key: message.key } });

        // Create backup
        // إنشاء نسخة احتياطية
        const backupFilePath = await createBackup();

        // Send confirmation message
        // إرسال رسالة تأكيد
        await sock.sendMessage(
            remoteJid,
            {
                text: `✅ _Success! Backup data has been saved and sent to the bot number_
                \n✅ _تم حفظ النسخة الاحتياطية وإرسالها إلى رقم البوت_\n
Size : ${backupFilePath.size}  | الحجم
Time : ${backupFilePath.time}  | الوقت
`
            },
            { quoted: message }
        );

        // Send backup file to bot number
        // إرسال ملف النسخة الاحتياطية إلى رقم البوت
        const documentPath = backupFilePath.path;

        await sock.sendMessage(
            `${config.phone_number_bot}@s.whatsapp.net`,
            {
                document: { url: documentPath },
                fileName: 'Backup File | ملف النسخة الاحتياطية',
                mimetype: 'application/zip'
            }
        );


    } catch (err) {
        console.error('Backup failed:', err);

        // Send error message
        // إرسال رسالة عند حدوث خطأ
        await sock.sendMessage(
            remoteJid,
            {
                text: `❌ _Backup failed:_ ${err.message}\n❌ _فشل النسخ الاحتياطي_`
            },
            { quoted: message }
        );
    }
}

module.exports = {
    handle,
    Commands    : ['backup'],
    OnlyPremium : false,
    OnlyOwner   : true
};