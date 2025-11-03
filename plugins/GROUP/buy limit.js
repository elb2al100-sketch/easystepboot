const { findUser, updateUser } = require("@lib/users");

async function handle(sock, messageInfo) {
    const { remoteJid, message, content, sender, prefix, command } = messageInfo;

    // English: Validate empty input
    // العربية: التحقق من وجود إدخال فارغ
    if (!content || content.trim() === '') {
        return await sock.sendMessage(
            remoteJid,
            { 
                text: `_⚠️ Usage Format:_ \n\n_💬 Example:_ _*${prefix + command} 50*_\n\n_Note: *1* limit = *20* money_\n\n_⚠️ صيغة الاستخدام:_ \n\n_💬 مثال:_ _*${prefix + command} 50*_\n\n_ملاحظة: *1* limit = *20* money_`
            },
            { quoted: message }
        );
    }

    // English: Ensure content is a positive number
    // العربية: التأكد أن المحتوى رقم صحيح وإيجابي
    const limitToBuy = parseInt(content.trim(), 10);
    if (isNaN(limitToBuy) || limitToBuy <= 0) {
        return await sock.sendMessage(
            remoteJid,
            { 
                text: `⚠️ _The limit amount must be a positive number_\n\n_Example: *buylimit 50*_\n\n⚠️ _يجب أن يكون عدد الـ limit رقمًا إيجابيًا_\n\n_مثال: *buylimit 50*_`
            },
            { quoted: message }
        );
    }

    // English: Price per limit
    // العربية: سعر كل limit
    const pricePerLimit = 20;
    const totalCost = limitToBuy * pricePerLimit;

    // English: Get user data
    // العربية: استرجاع بيانات المستخدم
    const dataUsers = await findUser(sender);

    // English: Validate if user has enough balance
    // العربية: التحقق من أن المستخدم لديه رصيد كافي
    if (dataUsers.money < totalCost) {
        return await sock.sendMessage(
            remoteJid,
            { 
                text: `⚠️ _You don't have enough balance to buy *${limitToBuy}* limits._\n\n_Total price:_ ${totalCost} money\n_Your balance:_ ${dataUsers.money} money\n\n⚠️ _لا يوجد لديك رصيد كافي لشراء *${limitToBuy}* limit._\n\n_السعر الإجمالي:_ ${totalCost} money\n_رصيدك:_ ${dataUsers.money} money`
            },
            { quoted: message }
        );
    }

    // English: Update user data
    // العربية: تحديث بيانات المستخدم
    await updateUser(sender, {
        limit: dataUsers.limit + limitToBuy, // English: Increase limit | العربية: زيادة limit
        money: dataUsers.money - totalCost,  // English: Deduct money | العربية: خصم المال
    });

    // English: Send success message
    // العربية: إرسال رسالة نجاح
    return await sock.sendMessage(
        remoteJid,
        { 
            text: `✅ _Limit purchase successful! 🎉_\n\n_Limit increased by: *${limitToBuy}*_\n_Your balance:_ ${dataUsers.money - totalCost} money\n\n✅ _تم شراء limit بنجاح! 🎉_\n\n_تم زيادة limit بمقدار: *${limitToBuy}*_\n_رصيدك:_ ${dataUsers.money - totalCost} money`
        },
        { quoted: message }
    );
}

module.exports = {
    handle,
    Commands    : ['buylimit'], 
    OnlyPremium : false, 
    OnlyOwner   : false
};