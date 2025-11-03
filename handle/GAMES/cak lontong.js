// Import necessary modules / استيراد الوحدات المطلوبة
const { removeUser, getUser, isUserPlaying } = require("@tmpDB/cak lontong");
const { addUser, updateUser, deleteUser, findUser } = require("@lib/users");

/**
 * Main process handler for the Cak Lontong quiz game
 * الدالة الرئيسية لمعالجة لعبة الألغاز "Cak Lontong"
 */
async function process(sock, messageInfo) {
    const { remoteJid, content, fullText, message, sender } = messageInfo;

    // Check if there is an active game in the current chat
    // التحقق مما إذا كانت هناك لعبة نشطة في الدردشة الحالية
    if (isUserPlaying(remoteJid)) {
        const data = getUser(remoteJid); // Get the current game data / جلب بيانات اللعبة الحالية

        /**
         * If the player gives up
         * إذا استسلم اللاعب
         */
        if (fullText.toLowerCase().includes('nyerah')) { // "nyerah" means "give up" / "nyerah" تعني "استسلام"
            if (data && data.timer) {
                clearTimeout(data.timer); // Stop the timer / إيقاف المؤقت
            }
            removeUser(remoteJid); // Remove player from game list / إزالة اللاعب من قائمة اللعبة

            await sock.sendMessage(remoteJid, {
                text: `😢 You gave up! / 😢 لقد استسلمت!\n\n` +
                      `🧩 Correct Answer / الإجابة الصحيحة: ${data.answer}\n` +
                      `📘 Description / الوصف: ${data.deskripsi}\n\n` +
                      `Want to play again? / هل تريد اللعب مرة أخرى؟\nType / اكتب: *.cak lontong*`,
            }, { quoted: message });
        }

        /**
         * If the player's answer is correct
         * إذا كانت إجابة اللاعب صحيحة
         */
        if (fullText.toLowerCase() === data.answer) {
            if (data && data.timer) {
                clearTimeout(data.timer); // Stop timer / إيقاف المؤقت
            }

            const hadiah = data.hadiah; // Reward amount / مقدار الجائزة

            // Find player in database / البحث عن المستخدم في قاعدة البيانات
            const user = await findUser(sender);

            if (user) {
                // Add reward to existing money / إضافة الجائزة إلى الرصيد الحالي
                const moneyAdd = (user.money || 0) + hadiah; // Default money to 0 if undefined / تعيين المال إلى 0 إذا لم يكن موجودًا
                await updateUser(sender, { money: moneyAdd });
            } else {
                // If user doesn't exist, create new entry / إذا لم يكن المستخدم موجودًا، أضف سجلًا جديدًا
                await addUser(sender, {
                    money: hadiah
                });
            }

            // Remove player from active game / إزالة اللاعب من اللعبة النشطة
            removeUser(remoteJid);

            // Send success message / إرسال رسالة الفوز
            await sock.sendMessage(remoteJid, {
                text: `🎉 Congratulations! / 🎉 مبروك!\n` +
                      `✅ Your answer is correct! / ✅ إجابتك صحيحة!\n` +
                      `💰 You earned / ربحت: ${hadiah} Money.`,
            }, { quoted: message });
        }
    }

    return true; // Continue to next plugin / المتابعة إلى الإضافة التالية
}

/**
 * Export module configuration
 * تصدير إعدادات الوحدة
 */
module.exports = {
    name: "Cak Lontong", // Plugin name / اسم الإضافة
    priority: 10, // Execution priority / أولوية التنفيذ
    process, // Main process function / الدالة الرئيسية
};