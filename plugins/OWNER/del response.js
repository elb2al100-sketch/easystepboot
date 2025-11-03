// Import necessary functions / استيراد الدوال اللازمة
const { deleteList, getDataByGroupId } = require('@lib/list'); 
const { deleteCache }                  = require('@lib/globalCache');

// Main handler function / الدالة الرئيسية لمعالجة الأمر
async function handle(sock, messageInfo) {
    const { remoteJid, message, content, sender, command, prefix } = messageInfo;

    try {
        // Validate input content / التحقق من محتوى الرسالة / Validate message content
        if (!content) {
            await sock.sendMessage(remoteJid, {
                text: `_⚠️ Usage Format:_ \n\n_💬 Example:_ _*${prefix + command} payment*_` 
                // _⚠️ تنسيق الاستخدام:_ \n\n_💬 مثال:_ _*${prefix + command} payment*_
            }, { quoted: message });
            return; // Stop execution if no content / أوقف التنفيذ إذا لم يكن هناك محتوى
        }

        // Check if the keyword already exists / التحقق مما إذا كانت الكلمة موجودة بالفعل / Check if the keyword exists
        const currentList = await getDataByGroupId('owner'); // get data for 'owner' group / جلب البيانات لمجموعة "المالك"
        const lowercaseKeyword = content.trim().toLowerCase(); // normalize keyword / تحويل الكلمة لحروف صغيرة وتقليم المسافات

        if (currentList?.list?.[lowercaseKeyword]) {
            // Delete keyword from list / حذف الكلمة من القائمة
            await deleteList('owner', lowercaseKeyword);
            deleteCache(`list-owner`);  // Reset cache / إعادة ضبط الكاش

            // Send confirmation message / ارسال رسالة تأكيد
            return sendMessageWithTemplate(
                sock,
                remoteJid,
                `✅ _Keyword *${lowercaseKeyword}* successfully deleted._` 
                // ✅ _تم حذف الكلمة المفتاحية *${lowercaseKeyword}* بنجاح._
                ,
                message
            );
        } else {
            // Keyword not found / الكلمة غير موجودة / Keyword not found
            return sendMessageWithTemplate(
                sock,
                remoteJid,
                `⚠️ _Keyword *${lowercaseKeyword}* not found._` 
                // ⚠️ _الكلمة المفتاحية *${lowercaseKeyword}* غير موجودة._
                ,
                message
            );
        }
    } catch (error) {
        console.error('Error processing command:', error);

        // Send error message / رسالة الخطأ / Error message
        return sendMessageWithTemplate(
            sock,
            remoteJid,
            '_❌ Sorry, an error occurred while processing the data._' 
            // _❌ عذراً، حدث خطأ أثناء معالجة البيانات._
            ,
            message
        );
    }
}

// Function to send a message with template / دالة لإرسال رسالة مع قالب
function sendMessageWithTemplate(sock, remoteJid, text, quoted) {
    return sock.sendMessage(remoteJid, { text }, { quoted });
}

// Export module info / تصدير بيانات الموديول
module.exports = {
    handle,
    Commands    : ['delrespon','deleterespon'], // command names / أسماء الأوامر
    OnlyPremium : false, // Only for premium users? / فقط للمميزين؟ لا
    OnlyOwner   : true   // Only owner? / فقط للمالك؟ نعم
};