// ===========================
// BLACKJACK BOT MODULE
// ===========================

// ===== IMPORTS / الاستيراد =====
const { addUser, isUserPlaying } = require("@tmpDB/blackjack"); // Manage blackjack sessions / إدارة جلسات البلاك جاك
const { findUser, updateUser }   = require("@lib/users");       // Find and update user data / البحث وتحديث بيانات المستخدم

// ===== GAME MODE / وضع اللعبة =====
// Possible modes: 'normal', 'hard', 'setan'
// Normal = balanced / متوازن
// Hard = computer favors strong cards / صعب، الكمبيوتر يحصل على أوراق قوية
// Setan = almost impossible to win / صعب جدًا، شبه مستحيل الفوز
let mode = 'hard';

// ===== DEFINE DECKS / تعريف الأوراق =====
let kartu_blackjack_player = [];   // Player's cards / أوراق اللاعب
let kartu_blackjack_computer = []; // Computer's cards / أوراق الكمبيوتر

if (mode === 'normal') {
    kartu_blackjack_player   = ["A","2","3","4","5","6","7","8","9","J","K","Q"];
    kartu_blackjack_computer = ["A","2","3","4","5","6","7","8","9","J","K","Q"];
} else if (mode === 'hard') {
    kartu_blackjack_player   = ["A","2","3","4","5","6","7","8","9","J","K","Q"];
    kartu_blackjack_computer = ["8","9","J","K","Q"]; // Harder for player / صعب على اللاعب
} else if (mode === 'setan') {
    kartu_blackjack_player   = ["A","2","3","4","5","6","7","8","9"]; // No high cards / لا توجد أوراق عالية
    kartu_blackjack_computer = ["J","K","Q"]; // Computer gets strong cards / الكمبيوتر يحصل على أوراق قوية
}

// ===== RANDOM CARD FUNCTION / دالة اختيار بطاقة عشوائية =====
function getRandomCard(deck) {
    return deck[Math.floor(Math.random() * deck.length)];
}

// ===== CALCULATE CARD VALUE / دالة حساب قيمة الأوراق =====
function getNilaiKartu_Blackjack(kartu) {
    return kartu.reduce((total, kartu) => {
        if (["J","Q","K"].includes(kartu)) return total + 10; // Face cards = 10 / البطاقات الوجهية = 10
        if (kartu === "A") return total + 1; // Ace = 1 (can be 11 if needed) / الآس = 1 (يمكن تعديلها لتكون 11)
        return total + (parseInt(kartu) || 0); // Number cards / البطاقات الرقمية
    }, 0);
}

// ===== HANDLE BLACKJACK GAME / دالة تشغيل اللعبة =====
async function handle(sock, messageInfo) {
    const { remoteJid, message, content, sender } = messageInfo;

    // ===== CHECK IF USER IS PLAYING / التحقق من أن اللاعب ليس مشغول بالفعل =====
    if (isUserPlaying(sender)) {
        return await sock.sendMessage(
            remoteJid,
            { text: '⚠️ _Permainan blackjack sedang berlangsung._ / اللعبة جارية بالفعل.' },
            { quoted: message }
        );
    }

    // ===== VALIDATE BET / التحقق من صحة الرهان =====
    const taruhan = parseInt(content);
    if (!taruhan || taruhan <= 0) {
        return await sock.sendMessage(
            remoteJid,
            { text: `_Masukkan jumlah taruhan yang valid (contoh: *.blackjack 500*)_ / أدخل رهان صالح (مثال: *.blackjack 500*)` },
            { quoted: message }
        );
    }

    // ===== GET USER DATA / جلب بيانات المستخدم =====
    const dataUsers = await findUser(sender);
    if (!dataUsers) {
        return await sock.sendMessage(
            remoteJid,
            { text: 'Data user tidak ditemukan! / بيانات المستخدم غير موجودة!' },
            { quoted: message }
        );
    }

    // ===== CHECK USER MONEY / التحقق من رصيد المستخدم =====
    const moneyUsers = dataUsers.money || 0;
    if (moneyUsers < taruhan) {
        return await sock.sendMessage(
            remoteJid,
            { text: `Money Anda tidak cukup.\n\nMoney Anda: ${moneyUsers} / رصيدك غير كافٍ\n\nرصيدك: ${moneyUsers}` },
            { quoted: message }
        );
    }

    // ===== DEAL CARDS / توزيع الأوراق =====
    const playerCards   = [getRandomCard(kartu_blackjack_player), getRandomCard(kartu_blackjack_player)];
    const computerCards = [getRandomCard(kartu_blackjack_computer), getRandomCard(kartu_blackjack_computer)];

    const totalPlayer = getNilaiKartu_Blackjack(playerCards);

    // ===== DEDUCT BET / خصم الرهان =====
    const updatedMoney = moneyUsers - taruhan;
    await updateUser(sender, { money: updatedMoney });

    // ===== ADD USER TO GAME / إضافة اللاعب إلى اللعبة =====
    addUser(sender, {
        playerCards,
        computerCards,
        taruhan,
        mode
    });

    // ===== REPLY MESSAGE / رسالة عرض اللعبة =====
    const replyMessage = `🎰 *BLACKJACK* 🎰

🃏 Kartu Kamu: ${playerCards.join(", ")} / أوراقك
🎯 Total: ${totalPlayer} / المجموع

💻 Kartu Komputer: ${computerCards[0]}, ? / أوراق الكمبيوتر: بطاقة + ؟

💰 Taruhan: *${taruhan}* / الرهان

Ketik *hit* untuk mengambil kartu tambahan. / اضغط *hit* لأخذ بطاقة إضافية
Ketik *stand* untuk mengakhiri giliran. / اضغط *stand* لإنهاء دورك`;

    await sock.sendMessage(
        remoteJid,
        { text: replyMessage },
        { quoted: message }
    );
}

// ===== EXPORT MODULE / تصدير الموديول =====
module.exports = {
    handle,
    Commands    : ['bj', 'blackjack'], // Commands / الأوامر
    OnlyPremium : false,                // Available to all users / متاح للجميع
    OnlyOwner   : false
};