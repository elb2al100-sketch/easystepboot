const fs = require('fs');
const { downloadQuotedMedia, downloadMedia } = require('@lib/utils');
const { Sticker, StickerTypes } = require('wa-sticker-formatter');

/**
 * 🔴 دالة لإرسال رسالة خطأ إلى المستخدم
 * 🔴 Function to send an error message to the user
 * @param {Object} sock - كائن الاتصال (Socket object)
 * @param {string} remoteJid - رقم المستخدم أو المجموعة (User/Group ID)
 * @param {Object} message - الرسالة الأصلية (Original message)
 * @param {string} errorMessage - نص الخطأ (Error text)
 */
async function sendError(sock, remoteJid, message, errorMessage) {
    await sock.sendMessage(remoteJid, { text: errorMessage }, { quoted: message });
}

/**
 * 🎨 دالة معالجة الأمر "wm" لإضافة اسم الحزمة والمؤلف إلى الملصق أو الصورة
 * 🎨 Function to handle the "wm" command (add packname and author to sticker/image)
 * @param {Object} sock - كائن الاتصال (Socket object)
 * @param {Object} messageInfo - معلومات الرسالة (Message info)
 */
async function handle(sock, messageInfo) {
    const { remoteJid, message, content, prefix, command, isQuoted, type } = messageInfo;
    const mediaType = isQuoted ? isQuoted.type : type;

    try {
        // 🏷️ تقسيم النص إلى packname و author | Split input text into packname and author
        const [packname = '', author = ''] = content.split('|').map(s => s.trim());

        // ⚠️ التحقق من نوع الوسائط (يجب أن تكون صورة أو ملصق)
        // ⚠️ Validate media type (must be image or sticker)
        if (!['image', 'sticker'].includes(mediaType)) {
            return sendError(
                sock,
                remoteJid,
                message,
                `⚠️ _أرسل أو رد على صورة/ملصق مع التسمية *${prefix + command}*_`
            );
        }

        // ⚠️ التحقق من وجود النص المدخل
        // ⚠️ Validate that the user provided text input
        if (!content.trim()) {
            return sendError(
                sock,
                remoteJid,
                message,
                `_مثال: *${prefix + command} az | creative*_ 

_Example 1:_ *${prefix + command} name*
_Example 2:_ *${prefix + command} youtube | creative*`
            );
        }

        // ⬇️ تنزيل الوسائط (صورة أو ملصق)
        // ⬇️ Download the media (image or sticker)
        const mediaPath = `./tmp/${
            isQuoted ? await downloadQuotedMedia(message) : await downloadMedia(message)
        }`;

        // ❌ إذا لم يتم العثور على الملف بعد التنزيل
        // ❌ If file not found after download
        if (!fs.existsSync(mediaPath)) {
            throw new Error('❌ لم يتم العثور على ملف الوسائط بعد التنزيل. / Media file not found after download.');
        }

        // 🖼️ إنشاء الملصق مع العلامة المائية (packname + author)
        // 🖼️ Create sticker with watermark (packname + author)
        const sticker = new Sticker(mediaPath, {
            pack: packname,
            author: author,
            type: StickerTypes.FULL,
            quality: 50
        });

        // 📦 تحويله إلى buffer ثم إرساله كملصق جديد
        // 📦 Convert to buffer and send as new sticker
        const buffer = await sticker.toBuffer();
        await sock.sendMessage(remoteJid, { sticker: buffer });

    } catch (error) {
        // ⚠️ إذا حدث خطأ أثناء التنفيذ
        // ⚠️ Handle any processing errors
        await sendError(
            sock,
            remoteJid,
            message,
            `❗ حدث خطأ أثناء معالجة طلبك، حاول مرة أخرى لاحقًا.\n\n❗ An error occurred while processing your request.\nError: ${error.message}`
        );
    }
}

// ⚙️ إعدادات الأوامر (Command settings)
module.exports = {
    handle,
    Commands    : ['wm'],       // 🧩 الأمر المستخدم / Command name
    OnlyPremium : false,        // 🔓 يمكن للجميع استخدامه / Available to everyone
    OnlyOwner   : false         // 👑 لا يقتصر على المالك فقط / Not owner-only
};