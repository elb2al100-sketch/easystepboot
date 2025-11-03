// استيراد الوظائف الأساسية لإدارة اللعبة وقاعدة المستخدمين
// Import core functions for managing the game and user database
const { removeUser, getUser, isUserPlaying } = require("@tmpDB/tebak kata");
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
        if(fullText.toLowerCase().includes('nyerah')){
            removeUser(remoteJid); // إزالة المستخدم من اللعبة / Remove user from the game
            if (data && data.timer) {
                clearTimeout(data.timer); // إيقاف المؤقت إن وجد / Stop timer if exists
            }

            // إرسال رسالة الاستسلام مع الإجابة الصحيحة
            // Send surrender message including the correct answer
            if(mess.game_handler.menyerah) {
                const messageWarning = mess.game_handler.menyerah
                    .replace('@answer', data.answer)   // استبدال الجواب / Replace with answer
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
            // Find the user in the database
            const user = await findUser(sender);

            if (user) {
                // إضافة الجائزة إلى رصيد المستخدم الحالي
                // Add reward to user's current balance
                const moneyAdd = (user.money || 0) + hadiah; // Default to 0 if undefined
                await updateUser(sender, { money: moneyAdd });
            } else {
                // إذا لم يكن المستخدم موجوداً، إنشاؤه وإضافة الجائزة
                // If user does not exist, create and add reward
                await addUser(sender, {
                    money: hadiah,
                    role: "user",
                    status: "active",
                });
            }

            // إيقاف المؤقت إذا كان يعمل
            // Stop the timer if exists
            if (data && data.timer) {
                clearTimeout(data.timer);
            }

            removeUser(remoteJid); // إزالة المستخدم من اللعبة / Remove user from game

            // إرسال رسالة النجاح مع المكافأة
            // Send success message with reward info
            if(mess.game_handler.tebak_kata) {
                const messageNotif = mess.game_handler.tebak_kata
                    .replace('@hadiah', hadiah); // استبدال قيمة الجائزة / Replace reward value
                await sock.sendMessage(remoteJid, {
                    text: messageNotif,
                }, { quoted: message });
            }
            return false; // إيقاف البلجنات الأخرى / Stop further plugin processing
        }
    }

    return true; // تابع إلى البلجن التالي / Continue to next plugin
}

// تصدير إعدادات اللعبة لاستخدامها في النظام
// Export the game settings for system usage
module.exports = {
    name: "Tebak Kata", // اسم اللعبة / Game name
    priority: 10,        // أولوية المعالجة / Processing priority
    process,             // الدالة الرئيسية / Main function
};