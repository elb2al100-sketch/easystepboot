const { downloadQuotedMedia, reply } = require('@lib/utils');
const fs = require('fs');
const path = require('path');
const mess = require('@mess');

async function handle(sock, messageInfo) {
    const { m, remoteJid, message, sender, prefix, command, type, isQuoted } = messageInfo;

    try {
        // Determine media type (must be a view-once media)
        // تحديد نوع الوسائط (يجب أن تكون وسائط للعرض مرة واحدة)
        const mediaType = isQuoted ? isQuoted.type : type;
        if (mediaType !== 'viewonce' || !isQuoted) {
            return await reply(m, `⚠️ _Reply to a view-once media with caption *${prefix + command}*_ \n⚠️ _قم بالرد على وسائط للعرض مرة واحدة مع التعليق *${prefix + command}*_`);
        }
    
        // Send "Loading" reaction
        // إرسال رمز تعبيري "جارٍ المعالجة"
        await sock.sendMessage(remoteJid, { react: { text: "🤌🏻", key: message.key } });

        // Download the quoted media
        // تنزيل الوسائط المقتبسة
        const media     = await downloadQuotedMedia(message);
        const mediaPath = path.join('tmp', media);

        if (!fs.existsSync(mediaPath)) {
            throw new Error('Media file not found after download. / لم يتم العثور على ملف الوسائط بعد التنزيل.');
        }

        // Read file into Buffer
        // قراءة الملف كـ Buffer
        const mediaBuffer = fs.readFileSync(mediaPath);

        // Handle different view-once types
        // التعامل مع أنواع مختلفة من وسائط العرض مرة واحدة
        if (isQuoted?.rawMessageType === 'audioMessage') {
            await sock.sendMessage(remoteJid, { 
                audio: mediaBuffer,
                mimetype: 'audio/mp4', 
                ptt: true 
            }, { quoted : message});
            return;
        }

        if (isQuoted?.rawMessageType === 'imageMessage') {
            await sock.sendMessage(
                remoteJid, {
                    image: mediaBuffer,
                    caption: mess.general.success,
                },
                { quoted: message }
            );
            return;
        }

        if (isQuoted?.rawMessageType === 'videoMessage') {
            await sock.sendMessage(
                remoteJid,
                { video: mediaBuffer, caption: mess.general.success },
                { quoted: message }
            );
            return;
        }

    } catch (error) {
        console.error('Error while processing the RVO command:', error);

        // Send more informative error message
        // إرسال رسالة خطأ أكثر وضوحًا
        const errorMessage = `_❌ An error occurred while processing the media._ / حدث خطأ أثناء معالجة الوسائط.`;
        await reply(m, errorMessage);
    }
}

module.exports = {
    handle,
    Commands    : ['rvo'],       // Command for "View Once" media processing / الأمر لمعالجة وسائط العرض مرة واحدة
    OnlyPremium : true,           // Only accessible for premium users / متاح فقط للمستخدمين المميزين
    OnlyOwner   : false
};