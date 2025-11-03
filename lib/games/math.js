// Define difficulty modes with ranges, operators, time, and bonus / تعريف مستويات الصعوبة مع الحدود، العمليات، الوقت، والمكافأة
let modes = {
    noob: [-3, 3, -3, 3, '+-', 15000, 10],               // Beginner / مبتدئ
    easy: [-10, 10, -10, 10, '*/+-', 20000, 40],         // Easy / سهل
    medium: [-40, 40, -20, 20, '*/+-', 40000, 150],      // Medium / متوسط
    hard: [-100, 100, -70, 70, '*/+-', 60000, 350],      // Hard / صعب
    extreme: [-999999, 999999, -999999, 999999, '*/', 99999, 9999], // Extreme / متطرف
    impossible: [-99999999999, 99999999999, -99999999999, 999999999999, '*/', 30000, 35000], // Impossible / مستحيل
    impossible2: [-999999999999999, 999999999999999, -999, 999, '/', 30000, 50000] // Impossible 2 / مستحيل 2
};

// Map operators to display symbols / ربط العمليات بالرموز للعرض
let operators = {
    '+': '+',
    '-': '-',
    '*': '×',
    '/': '÷'
};

// Generate a random integer between from and to / إنشاء رقم صحيح عشوائي بين from و to
function randomInt(from, to) {
    if (from > to) [from, to] = [to, from]; // Swap if from > to / تبديل القيم إذا كان from أكبر من to
    from = Math.floor(from);
    to = Math.floor(to);
    return Math.floor((to - from) * Math.random() + from);
}

// Pick a random element from a list / اختيار عنصر عشوائي من قائمة
function pickRandom(list) {
    return list[Math.floor(Math.random() * list.length)];
}

// Generate a math problem based on mode / إنشاء مسألة رياضية بناءً على المستوى
function genMath(mode) {
    return new Promise((resolve, reject) => {
        // Destructure mode values / فك القيم من الوضع
        let [a1, a2, b1, b2, ops, time, bonus] = modes[mode];

        let a = randomInt(a1, a2); // Random value a / قيمة a عشوائية
        let b = randomInt(b1, b2); // Random value b / قيمة b عشوائية
        let op = pickRandom([...ops]); // Pick a random operator / اختيار عملية عشوائية

        // Calculate result / حساب الناتج
        let result = (new Function(`return ${a} ${op.replace('/', '*')} ${b < 0 ? `(${b})` : b}`))();

        // Adjust for division / تعديل للقسمة
        if (op == '/') [a, result] = [result, a];

        // Build the math question object / إنشاء كائن السؤال الرياضي
        const hasil = {
            soal: `${a} ${operators[op]} ${b}`, // Question string / نص السؤال
            mode: mode,                          // Difficulty mode / مستوى الصعوبة
            waktu: time,                          // Time in milliseconds / الوقت بالملي ثانية
            hadiah: bonus,                        // Reward / المكافأة
            jawaban: result                       // Answer / الإجابة
        };

        resolve(hasil); // Resolve the promise with the question / حل الوعد مع السؤال
    });
}

// Export functions and constants / تصدير الدوال والثوابت
module.exports = { modes, operators, randomInt, pickRandom, genMath };