const { findUser, updateUser, addUser } = require("@lib/users");
// User database functions / دوال قاعدة بيانات المستخدمين
const { formatRemainingTime } = require("@lib/utils");
// Utility to format remaining time / أداة لتنسيق الوقت المتبقي

/**
 * Main handler for the claim command
 * الدالة الرئيسية لمعالجة أمر المطالبة بالمكافأة
 */
async function handle(sock, messageInfo) {
    const { remoteJid, message, sender } = messageInfo;

    const CLAIM_COOLDOWN_MINUTES = 60; // 60 minutes or 1 hour / 60 دقيقة أو ساعة واحدة
    const MIN_CLAIM = 1000;            // Minimum claim amount / الحد الأدنى للمكافأة
    const MAX_CLAIM = 10000;           // Maximum claim amount / الحد الأقصى للمكافأة

    // Randomly determine money and limit claim / تحديد المال والحدود عشوائياً
    const MoneyClaim = Math.floor(Math.random() * (MAX_CLAIM - MIN_CLAIM + 1)) + MIN_CLAIM;
    const LimitClaim = Math.floor(Math.random() * (MAX_CLAIM - MIN_CLAIM + 1)) + MIN_CLAIM;

    // Retrieve user data / جلب بيانات المستخدم
    const dataUsers = await findUser(sender);
    if (dataUsers) {
        const currentTime = Date.now();
        const CLAIM_COOLDOWN = CLAIM_COOLDOWN_MINUTES * 60 * 1000; // Convert minutes to milliseconds / تحويل الدقائق إلى ميلي ثانية

        // Check if user has already claimed within cooldown / التحقق مما إذا كان المستخدم قد طلب المكافأة خلال فترة الانتظار
        if (dataUsers.lastClaim && currentTime - dataUsers.lastClaim < CLAIM_COOLDOWN) {
            const remainingTime = Math.floor((CLAIM_COOLDOWN - (currentTime - dataUsers.lastClaim)) / 1000);
            const formattedTime = formatRemainingTime(remainingTime);
            return await sock.sendMessage(
                remoteJid,
                { text: `🔒 _You have already claimed!_ _Please wait *${formattedTime}* before claiming again_. / لقد قمت بالمطالبة مسبقاً! الرجاء الانتظار *${formattedTime}* قبل أن تتمكن من المطالبة مرة أخرى.` },
                { quoted: message }
            );
        }

        // Update user data with new claim and claim time / تحديث بيانات المستخدم بالمكافأة الجديدة ووقت المطالبة
        await updateUser(sender, {
            money: dataUsers.money + MoneyClaim, // Add earned money / إضافة المال المكتسب
            limit: dataUsers.limit + LimitClaim, // Add earned limit / إضافة الحد المكتسب
            lastClaim: currentTime,               // Save last claim time / حفظ وقت آخر مطالبة
        });

        return await sock.sendMessage(
            remoteJid,
            { text: `_You received *${MoneyClaim}*_ money and *${LimitClaim}* limit! / لقد حصلت على *${MoneyClaim}* مال و *${LimitClaim}* حد!_` },
            { quoted: message }
        );
    } else {
        // Add user if not exist / إضافة المستخدم إذا لم يكن موجوداً
        await addUser(sender, {
            money: MoneyClaim,
            role: "user",
            status: "active",
            lastClaim: Date.now(), // Save first claim time / حفظ وقت أول مطالبة
        });

        return await sock.sendMessage(
            remoteJid,
            { text: `Welcome! You received *${MoneyClaim}* money. / أهلاً بك! لقد حصلت على *${MoneyClaim}* مال.` },
            { quoted: message }
        );
    }
}

module.exports = {
    handle,
    Commands    : ['claim'], // Command processed by this handler / الأمر الذي يعالجه هذا الهاندلر
    OnlyPremium : false,
    OnlyOwner   : false
};