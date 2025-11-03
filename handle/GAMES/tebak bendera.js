// 🧩 استيراد دوال التعامل مع بيانات اللاعبين المؤقتة (مثل الحالة الحالية للعبة)
// 🧩 Import functions for handling temporary player data (like current game state)
const { removeUser, getUser, isUserPlaying } = require("@tmpDB/tebak bendera");

// 🧍‍♂️ استيراد دوال التعامل مع بيانات المستخدمين الدائمة (الحسابات، المال، الحالة...)
// 🧍‍♂️ Import user management functions (accounts, money, status, etc.)
const { addUser, updateUser, deleteUser, findUser } = require("@lib/users");

// 💬 استيراد ملف الرسائل الجاهزة للنظام
// 💬 Import predefined system messages
const mess = require('@mess');


// ⚙️ الدالة الرئيسية لمعالجة الرسائل القادمة أثناء اللعبة
// ⚙️ Main function to process incoming messages during the game
async function process(sock, messageInfo) {
    const { remoteJid, content, fullText, message, sender } = messageInfo;

    // ✅ التحقق مما إذا كان المستخدم حاليًا في وضع اللعب
    // ✅ Check if the user is currently playing
    if (isUserPlaying(remoteJid)) {
        const data = getUser(remoteJid); // استرجاع بيانات المستخدم الحالية / Retrieve user's game data

        // 🏳️ عندما يستسلم المستخدم (nyerah)
        // 🏳️ When the player gives up ("nyerah")
        if (fullText.toLowerCase().includes('nyerah')) {
            removeUser(remoteJid); // إزالة بيانات اللاعب من قاعدة البيانات المؤقتة
            // Remove the user's game data from temporary storage

            if (data && data.timer) {
                clearTimeout(data.timer); // إيقاف المؤقت إن وجد
                // Stop the timer if active
            }

            // إذا كانت هناك رسالة مخصصة في الإعدادات لحالة "الاستسلام"
            // If there's a custom "give up" message configured
            if (mess.game_handler.menyerah) {
                const messageWarning = mess.game_handler.menyerah
                    .replace('@answer', data.answer)   // استبدال @answer بالإجابة الصحيحة
                    .replace('@command', data.command); // استبدال @command بالأمر الأصلي

                await sock.sendMessage(remoteJid, {
                    text: messageWarning, // إرسال رسالة الاستسلام
                }, { quoted: message });
            }
            return false; // لا تتابع تنفيذ الإضافات الأخرى
        }

        // ✅ إذا كانت إجابة المستخدم صحيحة
        // ✅ If the user's answer is correct
        if (fullText.toLowerCase() === data.answer) {
            if (data && data.timer) {
                clearTimeout(data.timer); // إيقاف المؤقت
            }

            const hadiah = data.hadiah; // الجائزة (النقاط أو المال)
            // Reward (points or in-game currency)

            // 🔍 البحث عن المستخدم في قاعدة البيانات
            // 🔍 Look up the user in the database
            const user = await findUser(sender);

            if (user) {
                // تحديث رصيد المال إذا كان المستخدم موجودًا
                // Update balance if user exists
                const moneyAdd = (user.money || 0) + hadiah; 
                await updateUser(sender, { money: moneyAdd });
            } else {
                // إذا لم يكن المستخدم موجودًا، يتم إنشاؤه مع الجائزة المبدئية
                // If user doesn't exist, create one with initial reward
                await addUser(sender, {
                    money: hadiah,
                    role: "user",
                    status: "active",
                });
            }

            // إزالة المستخدم من قائمة اللاعبين بعد الفوز
            // Remove user from active players after winning
            removeUser(remoteJid);

            // إذا كانت هناك رسالة مخصصة للفوز في لعبة "تخمين العلم"
            // If there's a custom win message for "Guess the Flag" game
            if (mess.game_handler.tebak_bendera) {
                const messageNotif = mess.game_handler.tebak_bendera
                    .replace('@hadiah', hadiah); // استبدال قيمة الجائزة
                await sock.sendMessage(remoteJid, {
                    text: messageNotif, // إرسال رسالة الفوز
                }, { quoted: message });
            }
            return false; // توقف هنا — لا حاجة لمتابعة إضافات أخرى
        }
    }

    // 🔁 إذا لم يكن المستخدم في وضع اللعب، يتم متابعة الإضافات الأخرى
    // 🔁 If the user isn't in a game, continue to the next plugin
    return true;
}


// 🧩 تصدير الوحدة (Plugin) حتى يتمكن النظام من تحميلها واستخدامها
// 🧩 Export the plugin so the system can load and use it
module.exports = {
    name: "Tebak Bendera", // اسم اللعبة (تخمين العلم) / Game name (Guess the Flag)
    priority: 10,           // أولوية التنفيذ / Execution priority
    process,                // الدالة الأساسية لمعالجة الرسائل / Main processing function
};