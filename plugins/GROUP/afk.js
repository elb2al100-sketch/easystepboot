const { findUser, updateUser } = require("@lib/users"); 
// English: Functions to find and update user data
// العربية: دوال للعثور على بيانات المستخدم وتحديثها

async function handle(sock, messageInfo) {
    const { remoteJid, isGroup, message, content, sender, pushName } = messageInfo;

    // English: Check if the message is from a group
    // العربية: تحقق مما إذا كانت الرسالة من مجموعة
    if (!isGroup) return;

    try {
        // English: Retrieve user data from the database
        // العربية: استرجاع بيانات المستخدم من قاعدة البيانات
        const dataUsers = await findUser(sender);

        if (dataUsers) {
            // English: Determine the AFK reason
            // العربية: تحديد سبب الغياب AFK
            const alasan = content 
                ? `Reason / سبب: ${content.length > 100 ? content.slice(0, 100) + "..." : content}` 
                : "No reason / بدون سبب"; 
        
            const waktuSekarang = new Date(); // English: Current time / العربية: الوقت الحالي

            // English: Update the user status to AFK
            // العربية: تحديث حالة المستخدم إلى AFK
            await updateUser(sender, {
                status: "afk",
                afk: {
                    lastChat: waktuSekarang.toISOString(),
                    alasan, // Reason / السبب
                },
            });

            // English: Send a message to the group or private chat
            // العربية: إرسال رسالة إلى المجموعة أو الدردشة الخاصة
            await sock.sendMessage(
                remoteJid,
                { text: `😓 Oh no, ${pushName} is now AFK.\n\n📌 ${alasan}` },
                // الإنجليزية: Message to notify AFK / العربية: رسالة لإعلام الغياب
                { quoted: message }
            );
        }
    } catch (error) {
        console.error("Error in AFK command:", error);

        // English: Send an error message if something goes wrong
        // العربية: إرسال رسالة خطأ إذا حدث شيء خاطئ
        await sock.sendMessage(
            remoteJid,
            { text: '❌ An error occurred while processing the command. Please try again later. / حدث خطأ أثناء تنفيذ الأمر. حاول مرة أخرى لاحقاً.' }, 
            { quoted: message }
        );
    }
}

module.exports = {
    handle,
    Commands    : ["afk"], // English: Command name / العربية: اسم الأمر
    OnlyPremium : false,
    OnlyOwner   : false
};