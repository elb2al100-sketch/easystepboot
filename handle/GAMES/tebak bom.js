// 💣 استيراد دوال التعامل مع بيانات اللاعبين المؤقتة (قاعدة بيانات اللعبة)
// 💣 Import temporary user data functions (game session database)
const { removeUser, getUser, isUserPlaying } = require("@tmpDB/tebak bom");

// 👤 استيراد دوال إدارة المستخدمين (الحساب، النقاط، الحالة...)
// 👤 Import user management functions (account, money, status, etc.)
const { addUser, updateUser, findUser } = require("@lib/users");

// 💬 استيراد ملف الرسائل العامة للنظام
// 💬 Import predefined message configuration
const mess = require('@mess');


// ⚙️ الدالة الرئيسية لمعالجة الرسائل أثناء اللعبة
// ⚙️ Main function to process incoming messages during the game
async function process(sock, messageInfo) {
    const { remoteJid, fullText, message, sender } = messageInfo;

    // ✅ تحقق إن كان المستخدم حالياً داخل اللعبة
    // ✅ Check if the user is currently playing
    if (isUserPlaying(remoteJid)) {
        const data = getUser(remoteJid); // استرجاع بيانات اللعبة الحالية / Get current game data
        
        // 🔢 التحقق من أن الإدخال رقم فقط (1 إلى 9)
        // 🔢 Validate input to be only numbers (1–9)
        if (!/^\d+$/.test(fullText)) return;
        const guessedNumber = parseInt(fullText, 10);
        if (guessedNumber < 1 || guessedNumber > 9) return;

        // 💥 إذا اختار اللاعب موقع القنبلة
        // 💥 If the player guessed the bomb position
        if (guessedNumber === data.posisiBom) {
            handleUserLoss(sender, data, sock, message, remoteJid);
        } else {
            // ✅ إذا لم يختر القنبلة → متابعة اللعبة
            // ✅ If not the bomb → continue the game
            handleUserGuess(sender, guessedNumber, data, sock, message, remoteJid);
        }

        return false; // ⛔ منع تشغيل الإضافات التالية أثناء اللعبة
    }

    // 🔁 المستخدم ليس في اللعبة → السماح بمتابعة الإضافات الأخرى
    // 🔁 User not in a game → continue to next plugin
    return true;
}


// 💀 دالة التعامل مع خسارة اللاعب
// 💀 Handle when the player hits the bomb
async function handleUserLoss(sender, data, sock, message, remoteJid) {
    const user = await findUser(sender);
    const moneyKalah = data.moneyKalah; // المبلغ المخصوم عند الخسارة / Money lost when losing

    if (user) {
        const moneyUpdate = (user.money || 0) - moneyKalah;
        await updateUser(sender, { money: moneyUpdate });
    } else {
        await addUser(sender, {
            money: 0 - moneyKalah,
            role: "user",
            status: "active",
        });
    }

    // حذف المستخدم من قائمة اللاعبين النشطين
    // Remove player from active game list
    removeUser(remoteJid);

    // 💣 إرسال رسالة الخسارة إلى المستخدم
    // 💣 Send loss message to user
    await sock.sendMessage(
        remoteJid,
        {
            text: `*ANDA KALAH*\n\n_Nomor *${data.posisiBom}* adalah 💣_\n\n_Money Anda -${moneyKalah}_`,
            // 🟡 الترجمة: "لقد خسرت. الرقم ${data.posisiBom} هو القنبلة. تم خصم ${moneyKalah} من رصيدك."
        },
        { quoted: message }
    );
    return false;
}


// 🎯 دالة التعامل مع التخمين الصحيح (وليس القنبلة)
// 🎯 Handle when user guesses a safe number
async function handleUserGuess(sender, guessedNumber, data, sock, message, remoteJid) {
    if (data.terjawab.includes(guessedNumber)) {
        // إذا تم اختيار هذا الرقم مسبقًا → تجاهله
        // Ignore if this number was already chosen
        return;
    }

    const user = await findUser(sender);
    
    // إضافة الرقم إلى قائمة التخمينات المجابة
    // Add guessed number to answered list
    data.terjawab.push(guessedNumber);
    await updateUser(sender, { terjawab: data.terjawab });

    // 🏆 إذا خمن جميع الأرقام بدون القنبلة → فوز
    // 🏆 If all safe numbers are guessed → win
    if (data.terjawab.length >= 8) {
        removeUser(remoteJid);

        if (user) {
            const moneyUpdate = (user.money || 0) + data.moneyMenang;
            await updateUser(sender, { money: moneyUpdate });
        } else {
            await addUser(sender, {
                money: 0 + data.moneyMenang,
                role: "user",
                status: "active",
            });
        }

        // 🎉 إرسال رسالة الفوز
        // 🎉 Send win message
        await sock.sendMessage(
            remoteJid,
            {
                text: `_*Yeahh Anda Menang !*_\n\n_Money Anda *+${data.moneyMenang}*_`,
                // 🟢 الترجمة: "رائع! لقد فزت! تم إضافة ${data.moneyMenang} إلى رصيدك."
            },
            { quoted: message }
        );
        return false;
    }

    // 🪙 إذا استمر اللاعب → أضف له مكافأة بسيطة
    // 🪙 Add small reward for safe guess
    if (user) {
        const moneyUpdate = (user.money || 0) + data.hadiah;
        await updateUser(sender, { money: moneyUpdate });
    } else {
        await addUser(sender, {
            money: 0 + data.hadiah,
            role: "user",
            status: "active",
        });
    }

    // 🔄 تحديث العرض المرئي للوحة اللعبة
    // 🔄 Update the visible game board view
    const updatedView = updateView(data, guessedNumber);
    await sock.sendMessage(
        remoteJid,
        {
            text: `${updatedView}\n\n_*Money Anda +${data.hadiah}*_`,
            // 🔵 الترجمة: "تم تحديث اللوحة. حصلت على ${data.hadiah} مال إضافي."
        },
        { quoted: message }
    );
}


// 🧩 تحديث عرض اللعبة حسب اختيار المستخدم
// 🧩 Update game view based on player's guess
function updateView(data, guessedNumber) {
    const hurufMap = {
        1: 'A', 2: 'B', 3: 'C',
        4: 'D', 5: 'E', 6: 'F',
        7: 'G', 8: 'H', 9: 'I',
    };
    const arrayBuah = data.ListBuah; // قائمة الرموز داخل المربعات / Symbols inside grid

    if (guessedNumber >= 1 && guessedNumber <= 9) {
        const huruf = hurufMap[guessedNumber];
        const [row, col] = [(guessedNumber - 1) / 3 | 0, (guessedNumber - 1) % 3];
        data.bomView_User = data.bomView_User.replace(huruf, arrayBuah[row][col]);
    }

    return formatView(data.bomView_User);
}


// 🧱 تنسيق عرض اللوحة على شكل شبكة 3×3 باستخدام الرموز التعبيرية
// 🧱 Format the game board into a 3×3 grid with emoji
function formatView(view) {
    const hurufToEmoji = {
        'A': '1️⃣', 'B': '2️⃣', 'C': '3️⃣',
        'D': '4️⃣', 'E': '5️⃣', 'F': '6️⃣',
        'G': '7️⃣', 'H': '8️⃣', 'I': '9️⃣',
    };

    return view
        .split(' ')
        .map((huruf) => hurufToEmoji[huruf] || huruf)
        .reduce((acc, emoji, idx) => {
            acc += emoji + ((idx + 1) % 3 === 0 ? '\n' : '');
            return acc;
        }, '');
}


// 📦 تصدير المكون حتى يتمكن النظام من استخدامه
// 📦 Export the module for system use
module.exports = {
    name: "Tebak Angka", // (يفترض أن يكون Tebak Bom) / Should be "Tebak Bom"
    priority: 10,
    process,
};