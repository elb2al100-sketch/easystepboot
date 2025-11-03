// استيراد الوظائف الأساسية من ملفات اللعبة وقاعدة المستخدمين
// Importing essential functions from game files and user database
const { removeUser, getUser, isUserPlaying } = require("@tmpDB/tebak gambar");
const { addUser, updateUser, deleteUser, findUser } = require("@lib/users");
const mess = require('@mess');

// الدالة الرئيسية لمعالجة الرسائل أثناء اللعبة
// Main function to process messages during the game
async function process(sock, messageInfo) {
    const { remoteJid, content, fullText, message, sender } = messageInfo;

    // التحقق مما إذا كان المستخدم يلعب حالياً
    // Check if the user is currently playing
    if (isUserPlaying(remoteJid)) {
        const data = getUser(remoteJid);

        // عندما يستسلم المستخدم ("nyerah" تعني "أستسلم")
        // When the user gives up ("nyerah" means "give up")
        if (fullText.toLowerCase().includes('nyerah')) {
            if (data && data.timer) {
                clearTimeout(data.timer); // إيقاف المؤقت إن وجد / Stop the timer if it exists
            }

            removeUser(remoteJid); // إزالة المستخدم من اللعبة / Remove user from the game

            // إرسال رسالة الاستسلام مع الجواب الصحيح
            // Send surrender message including the correct answer
            if (mess.game_handler.menyerah) {
                const messageWarning = mess.game_handler.menyerah
                    .replace('@answer', data.answer) // استبدال الجواب / Replace with answer
                    .replace('@command', data.command); // استبدال الأمر / Replace with command

                await sock.sendMessage(remoteJid, {
                    text: messageWarning,
                }, { quoted: message });
            }
            return false; // إيقاف متابعة البلجنات الأخرى / Stop further plugin processing
        }

        // إذا كانت الإجابة صحيحة
        // If the user's answer is correct
        if (fullText.toLowerCase() === data.answer) {
            const hadiah = data.hadiah; // قيمة الجائزة / Reward amount

            // البحث عن المستخدم في قاعدة البيانات
            // Search for the user in the database
            const user = await findUser(sender);

            if (user) {
                // إضافة الجائزة إلى رصيد المستخدم الحالي
                // Add reward to the user's existing balance
                const moneyAdd = (user.money || 0) + hadiah; // Default to 0 if undefined
                await updateUser(sender, { money: moneyAdd });
            } else {
                // إذا لم يكن المستخدم موجوداً، إنشاؤه وإضافة الجائزة
                // If user doesn't exist, create and give the reward
                await addUser(sender, {
                    money: hadiah,
                    role: "user",
                    status: "active",
                });
            }

            // إيقاف المؤقت إذا كان يعمل
            // Stop the timer if active
            if (data && data.timer) {
                clearTimeout(data.timer);
            }

            removeUser(remoteJid); // إزالة المستخدم من اللعبة / Remove user from game

            // إرسال رسالة النجاح مع المكافأة
            // Send success message with reward info
            if (mess.game_handler.tebak_gambar) {
                const messageNotif = mess.game_handler.tebak_gambar
                    .replace('@hadiah', hadiah); // استبدال قيمة الجائزة في النص / Replace reward value in text
                await sock.sendMessage(remoteJid, {
                    text: messageNotif,
                }, { quoted: message });
            }
            return false; // عدم متابعة البلجنات الأخرى / Stop further plugins
        }
    }

    return true; // تابع إلى البلجن التالي / Continue to the next plugin
}

// تصدير إعدادات اللعبة حتى يمكن استخدامها في النظام
// Export the game settings so it can be used by the system
module.exports = {
    name: "Tebak Gambar", // اسم اللعبة / Game name
    priority: 10,         // أولوية المعالجة / Processing priority
    process,              // الدالة الرئيسية / Main function
};