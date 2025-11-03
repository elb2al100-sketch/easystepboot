const { findUser, updateUser } = require("@lib/users");

async function handle(sock, messageInfo) {
    const { remoteJid, message, content, sender, command, prefix } = messageInfo;

    // English: Validate empty input
    // العربية: التحقق من الإدخال الفارغ
    if (!content || content.trim() === "") {
        return await sock.sendMessage(
            remoteJid,
            {
                text: `⚠️ _Please enter a valid format | الرجاء إدخال صيغة صحيحة_\n\n_Example | مثال: *${prefix + command} 6285246154386 50*_\n\n_Or tag the person | أو ضع الوسم للشخص_ \n*${prefix + command} @tag 50*`,
            },
            { quoted: message }
        );
    }

    try {
        // English: Split content into arguments
        // العربية: تقسيم المحتوى إلى متغيرات
        const args = content.trim().split(/\s+/);
        if (args.length < 2) {
            return await sock.sendMessage(
                remoteJid,
                {
                    text: `⚠️ _Invalid format. Example | صيغة غير صحيحة. مثال:_ *${prefix + command} 6285246154386 50*`,
                },
                { quoted: message }
            );
        }

        const target = args[0]; // English: Recipient number or tag | العربية: رقم المستقبل أو الوسم
        const moneyToSend = parseInt(args[1], 10);

        // English: Validate money amount
        // العربية: التحقق من صحة كمية المال
        if (isNaN(moneyToSend) || moneyToSend <= 0) {
            return await sock.sendMessage(
                remoteJid,
                {
                    text: `⚠️ _Money amount must be a positive number | يجب أن يكون المبلغ رقمًا موجبًا_\n\n_Example | مثال: *${prefix + command} 628xxxxx 50*_`,
                },
                { quoted: message }
            );
        }

        // English: Determine target WhatsApp ID (handle tag or number)
        // العربية: تحويل الرقم أو الوسم إلى معرف واتساب صالح
        const targetNumber = target.startsWith("@") ? target.replace("@", "").trim() : target;
        const targetId = targetNumber.includes("@s.whatsapp.net") ? targetNumber : `${targetNumber}@s.whatsapp.net`;

        // English: Cannot send money to self
        // العربية: لا يمكن إرسال المال لنفس المستخدم
        if (targetId === sender) {
            return await sock.sendMessage(
                remoteJid,
                { text: `⚠️ _You cannot send money to yourself | لا يمكنك إرسال المال لنفسك._` },
                { quoted: message }
            );
        }

        // English: Get sender data
        // العربية: جلب بيانات المرسل
        const senderData = await findUser(sender);

        // English: Validate sender has enough money
        // العربية: التحقق من أن المرسل لديه رصيد كافي
        if (senderData.money < moneyToSend) {
            return await sock.sendMessage(
                remoteJid,
                { text: `⚠️ _You don't have enough money to send ${moneyToSend} | ليس لديك رصيد كافي لإرسال ${moneyToSend}._` },
                { quoted: message }
            );
        }

        // English: Get receiver data
        // العربية: جلب بيانات المستقبل
        const receiverData = await findUser(targetId);

        if (!receiverData) {
            return await sock.sendMessage(
                remoteJid,
                { text: `⚠️ _User not found with that number/tag | لم يتم العثور على المستخدم بهذا الرقم أو الوسم._` },
                { quoted: message }
            );
        }

        // English: Update sender and receiver money
        // العربية: تحديث رصيد المال للمرسل والمستقبل
        await updateUser(sender, { money: senderData.money - moneyToSend });
        await updateUser(targetId, { money: receiverData.money + moneyToSend });

        // English: Send success message
        // العربية: إرسال رسالة نجاح
        return await sock.sendMessage(
            remoteJid,
            {
                text: `✅ _Successfully sent ${moneyToSend} money to ${targetNumber} | تم إرسال ${moneyToSend} من المال بنجاح إلى ${targetNumber}._\n\nType *.me* to check your account | اكتب *.me* لعرض تفاصيل حسابك.`,
            },
            { quoted: message }
        );
    } catch (error) {
        console.error("Error occurred | حدث خطأ:", error);

        // English: Send error message
        // العربية: إرسال رسالة خطأ
        return await sock.sendMessage(
            remoteJid,
            {
                text: `⚠️ _An error occurred while processing your request. Please try again later | حدث خطأ أثناء معالجة طلبك. حاول مرة أخرى لاحقًا._`,
            },
            { quoted: message }
        );
    }
}

module.exports = {
    handle,
    Commands    : ["sendmoney"],
    OnlyPremium : false,
    OnlyOwner   : false
};