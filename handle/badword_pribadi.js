// Feature toggle: set to true to activate the feature / مفتاح تفعيل الميزة: اجعله true لتفعيل الميزة
const on_fitur = false;

// List of bad words / قائمة الكلمات الممنوعة
const badword = ["kontol", "memek", "puki", "babi", "bajingan", "anjing"];

// Message to send if a bad word is detected / رسالة للإرسال عند اكتشاف كلمة ممنوعة
const pesan_badword =
  "⚠️ Mohon Maaf Kamu Akan di blokir karena mengirim pesan badword"; 
  // ⚠️ Sorry, you will be blocked for sending a badword / ⚠️ عذراً، سيتم حظرك لإرسال كلمة ممنوعة

// Main processing function / الدالة الرئيسية للمعالجة
async function process(sock, messageInfo) {
  const { sender, isGroup, fullText, message } = messageInfo;

  if (isGroup || !on_fitur) return true; 
  // Skip if message is from a group or feature is inactive / تخطي الرسائل من المجموعات أو إذا كانت الميزة غير مفعلة

  try {
    // Check if the text contains a bad word / التحقق مما إذا كان النص يحتوي على كلمة ممنوعة
    if (badword.some((word) => fullText.toLowerCase().includes(word))) {
      await sock.sendMessage(
        sender,
        { text: pesan_badword }, // Send warning message / إرسال رسالة التحذير
        { quoted: message } // Quote the original message / اقتباس الرسالة الأصلية
      );
      await sock.updateBlockStatus(sender, "block"); // Block the user / حظر المستخدم
    }
  } catch (error) {
    console.error("Error in badword pribadi process:", error); 
    // Log any errors / تسجيل أي أخطاء
  }
}

// Export the plugin module / تصدير وحدة البرنامج المساعد
module.exports = {
  name: "Badword Pribadi", // Plugin name / اسم البرنامج المساعد
  priority: 10, // Plugin priority / أولوية البرنامج المساعد
  process, // Process function / دالة المعالجة
};