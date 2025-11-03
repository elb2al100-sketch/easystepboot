const { addBadword, updateBadword, findBadword } = require("@lib/badword");
const { getGroupMetadata } = require("@lib/cache");
const mess = require("@mess");

async function handle(sock, messageInfo) {
    const { remoteJid, message, sender, prefix, command, content, fullText } = messageInfo;

    try {
        // Get group metadata
        // الحصول على بيانات المجموعة
        const groupMetadata = await getGroupMetadata(sock, remoteJid);
        const participants  = groupMetadata.participants;
        const isAdmin       = participants.some(participant => participant.id === sender && participant.admin);
        if(!isAdmin) {
            await sock.sendMessage(remoteJid, { text: mess.general.isAdmin }, { quoted: message });
            return;
        }

        // Validate input content
        // التحقق من محتوى الرسالة
        if (!content || !content.trim()) {
            return await sock.sendMessage(
                remoteJid,
                { text: `_⚠️ Usage Format:_ \n\n_💬 Example:_ _*${prefix + command} stupid*_\n_⚠️ صيغة الاستخدام:_ \n\n_💬 مثال:_ _*${prefix + command} tolol*_` },
                { quoted: message }
            );
        }

        const args = fullText.trim().split(" ").slice(1);

        // Ensure group badword data exists
        // التأكد من وجود بيانات الكلمات الممنوعة للمجموعة
        const dataGrub = await ensureGroupData(remoteJid);

        // Add badwords to list
        // إضافة الكلمات إلى قائمة الكلمات الممنوعة
        const responseMessage = await addBadwordToList(remoteJid, dataGrub, args);

        // Send response to group
        // إرسال الرد إلى المجموعة
        await sendResponse(sock, remoteJid, responseMessage, message);
    } catch (error) {
        console.error(error)
        await sendResponse(sock, remoteJid, "❌ _An error occurred while processing the command._\n❌ _حدث خطأ أثناء معالجة الأمر._", message);
    }
}

// Function to ensure group data exists
// دالة للتأكد من وجود بيانات المجموعة
async function ensureGroupData(remoteJid) {
    let dataGrub = await findBadword(remoteJid);
    if (!dataGrub) {
        await addBadword(remoteJid, { listBadword: [] });
        dataGrub = { listBadword: [] };
    }
    return dataGrub;
}

// Function to add words to badword list
// دالة لإضافة كلمات إلى قائمة الكلمات الممنوعة
async function addBadwordToList(remoteJid, dataGrub, words) {
    if (words.length === 0) {
        return "⚠️ _Please provide words to add. Example: .addbadword stupid_\n⚠️ _يرجى تقديم الكلمات التي تريد إضافتها. مثال: .addbadword tolol_";
    }

    const newWords = words.filter(word => !dataGrub.listBadword.includes(word));
    if (newWords.length === 0) {
        return "⚠️ _All words are already in the badword list._\n⚠️ _كل الكلمات موجودة بالفعل في قائمة الكلمات الممنوعة._";
    }

    dataGrub.listBadword.push(...newWords);
    await updateBadword(remoteJid, { listBadword: dataGrub.listBadword });
    return `✅ _Successfully added words:_ ${newWords.join(", ")}\n✅ _تمت إضافة الكلمات بنجاح:_ ${newWords.join(", ")}`;
}

// Function to send response to group
// دالة لإرسال الرد إلى المجموعة
async function sendResponse(sock, remoteJid, text, quotedMessage) {
    await sock.sendMessage(remoteJid, { text }, { quoted: quotedMessage });
}

module.exports = {
    handle,
    Commands    : ["addbadword"],
    OnlyPremium : false,
    OnlyOwner   : false
};