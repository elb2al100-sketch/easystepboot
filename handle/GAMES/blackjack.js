// Import helper functions / استيراد الدوال المساعدة
const { removeUser, getUser, isUserPlaying } = require("@tmpDB/blackjack");
const { updateUser, findUser } = require("@lib/users");
const { danger } = require('@lib/utils');
const config = require('@config');

// Card sets for Blackjack / مجموعات البطاقات الخاصة بلعبة البلاك جاك
const kartu_blackjack = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "J", "K", "Q"];
const kartu_blackjack_setan = ["9", "J", "K", "Q"];

/**
 * Function to calculate total card value
 * دالة لحساب القيمة الإجمالية للبطاقات
 */
function getNilaiKartu_Blackjack(kartu) {
    return kartu.reduce((total, kartu) => {
        if (["J", "Q", "K"].includes(kartu)) return total + 10; // J, Q, K = 10 points / البطاقات الوجهية تساوي 10 نقاط
        if (kartu === "A") return total + 1; // Ace can be 1 or 11 / الآس يمكن اعتباره 1 أو 11 (هنا 1)
        return total + (parseInt(kartu) || 0); // Number cards use their value / البطاقات الرقمية تستخدم قيمتها الأصلية
    }, 0);
}

/**
 * Function to handle game results comparison
 * دالة لمعالجة نتائج مقارنة البطاقات بين اللاعب والكمبيوتر
 */
function getGameResult(userTotal, compTotal, taruhan, data) {
    let resultMessage = '';
    let moneyChange = 0;
    let action = '';

    if (userTotal > compTotal) {
        // Player wins / اللاعب فاز
        moneyChange = taruhan * 2;
        action = 'win';
        resultMessage = `🎰 *YOU WIN* 🎰 / 🎰 *كسبت الجولة* 🎰

🃏 Your Cards / بطاقاتك: ${data.playerCards.join(", ")}
🎯 Total / المجموع: ${userTotal}

💻 Computer Cards / بطاقات الكمبيوتر: ${data.computerCards.join(', ')}
🎯 Total / المجموع: ${compTotal}

💰 You Earned / ربحت: *+${moneyChange}*`;

    } else if (userTotal === compTotal) {
        // Draw / تعادل
        moneyChange = taruhan;
        action = 'draw';
        resultMessage = `🎰 *DRAW GAME* 🎰 / 🎰 *تعادل* 🎰

🃏 Your Cards / بطاقاتك: ${data.playerCards.join(", ")}
🎯 Total / المجموع: ${userTotal}

💻 Computer Cards / بطاقات الكمبيوتر: ${data.computerCards.join(', ')}
🎯 Total / المجموع: ${compTotal}

💰 Returned Money / أُعيد إليك مالك: *+${moneyChange}*`;

    } else {
        // Player loses / اللاعب خسر
        moneyChange = taruhan;
        action = 'lost';
        resultMessage = `🎰 *YOU LOST* 🎰 / 🎰 *خسرت الجولة* 🎰

🃏 Your Cards / بطاقاتك: ${data.playerCards.join(", ")}
🎯 Total / المجموع: ${userTotal}

💻 Computer Cards / بطاقات الكمبيوتر: ${data.computerCards.join(', ')}
🎯 Total / المجموع: ${compTotal}

💰 Lost Money / خسرت: *-${moneyChange}*`;
    }

    return { resultMessage, moneyChange, action };
}

// Rate limiter to prevent spam / محدد السرعة لمنع الإرسال المتكرر
const rateLimiter = {};

/**
 * Main game process handler
 * الدالة الأساسية لمعالجة أحداث اللعبة
 */
async function process(sock, messageInfo) {
    const { remoteJid, pushName, fullText, message, sender } = messageInfo;

    const now = Date.now();
    const rateLimit = config.rate_limit;

    // Check if the user is currently playing / تحقق ما إذا كان المستخدم يلعب حالياً
    if (isUserPlaying(sender)) {
        const data = getUser(sender);
        const user = await findUser(sender);

        // If the user types "stand" / إذا كتب المستخدم "stand"
        if (fullText.toLowerCase().includes('stand')) {

            // Check rate limit / التحقق من حد الإرسال الزمني
            if (rateLimiter[sender]) {
                const timeSinceLastMessage = now - rateLimiter[sender];
                if (timeSinceLastMessage < rateLimit) {
                    danger(pushName, `Rate limit : ${fullText}`);
                    return false;
                }
            }
            rateLimiter[sender] = now;

            const userCards = data.playerCards;
            const compCards = data.computerCards;

            // Calculate totals / حساب مجموع البطاقات
            const userTotal = getNilaiKartu_Blackjack(userCards);
            const compTotal = getNilaiKartu_Blackjack(compCards);
            const taruhan = data.taruhan;

            const { resultMessage, moneyChange, action } = getGameResult(userTotal, compTotal, taruhan, data);

            // Update user balance / تحديث رصيد المستخدم
            const currentBalance = user.money || 0;
            const actions = {
                win: currentBalance + moneyChange,
                lost: currentBalance,
                draw: currentBalance + moneyChange,
            };

            const newBalance = actions[action] ?? (() => { throw new Error(`Unknown action: ${action}`); })();
            updateUser(sender, { money: newBalance });

            // Remove user from active game / إزالة المستخدم من اللعبة النشطة
            removeUser(sender);

            // Send result message / إرسال رسالة النتيجة
            await sock.sendMessage(remoteJid, { text: resultMessage }, { quoted: message });

            return false;

        // If the user types "hit" / إذا كتب المستخدم "hit"
        } else if (fullText.toLowerCase().includes('hit')) {

            // Rate limit check again / التحقق من الحد الزمني مرة أخرى
            if (rateLimiter[sender]) {
                const timeSinceLastMessage = now - rateLimiter[sender];
                if (timeSinceLastMessage < rateLimit) {
                    danger(pushName, `Rate limit [BJ] : ${fullText}`);
                    return false;
                }
            }
            rateLimiter[sender] = now;

            // Draw an extra card / سحب بطاقة إضافية
            let userkartu3 = kartu_blackjack[Math.floor(Math.random() * kartu_blackjack.length)];

            const totalBiji = getNilaiKartu_Blackjack(data.playerCards);

            // If in "setan" mode and total > 13, give harder cards / في وضع "الشيطان" استخدم بطاقات صعبة
            if (totalBiji > 13 && data.mode == 'setan') {
                userkartu3 = kartu_blackjack_setan[Math.floor(Math.random() * kartu_blackjack_setan.length)];
            }

            // If in "hard" mode and user has much money, make it harder / إذا الوضع "hard" والمال كثير، اجعل اللعبة أصعب
            if (data.mode == 'hard' && user.money > 10000 && totalBiji > 13) {
                userkartu3 = kartu_blackjack_setan[Math.floor(Math.random() * kartu_blackjack_setan.length)];
            }

            data.playerCards.push(userkartu3); // Add card to player’s hand / إضافة البطاقة إلى يد اللاعب

            const userTotal = getNilaiKartu_Blackjack(data.playerCards);
            const compTotal = getNilaiKartu_Blackjack(data.computerCards);

            // If player exceeds 21, he loses / إذا تجاوز اللاعب 21 يخسر تلقائياً
            if (userTotal > 21) {
                const taruhan = data.taruhan;
                const resultMessage = `🎰 *YOU LOST* 🎰 / 🎰 *خسرت الجولة* 🎰

🃏 Your Cards / بطاقاتك: ${data.playerCards.join(", ")}
🎯 Total / المجموع: ${userTotal}

💻 Computer Cards / بطاقات الكمبيوتر: ${data.computerCards.join(', ')}
🎯 Total / المجموع: ${compTotal}

💰 Lost Money / خسرت: *-${taruhan}*`;

                removeUser(sender); // Remove user from game / إزالة اللاعب من اللعبة
                await sock.sendMessage(remoteJid, { text: resultMessage }, { quoted: message }); // Send losing message / إرسال رسالة الخسارة

            } else {
                // Continue playing / متابعة اللعب
                const resultMessage = `🎰 *BLACKJACK* 🎰 / 🎰 *بلاك جاك* 🎰

🃏 Your Cards / بطاقاتك: ${data.playerCards.join(", ")}
🎯 Total / المجموع: ${userTotal}

💻 Computer Cards / بطاقات الكمبيوتر: ${data.computerCards[0]}, ?

💰 Bet / الرهان: ${data.taruhan}

Type *.hit* to draw another card or *.stand* to finish turn
اكتب *.hit* لسحب بطاقة إضافية أو *.stand* لإنهاء الدور`;

                await sock.sendMessage(remoteJid, { text: resultMessage }, { quoted: message });
            }

            return false;
        }
    }

    return true; // Continue to next plugin / تابع إلى الإضافة التالية
}

// Export the plugin / تصدير الوحدة
module.exports = {
    name: "Blackjack", // اسم اللعبة
    priority: 10, // أولوية التنفيذ
    process, // الدالة الرئيسية
};