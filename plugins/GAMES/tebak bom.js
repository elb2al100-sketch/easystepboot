const mess = require('@mess'); // Message templates / قوالب الرسائل
const { addUser, removeUser, getUser, isUserPlaying } = require("@tmpDB/tebak bom"); // Temporary DB / قاعدة بيانات مؤقتة
const { logWithTime }  = require('@lib/utils'); // Logging helper / مساعد تسجيل

// ===== MAIN HANDLE FUNCTION / الدالة الرئيسية =====
async function handle(sock, messageInfo) {
    const { remoteJid, message, content, fullText } = messageInfo;

    // Skip if message does not contain 'bom' / تخطي إذا لم تحتوي الرسالة على 'bom'
    if (!fullText.includes("bom")) return true;

    // Check if user is already playing / التحقق مما إذا كان المستخدم يلعب بالفعل
    if (isUserPlaying(remoteJid)) {
        await sock.sendMessage(
            remoteJid,
            { text: mess.game.isPlaying },
            { quoted: message }
        );
        return;
    }

    // Fruits and bomb / الفواكه والقنبلة
    const buah = ['🍏', '🍎', '🍐', '🍊', '🍋', '🍉', '🍇', '🍓', '🍒', '🍑', '🥭', '🍅'];

    // Shuffle an array / خلط مصفوفة
    const acakArray = (array) => {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    };

    // Add a bomb to the grid / وضع قنبلة في الشبكة
    const tambahBom = (grid) => {
        const posisiBom = Math.floor(Math.random() * 9); // Random bomb position / موقع القنبلة العشوائي
        grid[Math.floor(posisiBom / 3)][posisiBom % 3] = '💣';
        return posisiBom + 1; // Return position as 1-9 / إعادة الموقع من 1-9
    };

    // Generate fruit grid / إنشاء شبكة الفواكه
    const grid = [
        acakArray(buah.slice(0, 3)),
        acakArray(buah.slice(3, 6)),
        acakArray(buah.slice(6, 9))
    ];

    const posisiBomReal = tambahBom(grid); // Place bomb / وضع القنبلة

    // Views for users / عرض للمستخدم
    const bomView_User = `1️⃣ 2️⃣ 3️⃣\n4️⃣ 5️⃣ 6️⃣\n7️⃣ 8️⃣ 9️⃣`;
    const bomView_User_Abjad = `A B C D E F G H I`;

    // Add user to temporary DB / إضافة المستخدم للقاعدة المؤقتة
    addUser(remoteJid, {
        posisiBom: posisiBomReal, // Bomb position / موقع القنبلة
        terjawab: [],              // Answered positions / المواقع المختارة
        ListBuah: grid,            // Fruit grid / شبكة الفواكه
        bomView_User: bomView_User_Abjad, // Grid letters / حروف الشبكة
        hadiah: 5,                 // Reward money if win / الجائزة عند الفوز
        moneyMenang : 10,          // Extra money if win / مبلغ إضافي عند الفوز
        moneyKalah: 25,            // Money deduction if lose / الخصم عند الخسارة
        command : fullText,        // Original command / الأمر الأصلي
    });

    // Log bomb position / تسجيل موقع القنبلة
    logWithTime('Tebak Bom / تخمين القنبلة', `Bomb position / موقع القنبلة : ${posisiBomReal}`);

    // Send initial game message / إرسال رسالة بداية اللعبة
    await sock.sendMessage(
        remoteJid,
        { text: `_*Guess the Bomb Begins / بداية لعبة تخمين القنبلة*_\n\n${bomView_User}` },
        { quoted: message }
    );
}

// ===== EXPORT MODULE / تصدير الموديول =====
module.exports = {
    handle,
    Commands: ["tebak", "tebakbom"], // Commands / الأوامر
    OnlyPremium: false,
    OnlyOwner: false,
};