// Import required modules / استيراد الوحدات المطلوبة
const { removeUser, getUser, isUserPlaying } = require("@tmpDB/math");
const { addUser, updateUser, deleteUser, findUser } = require("@lib/users");

// Main process function / الدالة الرئيسية لمعالجة الرسائل
async function process(sock, messageInfo) {
    const { remoteJid, content, fullText, message, sender } = messageInfo;

    // Check if the user is currently playing / التحقق مما إذا كان المستخدم يلعب حالياً
    if (isUserPlaying(remoteJid)) {
        const data = getUser(remoteJid);

        // When the user gives up / عندما يستسلم المستخدم
        if (fullText.toLowerCase().includes('nyerah')) {
            if (data && data.timer) {
                clearTimeout(data.timer); // Stop the timer / إيقاف المؤقت
            }
            removeUser(remoteJid); // Remove the user from the game / إزالة المستخدم من اللعبة
            await sock.sendMessage(remoteJid, {
                text: `Yahh Menyerah 😞\nJawaban (Answer): ${data.jawaban}\n\nIngin bermain lagi? Ketik *.math*\n\n😞 لقد استسلمت!\nالإجابة الصحيحة: ${data.jawaban}\n\nهل تريد اللعب مجددًا؟ اكتب *.math*`,
            }, { quoted: message });
        }

        // When the user's answer is correct / عندما تكون إجابة المستخدم صحيحة
        if (fullText.toLowerCase() == data.jawaban) {
            const hadiah = data.hadiah; // The prize / الجائزة
            if (data && data.timer) {
                clearTimeout(data.timer); // Stop the timer / إيقاف المؤقت
            }

            // Find the user in the database / البحث عن المستخدم في قاعدة البيانات
            const user = await findUser(sender);

            if (user) {
                const moneyAdd = (user.money || 0) + hadiah; 
                // Default money to 0 if undefined / تعيين المال إلى 0 إذا لم يكن موجودًا
                await updateUser(sender, { money: moneyAdd }); // Update user's balance / تحديث رصيد المستخدم
            } else {
                await addUser(sender, {
                    money: hadiah,
                    role: "user",
                    status: "active",
                }); // Add new user with prize money / إضافة مستخدم جديد مع الجائزة
            }

            removeUser(remoteJid); // Remove the user from the game / إزالة المستخدم من اللعبة
            await sock.sendMessage(remoteJid, {
                text: `🎉 Selamat! Jawaban Anda benar.\nAnda mendapatkan ${hadiah} Money.\n\n🎉 تهانينا! إجابتك صحيحة.\nلقد ربحت ${hadiah} من المال.`,
            }, { quoted: message });
        }
    }

    return true; // Continue to the next plugin / المتابعة إلى الإضافة التالية
}

// Export the module / تصدير الوحدة
module.exports = {
    name: "Math",      // Plugin name / اسم الإضافة
    priority: 10,      // Plugin priority / أولوية الإضافة
    process,           // The main function / الدالة الرئيسية
};