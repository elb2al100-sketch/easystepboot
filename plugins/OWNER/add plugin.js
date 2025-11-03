// Import utilities and Node.js modules
// استيراد الأدوات ووحدات Node.js
const { reply } = require("@lib/utils");
const fs = require('fs');
const path = require('path');

async function handle(sock, messageInfo) {
    const { m, prefix, command, content } = messageInfo;

    // Split the content by '|' character
    // فصل المحتوى بواسطة الحرف '|'
    const parts = content.split('|').map(part => part.trim());

    if (parts.length < 2) {
        return await reply(
            m,
            `⚠️ _Please enter a valid format_\n_💬 Example:_ *${prefix + command} newfitur* | async function handle(sock, messageInfo) {\n    const { remoteJid, message } = messageInfo;\n    await sock.sendMessage(remoteJid, { text: 'test new feature' }, { quoted: message });\n}\n\n⚠️ _الرجاء إدخال تنسيق صحيح_\n_💬 مثال:_ *${prefix + command} newfitur* | async function handle(sock, messageInfo) {\n    const { remoteJid, message } = messageInfo;\n    await sock.sendMessage(remoteJid, { text: 'اختبار ميزة جديدة' }, { quoted: message });\n}`
        );
    }

    // The first part is the new command name (newCommand)
    // الجزء الأول هو اسم الأمر الجديد
    let newCommand = parts[0];

    // Ensure newCommand ends with '.js'
    // التأكد من أن اسم الملف ينتهي بـ '.js'
    if (!newCommand.endsWith('.js')) {
        newCommand += '.js'; // Add '.js' if missing
    }

    // Combine all elements after the first one as the function body
    // دمج جميع العناصر بعد الأولى لتكون جسم الدالة
    const functionBody = parts.slice(1).join('|');

    // Set the folder path to save the new plugin
    // تحديد مسار المجلد لحفظ البلجن الجديد
    const folderPath = path.join(process.cwd(), './plugins/FEATURES ADD/');
    
    // Ensure the folder exists
    // التأكد من أن المجلد موجود
    if (!fs.existsSync(folderPath)) {
        fs.mkdirSync(folderPath, { recursive: true });
    }

    // File content is just the function body
    // محتوى الملف هو جسم الدالة فقط
    const fileContent = functionBody;

    // Write the new file with the name of newCommand
    // كتابة الملف الجديد باسم newCommand
    const filePath = path.join(folderPath, `${newCommand}`);
    fs.writeFileSync(filePath, fileContent);

    // Send success message
    // إرسال رسالة نجاح
    return await reply(
        m,
        `✅ _New plugin named *${newCommand}* has been created successfully!_\n\n_Restart the server to apply changes_\n✅ _تم إنشاء بلجن جديد باسم *${newCommand}* بنجاح!_\n\n_أعد تشغيل السيرفر لتطبيق التغييرات_`
    );
}

module.exports = {
    handle,
    Commands    : ['addplugin', 'addplugins'], // Command names
    OnlyPremium : false,
    OnlyOwner   : true
};