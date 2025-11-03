const { addSewa, findSewa }     = require("@lib/sewa");
const config                    = require("@config");
const { selisihHari, hariini }  = require("@lib/utils");
const { deleteCache }           = require('@lib/globalCache');

async function handle(sock, messageInfo) {
    let { remoteJid, message, content, sender, prefix, command } = messageInfo;
    
    // Validate input is not empty
    // التحقق من أن المدخلات غير فارغة
    if (!content || content.trim() === '') {
        return await sock.sendMessage(
            remoteJid,
            { 
                text: `_⚠️ Usage Format:_ \n\n💬 Example:_ _*${prefix + command} https://chat.whatsapp.com/xxx 30*_\n\n_*30* means 30 days, bot will leave automatically when expired_\n\n_If the bot is already in the rental group and you want to extend, type *.tambahsewa*_ \n\n⚠️ صيغة الاستخدام:\n\n💬 مثال:_ _*${prefix + command} https://chat.whatsapp.com/xxx 30*_\n\n_*30* تعني 30 يوم، سيخرج البوت تلقائيًا عند انتهاء المدة_\n\n_إذا كان البوت موجودًا بالفعل في مجموعة الإيجار وللتجديد، اكتب *.tambahsewa*_` 
            },
            { quoted: message }
        );
    }

    // Clean up link if contains ?mode
    // إزالة أي ?mode من الرابط
    content = content.replace(/\?mode=[^ ]+/gi, '');

    // Split content into array (link + days)
    // تقسيم المدخلات إلى مصفوفة (رابط + عدد الأيام)
    const args = content.trim().split(" ");
    if (args.length < 2) {
        return await sock.sendMessage(
            remoteJid,
            { 
                text: `⚠️ Invalid format. Example:\n\n_*${prefix + command} https://chat.whatsapp.com/xxx 30*_ \n\n⚠️ صيغة غير صحيحة. مثال:\n\n_*${prefix + command} https://chat.whatsapp.com/xxx 30*_` 
            },
            { quoted: message }
        );
    }

    const linkGrub = args[0]; // Get group link
    const totalHari = parseInt(args[1], 10); // Convert days to number

    // Validate group link
    // التحقق من صحة الرابط
    if (!linkGrub.includes("chat.whatsapp.com")) {
        return await sock.sendMessage(
            remoteJid,
            { 
                text: `⚠️ Group link must contain 'chat.whatsapp.com'. Example:\n\n_*${prefix + command} https://chat.whatsapp.com/xxx 30*_ \n\n⚠️ يجب أن يحتوي الرابط على 'chat.whatsapp.com'. مثال:\n\n_*${prefix + command} https://chat.whatsapp.com/xxx 30*_` 
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
                text: `⚠️ Invalid number of days. Example:\n\n_*${prefix + command} https://chat.whatsapp.com/xxx 30*_ \n\n⚠️ عدد الأيام غير صحيح. مثال:\n\n_*${prefix + command} https://chat.whatsapp.com/xxx 30*_` 
            },
            { quoted: message }
        );
    }

    // Extract invite code from link
    // استخراج رمز الدعوة من الرابط
    const result_sewa = linkGrub.split('https://chat.whatsapp.com/')[1];
    let res_linkgc = '';

    const currentDate = new Date();
    const expirationDate = new Date(currentDate.getTime() + (totalHari * 24 * 60 * 60 * 1000) + (1 * 60 * 60 * 1000)); // +1 hour
    const timestampExpiration = expirationDate.getTime();

    try {
        // Query group info using invite code
        // استعلام عن بيانات المجموعة باستخدام رمز الدعوة
        const res = await sock.query({ 
            tag: "iq", 
            attrs: { type: "get", xmlns: "w:g2", to: "@g.us" }, 
            content: [{ tag: "invite", attrs: { code: result_sewa } }]
        });

        res_linkgc = res.content[0].attrs.id;
        const res_namegc = res.content[0].attrs.subject;
        res_linkgc = res_linkgc + '@g.us';
     
        await sock.groupAcceptInvite(result_sewa).then(() => console.log('Joined')).catch(() => console.log('Failed'));

        // Add rental info to database
        // إضافة بيانات الإيجار إلى قاعدة البيانات
        await addSewa(res_linkgc, {
            linkGrub: linkGrub,
            start: hariini,
            expired: timestampExpiration
        });

        deleteCache(`sewa-${remoteJid}`);  // reset cache
        // إعادة الكاش

        // Send success message
        // إرسال رسالة نجاح
        return await sock.sendMessage(
            remoteJid,
            { 
                text: `_*Bot has joined the group*_ \n\nName: *${res_namegc}*\nBot Number: ${config.phone_number_bot}\nExpires in: *${selisihHari(timestampExpiration)}*\n\n_To check rental status type *.ceksewa* in the group_\n\n_*انضم البوت إلى المجموعة*_ \n\nالاسم: *${res_namegc}*\nرقم البوت: ${config.phone_number_bot}\nانتهاء: *${selisihHari(timestampExpiration)}*\n\n_للتحقق من حالة الإيجار اكتب *.ceksewa* في المجموعة_`
            },
            { quoted: message }
        );

    } catch (error) {
        console.error('Failed to join group:', error);
    
        // Default error message
        // رسالة الخطأ الافتراضية
        let info = '_Make sure the group link is valid._ \n\n_تأكد من صحة رابط المجموعة._';
    
        // Check for specific error
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
    Commands    : ['sewabot'],
    OnlyPremium : false,
    OnlyOwner   : true
};