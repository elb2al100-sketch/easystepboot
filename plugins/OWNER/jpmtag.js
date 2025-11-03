const { groupFetchAllParticipating }            = require("@lib/cache");
const { downloadQuotedMedia, downloadMedia }    = require("@lib/utils");
const fs    = require("fs");
const path  = require("path");
const axios = require('axios');
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const jeda  = 5; // 5 seconds delay / تأخير 5 ثوانٍ

let isRunning = false;

// Detect the first WhatsApp group link in the text / كشف أول رابط لمجموعة واتساب في النص
function detectFirstWhatsAppGroupLink(text) {
    const regex = /https?:\/\/chat\.whatsapp\.com\/[A-Za-z0-9]{22}/;
    const match = text.match(regex);
    return match ? match[0] : null;
}

// Fetch group info from external API / جلب معلومات المجموعة عبر API خارجي
async function fetchGroupInfo(url) {
    try {
        const apiUrl = `https://api.autoresbot.com/api/stalker/whatsapp-group?url=${encodeURIComponent(url)}`;
        const response = await axios.get(apiUrl);
        return response.data;
    } catch (error) {
        console.error(`Failed to fetch group info for ${url} / فشل جلب معلومات المجموعة`, error.message);
        return null;
    }
}

async function handle(sock, messageInfo) {
    const { remoteJid, message, content, sender, prefix, command, isQuoted, type } = messageInfo;

    const useMentions = true; // Set true to mention all participants / ضع true لذكر جميع المشاركين

    const link = detectFirstWhatsAppGroupLink(content);

    try {
        if(isRunning) {
            return await sock.sendMessage(
                remoteJid,
                { text: `⚠️ _JPM process is already running. Please wait until it finishes._ / عملية JPM جارية بالفعل. انتظر حتى الانتهاء.` },
                { quoted: message }
            );
        }

        // Validate input / التحقق من الإدخال
        if (!content || content.trim() === '') {
            return sendErrorMessage(sock, remoteJid, message, prefix, command);
        }

        isRunning = true;

        // Show temporary reaction while processing / عرض رمز انتظار أثناء المعالجة
        await sock.sendMessage(remoteJid, { react: { text: "🤌🏻", key: message.key } });

        // Fetch all participating groups / جلب جميع المجموعات المشاركة
        const groupFetchAll = await groupFetchAllParticipating(sock);
        if (!groupFetchAll) {
            isRunning = false;
            return await sock.sendMessage(
                remoteJid,
                { text: `⚠️ No groups found / لم يتم العثور على أي مجموعات.` },
                { quoted: message }
            );
        }

        // Filter groups based on condition / تصفية المجموعات حسب شرط معين
        const groupIds = Object.values(groupFetchAll)
            .filter(group => group.isCommunity == false) // Adjust condition if needed / عدّل الشرط حسب الحاجة
            .map(group => group.id);

        if (groupIds.length === 0) {
            isRunning = false;
            return await sock.sendMessage(
                remoteJid,
                { text: `⚠️ No groups matching the condition found / لم يتم العثور على أي مجموعات تطابق الشرط.` },
                { quoted: message }
            );
        }

        // Determine media type / تحديد نوع الوسائط
        const mediaType = isQuoted ? `${isQuoted.type}Message` : `${type}Message`;
        const pesangc = content; // message content to send / محتوى الرسالة للإرسال

        let imageLink;
        if (link) {
            const info = await fetchGroupInfo(link);
            if (info) imageLink = info.imageLink;
        }

        let buffer;
        if (mediaType === 'imageMessage') {
            const media = isQuoted
                ? await downloadQuotedMedia(message)
                : await downloadMedia(message);

            const mediaPath = path.join("tmp", media);

            if (!fs.existsSync(mediaPath)) {
                throw new Error("Media file not found after download / الملف غير موجود بعد التنزيل.");
            }

            buffer = fs.readFileSync(mediaPath);
        }

        // Send message to all groups / إرسال الرسالة إلى جميع المجموعات
        for (const groupId of groupIds) {
            const participants = Object.values(groupFetchAll[groupId]?.participants || []);
            const mentions = useMentions ? participants.map(p => p.id) : undefined;

            if (mediaType === 'imageMessage') {
                await sock.sendMessage(
                    groupId,
                    {
                        image: buffer,
                        caption: pesangc,
                        mentions: mentions,
                    }
                );
            } else if(imageLink){
                await sock.sendMessage(
                    groupId,
                    {
                        image: { url: imageLink },
                        caption: pesangc,
                        mentions: mentions,
                    }
                );
            } else {
                await sock.sendMessage(
                    groupId,
                    {
                        text: pesangc,
                        mentions: mentions,
                    }
                );
            }

            // Delay 5 seconds / تأخير 5 ثوانٍ
            await sleep(jeda * 1000);
        }

        isRunning = false;

        // Send success confirmation / إرسال رسالة تأكيد نجاح
        await sock.sendMessage(
            remoteJid,
            { text: `✅ Message successfully sent to ${groupIds.length} groups / تم إرسال الرسالة بنجاح إلى ${groupIds.length} مجموعة.` },
            { quoted: message }
        );

    } catch (error) {
        isRunning = false;
        console.error('An error occurred / حدث خطأ:', error);
        await sock.sendMessage(
            remoteJid,
            { text: `⚠️ An error occurred while processing the command / حدث خطأ أثناء معالجة الأمر.` },
            { quoted: message }
        );
    }
}

// Send usage error message / إرسال رسالة خطأ عند صيغة غير صحيحة
function sendErrorMessage(sock, remoteJid, message, prefix, command) {
    return sock.sendMessage(
        remoteJid,
        {
            text: `_⚠️ Usage Format:_ \n\n_💬 Example:_ _*${prefix + command} WhatsApp bot announcement*_ / صيغة الاستخدام: مثال: .jpmtag إعلان بوت واتساب`
        },
        { quoted: message }
    );
}

module.exports = {
    handle,
    Commands    : ['jpmtag'],
    OnlyPremium : false,
    OnlyOwner   : true,
};