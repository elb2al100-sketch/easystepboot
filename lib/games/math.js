// ==============================
// ⚙️ Math Game Modes / أوضاع اللعبة الرياضية
// ==============================
let modes = {
  noob: [-3, 3, -3, 3, '+-', 15000, 10],          // Very easy / سهل جدًا
  easy: [-10, 10, -10, 10, '*/+-', 20000, 40],   // Easy / سهل
  medium: [-40, 40, -20, 20, '*/+-', 40000, 150],// Medium / متوسط
  hard: [-100, 100, -70, 70, '*/+-', 60000, 350],// Hard / صعب
  extreme: [-999999, 999999, -999999, 999999, '*/', 99999, 9999], // Extreme / صعب جدًا
  impossible: [-99999999999, 99999999999, -99999999999, 999999999999, '*/', 30000, 35000], // Impossible / مستحيل
  impossible2: [-999999999999999, 999999999999999, -999, 999, '/', 30000, 50000] // Another impossible mode / وضع مستحيل آخر
}

// ==============================
// Operators Display / رموز العمليات
// ==============================
let operators = {
  '+': '+', // Addition / جمع
  '-': '-', // Subtraction / طرح
  '*': '×', // Multiplication / ضرب
  '/': '÷'  // Division / قسمة
}

// ==============================
// Random Integer Generator / توليد رقم عشوائي
// ==============================
function randomInt(from, to) {
  if (from > to) [from, to] = [to, from] // Swap if range is reversed / تبديل إذا كان النطاق مقلوب
  from = Math.floor(from)
  to = Math.floor(to)
  return Math.floor((to - from) * Math.random() + from) // Random integer / رقم عشوائي
}

// ==============================
// Pick Random Item / اختيار عنصر عشوائي
// ==============================
function pickRandom(list) {
  return list[Math.floor(Math.random() * list.length)]
}

// ==============================
// Generate Math Problem / توليد مسألة رياضية
// ==============================
function genMath(mode) {
  return new Promise((resolve, reject) => {
    // Destructure mode settings / استخراج إعدادات الوضع
    let [a1, a2, b1, b2, ops, time, bonus] = modes[mode]

    // Pick random numbers / اختيار رقمين عشوائيين
    let a = randomInt(a1, a2)
    let b = randomInt(b1, b2)

    // Pick random operator / اختيار عملية عشوائية
    let op = pickRandom([...ops])

    // Calculate result / حساب النتيجة
    let result = (new Function(`return ${a} ${op.replace('/', '*')} ${b < 0 ? `(${b})` : b}`))()

    // If division, swap a and result to ensure integer / إذا كانت القسمة، تبديل الأرقام لضمان أن الناتج عدد صحيح
    if (op == '/') [a, result] = [result, a]

    // Prepare result object / إعداد كائن النتيجة
    let hasil = {
      soal: `${a} ${operators[op]} ${b}`, // Question / السؤال
      mode: mode,                          // Mode / الوضع
      waktu: time,                         // Time limit / الوقت المسموح به
      hadiah: bonus,                       // Bonus points / نقاط المكافأة
      jawaban: result                       // Correct answer / الإجابة الصحيحة
    }

    resolve(hasil) // Return problem / إرجاع المسألة
  })
}

// ==============================
// Module Exports / تصدير الوظائف
// ==============================
module.exports = { modes, operators, randomInt, pickRandom, genMath }