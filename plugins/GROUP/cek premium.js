const { findUser, updateUser, addUser } = require("@lib/users");

async function handle(sock, messageInfo) {
    const { remoteJid, message, sender } = messageInfo;

    try {
        // English: Get user data
        // العربية: استرجاع بيانات المستخدم
        let userData = await findUser(sender);

        // English: If user not found, add a new user
        // العربية: إذا لم يتم العثور على المستخدم، أضف مستخدم جديد
        if (!userData) {
            userData = {
                money: 0,
                role: "user",
                status: "active",
                premium: null,
            };

            // English: Add to database
            // العربية: أضف إلى قاعدة البيانات
            await addUser(sender, userData);
        }

        // English: Determine premium status with a clear message
        // العربية: تحديد حالة العضوية المميزة برسالة واضحة
        let premiumStatus;
        if (userData.premium) {
            const premiumEndDate = new Date(userData.premium);
            const now = new Date();
            
            if (premiumEndDate > now) {
                premiumStatus = `📋 _Your Premium status is valid until:_ ${premiumEndDate.toLocaleString()}\n\n📋 _حالة البريميوم الخاصة بك صالحة حتى:_ ${premiumEndDate.toLocaleString()}`;
            } else {
                premiumStatus = "📋 _Your Premium subscription has expired_\n\n📋 _انتهت صلاحية الاشتراك البريميوم الخاص بك_";
            }
        } else {
            premiumStatus = "📋 _You currently do not have a Premium subscription_\n\n📋 _حالياً لا تملك عضوية بريميوم_";
        }
        
        const responseText = `_Hello_ @${sender.split('@')[0]} \n\n${premiumStatus}\n\n_مرحباً_ @${sender.split('@')[0]} \n\n${premiumStatus}`;

        // English: Send message to user with mentions
        // العربية: إرسال رسالة للمستخدم مع الإشارة إليه
        await sock.sendMessage(
            remoteJid,
            { text: responseText, mentions: [sender] },
            { quoted: message }
        );
    } catch (error) {
        console.error("Error handling user data:", error);

        // English: Send error message to user
        // العربية: إرسال رسالة خطأ للمستخدم
        await sock.sendMessage(
            remoteJid,
            { text: "❌ _An error occurred while processing your data. Please try again later._\n\n❌ _حدث خطأ أثناء معالجة بياناتك. يرجى المحاولة لاحقًا._" },
            { quoted: message }
        );
    }
}

module.exports = {
    handle,
    Commands    : ["cekprem","cekpremium"], // English: Check Premium | العربية: تحقق من البريميوم
    OnlyPremium : false,
    OnlyOwner   : false,
};