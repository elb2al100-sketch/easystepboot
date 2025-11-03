// Import utilities and user database functions
// استيراد الأدوات ووظائف قاعدة بيانات المستخدمين
const { findUser, updateUser, addUser } = require("@lib/users");
const { sendMessageWithMention, determineUser } = require("@lib/utils");

async function handle(sock, messageInfo) {
  const {
    remoteJid,
    message,
    sender,
    mentionedJid,
    isQuoted,
    content,
    prefix,
    command,
    senderType,
  } = messageInfo;

  try {
    // Validate input
    // التحقق من صحة المدخلات
    if (!content || content.trim() === "") {
      const tex = `_⚠️ Please enter a valid format_\n_💬 Example:_ *${
        prefix + command
      } 6285246154386 30*\n_⚠️ الرجاء إدخال تنسيق صحيح_\n_💬 مثال:_ *${
        prefix + command
      } 6285246154386 30*`;
      return await sock.sendMessage(remoteJid, { text: tex }, { quoted: message });
    }

    let [phoneNumber, premiumDays] = content.split(" ");

    const userToAction = determineUser(mentionedJid, isQuoted, phoneNumber);

    // Remove all non-digit characters from phone number
    // إزالة جميع الأحرف غير الرقمية من رقم الهاتف
    phoneNumber = userToAction.replace(/\D/g, "");

    // Further validation of input
    // تحقق إضافي من المدخلات
    if (!phoneNumber || !premiumDays || isNaN(premiumDays)) {
      const tex = "⚠️ _Make sure the format is correct: .addprem 6285246154386 30_\n⚠️ _تأكد من صحة التنسيق: .addprem 6285246154386 30_";
      return await sock.sendMessage(remoteJid, { text: tex }, { quoted: message });
    }

    // Validate phone number format (10-15 digits)
    // التحقق من تنسيق الرقم (10-15 رقم)
    if (!/^\d{10,15}$/.test(phoneNumber)) {
      return await sock.sendMessage(remoteJid, {
        text: `_Invalid phone number. Make sure the format is correct_\n_Example: *${
          prefix + command
        } 628xxx* 30_\n_رقم الهاتف غير صالح. تأكد من صحة التنسيق_\n_مثال: *${
          prefix + command
        } 628xxx* 30_`,
      }, { quoted: message });
    }

    // Add @s.whatsapp.net domain to the phone number
    // إضافة نطاق @s.whatsapp.net إلى رقم الهاتف
    phoneNumber = `${phoneNumber}@s.whatsapp.net`;

    // Retrieve user data
    // استرجاع بيانات المستخدم
    let userData = await findUser(phoneNumber);

    // If user does not exist, create a new user
    // إذا لم يكن المستخدم موجودًا، إنشاء مستخدم جديد
    if (!userData) {
      userData = {
        money: 0,
        role: "user",
        status: "active",
        premium: null, // No previous premium
      };
      await addUser(phoneNumber, userData); // Add new user
    }

    // Calculate new premium time from today
    // حساب فترة البريميوم الجديدة من اليوم
    const currentDate = new Date();
    const addedPremiumTime = currentDate.setDate(
      currentDate.getDate() + parseInt(premiumDays)
    ); // Add premium days

    // Update user's premium data
    // تحديث بيانات البريميوم للمستخدم
    userData.premium = new Date(addedPremiumTime).toISOString(); // Save in ISO 8601 format

    // Update user data in the database
    // تحديث بيانات المستخدم في قاعدة البيانات
    await updateUser(phoneNumber, userData);

    // Display message that premium has been added
    // عرض رسالة بأن البريميوم تمت إضافته
    const premiumEndDate = new Date(addedPremiumTime);
    const responseText = `_User's premium period_ @${
      phoneNumber.split("@")[0]
    } _has been extended until:_ ${premiumEndDate.toLocaleString()}\n_تم تمديد فترة البريميوم للمستخدم_ @${
      phoneNumber.split("@")[0]
    } _حتى:_ ${premiumEndDate.toLocaleString()}`;

    // Send message with mention
    // إرسال رسالة مع المنشن
    await sendMessageWithMention(
      sock,
      remoteJid,
      responseText,
      message,
      senderType
    );
  } catch (error) {
    console.error("Error processing premium addition:", error);

    // Send error message to the user
    // إرسال رسالة خطأ للمستخدم
    await sock.sendMessage(remoteJid, {
      text: "An error occurred while processing data. Please try again later.\nحدث خطأ أثناء معالجة البيانات. يرجى المحاولة مرة أخرى لاحقًا.",
    }, { quoted: message });
  }
}

module.exports = {
  handle,
  Commands: ["addprem", "addpremium"], // Command names
  OnlyPremium: false,
  OnlyOwner: true, // Only owner can access
};