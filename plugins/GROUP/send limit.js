const { findUser, updateUser } = require("@lib/users");

async function handle(sock, messageInfo) {
    const { remoteJid, message, content, sender, command, prefix } = messageInfo;

    // English: Validate empty input
    // العربية: التحقق من الإدخال الفارغ
    if (!content || content.trim() === "") {
        return await sock.sendMessage(remoteJid,
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
        const limitToSend = parseInt(args[1], 10);

        // English: Validate limit number
        // العربية: التحقق من صحة الرقم المرسل
        if (isNaN(limitToSend) || limitToSend <= 0) {
            return await sock.sendMessage(
                remoteJid,
                { text: `⚠️ _Limit must be a positive number | يجب أن يكون الحد رقمًا موجبًا_\n\n_Example | مثال: *${prefix + command} 628xxxxx 50*_` },
                { quoted: message }
            );
        }

        // English: Determine target WhatsApp ID
        // العربية: تحويل الرقم أو الوسم إلى معرف واتساب صالح
        const targetNumber = target.startsWith("@") ? target.replace("@", "").trim() : target;
        const targetId = targetNumber.includes("@s.whatsapp.net") ? targetNumber : `${targetNumber}@s.whatsapp.net`;

        // English: Cannot send limit to self
        // العربية: لا يمكن إرسال الحد لنفس المستخدم
        if (targetId === sender) {
            return await sock.sendMessage(
                remoteJid,
                { text: `⚠️ _You cannot send limit to yourself | لا يمكنك إرسال الحد لنفسك._` },
                { quoted: message }
            );
        }

        // English: Get sender data
        // العربية: جلب بيانات المرسل
        const senderData = await findUser(sender);

        // English: Validate sender has enough limit
        // العربية: التحقق من أن المرسل لديه حد كافي
        if (senderData.limit < limitToSend) {
            return await sock.sendMessage(
                remoteJid,
                { text: `⚠️ _You don't have enough limit to send ${limitToSend} | ليس لديك حد كافي لإرسال ${limitToSend}._` },
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

        // English: Update sender and receiver limit
        // العربية: تحديث الحد للمرسل والمستقبل
        await updateUser(sender, { limit: senderData.limit - limitToSend });
        await updateUser(targetId, { limit: receiverData.limit + limitToSend });

        // English: Send success message
        // العربية: إرسال رسالة نجاح
        return await sock.sendMessage(
            remoteJid,
            {
                text: `✅ _Successfully sent ${limitToSend} limit to ${targetNumber} | تم إرسال ${limitToSend} حد بنجاح إلى ${targetNumber}._\n\nType *.me* to check your account details | اكتب *.me* لعرض تفاصيل حسابك.`,
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
    Commands    : ["sendlimit"],
    OnlyPremium : false,
    OnlyOwner   : false
};