// استيراد الدوال الخاصة بإدارة المستخدمين في اللعبة من قاعدة بيانات مؤقتة
// Import functions for managing game users from a temporary database
const { removeUser, getUser, isUserPlaying } = require("@tmpDB/tebak angka");

// استيراد دوال إدارة المستخدمين العامة من مكتبة المستخدمين
// Import general user management functions
const { addUser, updateUser, deleteUser, findUser } = require("@lib/users");

// استيراد رسائل النظام المخصصة
// Import custom system messages
const mess = require('@mess');


// الدالة الرئيسية لمعالجة الرسائل في اللعبة
// Main function to process incoming game messages
async function process(sock, messageInfo) {
    const { remoteJid, content, fullText, message, sender } = messageInfo;

    // إذا كان المستخدم يلعب حاليًا
    // If the user is currently playing
    if (isUserPlaying(remoteJid)) {
        const data = getUser(remoteJid);

        // 🏳️ عندما يستسلم اللاعب (nyerah)
        // 🏳️ When the player gives up ("nyerah")
        if (fullText.toLowerCase().includes('nyerah')) {
            removeUser(remoteJid);
            if (data && data.timer) {
                clearTimeout(data.timer);
            }

            // إذا كانت هناك رسالة مخصصة لحالة الاستسلام
            // If there’s a custom message for giving up
            if (mess.game_handler.menyerah) {
                const messageWarning = mess.game_handler.menyerah
                    .replace('@answer', data.angkaAcak) // استبدال المتغير بالإجابة الصحيحة
                    .replace('@command', data.command); // استبدال المتغير بالأمر الأصلي

                await sock.sendMessage(remoteJid, {
                    text: messageWarning,
                }, { quoted: message });
            }

            return false;
        }

        // التحقق مما إذا كان الإدخال رقمًا فقط
        // Check if input is a number
        if (!/^\d+$/.test(fullText)) {
            // إذا لم يكن رقمًا، يتم تجاهله
            // Ignore if not a number
            return;
        }

        const guessedNumber = parseInt(fullText, 10); // تحويل النص إلى رقم
        // Convert the text input to an integer

        // ✅ إذا كان التخمين صحيحًا
        // ✅ If the guessed number is correct
        if (guessedNumber === data.angkaAcak) {
            const hadiah = data.hadiah; // قيمة الجائزة
            // The reward value

            // 🔍 البحث عن المستخدم في قاعدة البيانات
            // 🔍 Find the user in the database
            const user = await findUser(sender);

            if (user) {
                const moneyAdd = (user.money || 0) + hadiah; 
                // زيادة المال الحالي أو تعيينه إذا لم يكن موجودًا
                // Add reward to current balance (or initialize if undefined)
                await updateUser(sender, { money: moneyAdd });
            } else {
                // إنشاء مستخدم جديد مع الجائزة الافتراضية
                // Create a new user with the initial reward
                await addUser(sender, {
                    money: hadiah,
                    role: "user",
                    status: "active",
                });
            }

            // إزالة بيانات اللعبة للمستخدم الحالي
            // Remove the user's game data
            removeUser(remoteJid);
            if (data && data.timer) {
                clearTimeout(data.timer);
            }

            // إرسال رسالة الفوز
            // Send winning message
            if (mess.game_handler.tebak_angka) {
                const messageNotif = mess.game_handler.tebak_angka
                    .replace('@hadiah', hadiah);
                await sock.sendMessage(remoteJid, {
                    text: messageNotif,
                }, { quoted: message });
            }

            return false;
        } else {
            // ❌ التخمين خاطئ
            // ❌ Incorrect guess
            data.attempts -= 1; // تقليل عدد المحاولات
            // Decrease attempts count

            const hint =
                guessedNumber < data.angkaAcak
                    ? `❗ الرقم ${guessedNumber} صغير جدًا.` // رقم صغير جدًا
                    : `❗ الرقم ${guessedNumber} كبير جدًا.`; // رقم كبير جدًا

            await sock.sendMessage(remoteJid, {
                text: `${hint} عدد المحاولات المتبقية: ${data.attempts}.`,
            }, { quoted: message });

            // ⚠️ إذا انتهت المحاولات
            // ⚠️ If no attempts left
            if (data.attempts <= 0) {
                if (data && data.timer) {
                    clearTimeout(data.timer);
                }
                removeUser(remoteJid);
                await sock.sendMessage(remoteJid, {
                    text: "❌ انتهت المحاولات. اللعبة انتهت.",
                }, { quoted: message });
            }

            return false;
        }

        return true; // المتابعة إلى الإضافة (plugin) التالية
        // Continue to the next plugin
    }

    return true; // إذا لم يكن هناك لعبة نشطة
    // If no active game
}


// تصدير الوحدة (plugin) حتى يتمكن النظام من استخدامها
// Export the plugin so the system can use it
module.exports = {
    name: "Tebak Angka", // اسم اللعبة (تخمين الرقم)
    priority: 10,         // أولوية التنفيذ
    process,              // الدالة الرئيسية للمعالجة
};