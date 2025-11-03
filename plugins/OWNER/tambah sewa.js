const { addSewa, findSewa } = require("@lib/sewa");
const config = require("@config");
const { selisihHari, hariini }  = require("@lib/utils");

async function handle(sock, messageInfo) {
    const { remoteJid, message, content, sender, prefix, command } = messageInfo;
    
    // Validate input
    // التحقق من وجود المحتوى
    if (!content || content.trim() === '') {
        return await sock.sendMessage(
            remoteJid,
            { 
                text: `_⚠️ Usage Format:_ \n\n💬 Example:_ _*${prefix + command} https://chat.whatsapp.com/xxx 30*_` +
                      `\n\n_💡 30 means adding 30 days to the remaining sewa period_\n` +
                      `\n_إذا لم ينضم البوت بعد، استخدم *.sewabot* لإنشاء اشتراك جديد_`
            },
            { quoted: message }
        );
    }

    // Split input into link and days
    // تقسيم المحتوى إلى الرابط وعدد الأيام
    const args = content.trim().split(" ");
    if (args.length < 2) {
        return await sock.sendMessage(
            remoteJid,
            { 
                text: `⚠️ Invalid format. Example usage:\n_*${prefix + command} https://chat.whatsapp.com/xxx 30*_` 
            },
            { quoted: message }
        );
    }

    const linkGrub = args[0]; // Group link
    const totalHari = parseInt(args[1], 10); // Days as integer

    // Validate group link
    // التحقق من صحة رابط المجموعة
    if (!linkGrub.includes("chat.whatsapp.com")) {
        return await sock.sendMessage(
            remoteJid,
            { 
                text: `⚠️ Group link must contain 'chat.whatsapp.com'. Example:\n_*${prefix + command} https://chat.whatsapp.com/xxx 30*_` 
            },
            { quoted: message }
        );
    }

    // Validate days
    // التحقق من صحة عدد الأيام
    if (isNaN(totalHari) || totalHari <= 0) {
        return await sock.sendMessage(
            remoteJid,
            { 
                text: `⚠️ Invalid number of days. Example:\n_*${prefix + command} https://chat.whatsapp.com/xxx 30*_` 
            },
            { quoted: message }
        );
    }

    // Extract group code from link
    // استخراج كود المجموعة من الرابط
    const result_sewa = linkGrub.split('https://chat.whatsapp.com/')[1];
    let res_linkgc = '';

    const currentDate = new Date();
    const expirationDate = new Date(currentDate.getTime() + (totalHari * 24 * 60 * 60 * 1000) + (1 * 60 * 60 * 1000));
    const timestampExpiration = expirationDate.getTime();

    try {
        // Query group info
        // الحصول على معلومات المجموعة
        const res = await sock.query({ 
            tag: "iq", 
            attrs: { type: "get", xmlns: "w:g2", to: "@g.us" }, 
            content: [{ tag: "invite", attrs: { code: result_sewa } }]
        });

        res_linkgc = res.content[0].attrs.id;
        const res_namegc = res.content[0].attrs.subject;
        res_linkgc = res_linkgc + '@g.us';

        // Check if bot has already joined
        // التحقق مما إذا كان البوت قد انضم من قبل
        const cekSewa = await findSewa(res_linkgc);
        if(!cekSewa) {
            return await sock.sendMessage(
                remoteJid,
                {
                    text: `⚠️ _*Bot has not joined this group yet*_\n\n_Use *.sewabot* to create a new sewa_ \n⚠️ البوت لم ينضم بعد. استخدم *.sewabot* لإنشاء اشتراك جديد_`
                },
                { quoted: message }
            );
        }

        // Accept group invite (silent)
        await sock.groupAcceptInvite(result_sewa).then(() => console.log('')).catch(() => console.log(''));

        // Calculate new expiration time
        // حساب تاريخ الانتهاء الجديد
        const totalSewa = cekSewa.expired + (totalHari * 24 * 60 * 60 * 1000) + (1 * 60 * 60 * 1000);

        await addSewa(res_linkgc, {
            linkGrub: linkGrub,
            expired: totalSewa
        });

        // Send success message
        // إرسال رسالة نجاح
        return await sock.sendMessage(
            remoteJid,
            { 
                text: `_*Sewa Extension Successful*_` +
                      `\n\nGroup Name : *${res_namegc}*` +
                      `\nBot Number : ${config.phone_number_bot}` +
                      `\nExpired : *${selisihHari(totalSewa)}*` +
                      `\n\n_To check sewa status, type *.ceksewa* in the group_ \n_للتحقق من حالة الاشتراك، استخدم *.ceksewa* داخل المجموعة_`
            },
            { quoted: message }
        );

    } catch (error) {
        console.error('Failed to join group:', error);
    
        let info = '_Make sure the group link is valid._ \n_تأكد من صحة رابط المجموعة._';
    
        if (error instanceof Error && error.message.includes('not-authorized')) {
            info = `_You may have been removed from the group. Solution: invite the bot again or add manually._ \n_ربما تم إخراجك من المجموعة. الحل: أعد دعوة البوت أو أضفه يدويًا._`;
        }
    
        return await sock.sendMessage(
            remoteJid,
            {
                text: `⚠️ _Failed to join the group._\n\n${info}`
            },
            { quoted: message }
        );
    }
}

module.exports = {
    handle,
    Commands    : ['tambahsewa'],
    OnlyPremium : false,
    OnlyOwner   : true
};