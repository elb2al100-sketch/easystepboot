const { addSewa, findSewa }     = require("@lib/sewa");
const config                    = require("@config");
const { selisihHari, hariini }  = require("@lib/utils");
const { deleteCache }           = require('@lib/globalCache');

async function handle(sock, messageInfo) {
    const { remoteJid, message, content, sender, prefix, command } = messageInfo;
    
    // Validate input is not empty
    // التحقق من أن المدخلات غير فارغة
    if (!content || content.trim() === '') {
        return await sock.sendMessage(
            remoteJid,
            { 
                text: `_⚠️ Usage Format:_ \n\n💬 Example:_ _*${prefix + command} xxxx@g.us 30*_\n\n_*30* means 30 days, bot will leave automatically when expired_\n\n_If bot is already in the rental group and you want to extend, type *.tambahsewa*_ \n\n⚠️ صيغة الاستخدام:\n\n💬 مثال:_ _*${prefix + command} xxxx@g.us 30*_\n\n_*30* تعني 30 يوم، سيخرج البوت تلقائيًا عند انتهاء المدة_\n\n_إذا كان البوت موجودًا بالفعل في مجموعة الإيجار وللتجديد، اكتب *.tambahsewa*_` 
            },
            { quoted: message }
        );
    }

    // Split input into array (group ID + days)
    // تقسيم المدخلات إلى مصفوفة (ID المجموعة + عدد الأيام)
    const args = content.trim().split(" ");
    if (args.length < 2) {
        return await sock.sendMessage(
            remoteJid,
            { 
                text: `⚠️ Invalid format. Example:\n\n_*${prefix + command} xxx@g.us 30*_ \n\n⚠️ صيغة غير صحيحة. مثال:\n\n_*${prefix + command} xxx@g.us 30*_` 
            },
            { quoted: message }
        );
    }

    const linkGrub = args[0]; // Get group ID
    const totalHari = parseInt(args[1], 10); // Convert days to number

    // Validate group ID
    // التحقق من صحة ID المجموعة
    if (!linkGrub.includes("@g.us")) {
        return await sock.sendMessage(
            remoteJid,
            { 
                text: `⚠️ Group ID must contain '@g.us'. Example:\n\n_*${prefix + command} xxx@g.us 30*_ \n\n⚠️ يجب أن يحتوي ID المجموعة على '@g.us'. مثال:\n\n_*${prefix + command} xxx@g.us 30*_` 
            },
            { quoted: message }
        );
    }

    // Validate total days
    // التحقق من صحة عدد الأيام
    if (isNaN(totalHari) || totalHari <= 0) {
        return await sock.sendMessage(
            remoteJid,
            { 
                text: `⚠️ Invalid number of days. Example:\n\n_*${prefix + command} xxx@g.us 30*_ \n\n⚠️ عدد الأيام غير صحيح. مثال:\n\n_*${prefix + command} xxx@g.us 30*_` 
            },
            { quoted: message }
        );
    }

    // Calculate expiration timestamp
    // حساب تاريخ انتهاء الإيجار
    const currentDate = new Date();
    const expirationDate = new Date(currentDate.getTime() + (totalHari * 24 * 60 * 60 * 1000) + (1 * 60 * 60 * 1000)); // +1 hour
    const timestampExpiration = expirationDate.getTime();

    try {

        // Add rental info to database
        // إضافة بيانات الإيجار إلى قاعدة البيانات
        await addSewa(linkGrub, {
            linkGrub: linkGrub,
            start: hariini,
            expired: timestampExpiration
        });

        deleteCache(`sewa-${remoteJid}`);  // Reset cache
        // إعادة الكاش

        // Send success message
        // إرسال رسالة نجاح
        return await sock.sendMessage(
            remoteJid,
            { 
                text: `_*Bot has joined the group*_ \n\nBot Number: ${config.phone_number_bot}\nExpires in: *${selisihHari(timestampExpiration)}*\n\n_To check rental status type *.ceksewa* in the group_\n\n_*انضم البوت إلى المجموعة*_ \n\nرقم البوت: ${config.phone_number_bot}\nانتهاء: *${selisihHari(timestampExpiration)}*\n\n_للتحقق من حالة الإيجار اكتب *.ceksewa* في المجموعة_`
            },
            { quoted: message }
        );

    } catch (error) {
        console.log(error)
    
        // Default error message
        // رسالة الخطأ الافتراضية
        let info = '_Make sure the group ID is valid._ \n\n_تأكد من صحة ID المجموعة._';
    
        // Check for specific error
        // التحقق من الخطأ المحدد
        if (error instanceof Error && error.message.includes('not-authorized')) {
            info = `_You may have been removed from the group before. Solution: invite bot again or add manually._ \n\n_قد تكون قد تم طرد البوت من المجموعة سابقاً. الحل: أعد دعوة البوت أو أضفه يدويًا._`;
        }
    
        // Send error message
        // إرسال رسالة خطأ للمستخدم
        return await sock.sendMessage(
            remoteJid,
            {
                text: `⚠️ _Failed to join the group._\n\n${info}\n\n⚠️ فشل البوت في الانضمام للمجموعة.\n\n${info}`
            },
            { quoted: message }
        );
    }
}

module.exports = {
    handle,
    Commands    : ['sewabotid'],
    OnlyPremium : false,
    OnlyOwner   : true
};