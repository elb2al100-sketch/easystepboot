const mess = require('@mess');
// Template messages / قوالب الرسائل
const { getGroupMetadata } = require("@lib/cache");
// Function to get group metadata / دالة لجلب بيانات المجموعة

// Global object to store giveaway participants per group / كائن عالمي لتخزين المشاركين لكل مجموعة
global.giveawayParticipants = global.giveawayParticipants || {};

async function handle(sock, messageInfo) {
    const { remoteJid, isGroup, message, sender, content, prefix, command } = messageInfo;
    if (!isGroup) return; // Only for groups / مخصص للمجموعات فقط

    // Get group metadata / الحصول على بيانات المجموعة
    const groupMetadata = await getGroupMetadata(sock, remoteJid);
    const participants = groupMetadata.participants;
    const isAdmin = participants.some(participant => participant.id === sender && participant.admin);

    // Check if sender is admin / التحقق من أن المرسل مشرف
    if (!isAdmin) {
        await sock.sendMessage(remoteJid, { text: mess.general.isAdmin }, { quoted: message });
        return;
    }

    // Start Giveaway / بدء المسابقة
    if (command === 'giveaway') {
        if (!global.giveawayParticipants[remoteJid]) {
            global.giveawayParticipants[remoteJid] = new Set();
        }
        await sock.sendMessage(remoteJid, { 
            text: `🎉 *GIVEAWAY STARTED!* 🎉\n\nType *.ikut* to join.\n\nUse *.mulaigiveaway <number_of_winners>* to select winners.` 
            // 🎉 *تم بدء السحب!* 🎉\n\nاكتب *.ikut* للانضمام.\n\nاستخدم *.mulaigiveaway <عدد الفائزين>* لاختيار الفائزين.
        }, { quoted: message });
        return;
    }

    // Start selecting giveaway winners / بدء اختيار الفائزين
    if (command === 'mulaigiveaway') {

        // Check if giveaway has started / التحقق من بدء السحب
        if (!global.giveawayParticipants[remoteJid]) {
            await sock.sendMessage(remoteJid, { 
                text: `⚠ Giveaway has not started. Type *.giveaway* to start.\n⚠ السحب لم يبدأ بعد. اكتب *.giveaway* للبدء.` 
            }, { quoted: message });
            return;
        }

        // Validate number of winners / التحقق من عدد الفائزين
        if (!content || isNaN(content) || parseInt(content) <= 0) {
            await sock.sendMessage(remoteJid, { 
                text: `⚠ Usage: *.mulaigiveaway <number_of_winners>*\n⚠ الاستخدام: *.mulaigiveaway <عدد الفائزين>*`
            }, { quoted: message });
            return;
        }

        const jumlahPemenang = parseInt(content);
        await startGiveaway(sock, remoteJid, message, jumlahPemenang);
    }
}

// Function to select winners / دالة لاختيار الفائزين
async function startGiveaway(sock, remoteJid, message, jumlahPemenang) {
    // Check if there are participants / التحقق من وجود مشاركين
    if (!global.giveawayParticipants[remoteJid] || global.giveawayParticipants[remoteJid].size === 0) {
        await sock.sendMessage(remoteJid, { 
            text: `❌ No participants joined the giveaway!\n❌ لم ينضم أي مشارك إلى السحب!`
        }, { quoted: message });
        return;
    }

    const participantsArray = Array.from(global.giveawayParticipants[remoteJid]);

    // Check if number of winners exceeds participants / التحقق إذا كان عدد الفائزين أكبر من المشاركين
    if (jumlahPemenang > participantsArray.length) {
        await sock.sendMessage(remoteJid, { 
            text: `⚠ Total participants: ${participantsArray.length}\n⚠ إجمالي المشاركين: ${participantsArray.length}`
        }, { quoted: message });
        return;
    }

    // Shuffle participants randomly / خلط المشاركين عشوائيًا
    const shuffled = participantsArray.sort(() => 0.5 - Math.random());
    const winners = shuffled.slice(0, jumlahPemenang);

    // Mention winners in message / ذكر الفائزين في الرسالة
    const winnerMentions = winners.map(winner => `@${winner.split('@')[0]}`).join('\n');
    await sock.sendMessage(remoteJid, { 
        text: `🎉 *Giveaway Winners:* 🎉\n\n◧ ${winnerMentions}\n🎉 *الفائزون بالسحب:* 🎉\n◧ ${winnerMentions}`,
        mentions: winners
    }, { quoted: message });

    // Reset participants after giveaway ends / إعادة تعيين المشاركين بعد انتهاء السحب
    delete global.giveawayParticipants[remoteJid];
}

module.exports = {
    handle,
    Commands: ['giveaway', 'mulaigiveaway'],
    OnlyPremium: false, // Available to all users / متاح لجميع المستخدمين
    OnlyOwner: false,   // Not restricted to owner / ليس مقتصرًا على المالك
};