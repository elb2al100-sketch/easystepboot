const { findUser, updateUser } = require("@lib/users");

async function handle(sock, messageInfo) {
    const { remoteJid, message, content, sender, command, prefix } = messageInfo;

    // English: List of valid roles
    // العربية: قائمة الأدوار الصالحة
    const roleArr = [
        "gamers", "coding", "conqueror", "100", "content creator", "fotografer",
        "music", "ilmuwan", "petualang", "hacker", "snake", "bull", "bear",
        "tiger", "cobra", "wolf", "imortal"
    ];

    // English: Validate empty input
    // العربية: التحقق من الإدخال الفارغ
    if (!content || !content.trim()) {
        const roleERR = `_Choose a Role Below | اختر دورًا من الأسفل:_\n\n${roleArr.map(role => `◧ ${role}`).join("\n")}\n\n_Example | مثال:_ _*${prefix + command} music*_`;
        return await sock.sendMessage(
            remoteJid,
            { text: roleERR },
            { quoted: message }
        );
    }

    // English: Validate role exists
    // العربية: التحقق من صحة الدور المدخل
    if (!roleArr.includes(content.toLowerCase())) {
        return await sock.sendMessage(
            remoteJid,
            {
                text: `⚠️ _Role "${content}" is not valid | الدور "${content}" غير صالح._\nPlease choose one of the roles below | يرجى اختيار أحد الأدوار أدناه:\n\n${roleArr.map(role => `◧ ${role}`).join("\n")}`,
            },
            { quoted: message }
        );
    }

    // English: Get user data
    // العربية: جلب بيانات المستخدم
    try {
        const dataUsers = await findUser(sender);

        // English: Validate user level
        // العربية: التحقق من مستوى المستخدم
        if (dataUsers.level < 10) {
            return await sock.sendMessage(
                remoteJid,
                {
                    text: `⚠️ _To change your account role, minimum level is 10 | لتغيير دور الحساب، الحد الأدنى للمستوى هو 10._\n\n_Your current level | مستواك الحالي: ${dataUsers.level}_`,
                },
                { quoted: message }
            );
        }

        // English: Update user's role/achievement
        // العربية: تحديث دور المستخدم / الإنجاز
        await updateUser(sender, { achievement: content });

        // English: Send success message
        // العربية: إرسال رسالة نجاح
        return await sock.sendMessage(
            remoteJid,
            {
                text: `✅ _Successfully changed your account role to_ "${content}" | تم تغيير دور حسابك بنجاح إلى "${content}".\n\n_Type *.me* to view account details | اكتب *.me* لعرض تفاصيل الحساب._`,
            },
            { quoted: message }
        );
    } catch (error) {
        console.error("Error processing user | خطأ أثناء معالجة المستخدم:", error);

        // English: Send error message
        // العربية: إرسال رسالة خطأ
        return await sock.sendMessage(
            remoteJid,
            {
                text: "⚠️ _An error occurred while processing your request. Please try again later | حدث خطأ أثناء معالجة طلبك. حاول مرة أخرى لاحقًا._",
            },
            { quoted: message }
        );
    }
}

module.exports = {
    handle,
    Commands    : ["setakun"],
    OnlyPremium : false,
    OnlyOwner   : false
};