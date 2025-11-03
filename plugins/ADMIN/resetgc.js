// RESETGC: Reset all group settings
// إعادة_ضبط_المجموعة: إعادة تعيين جميع إعدادات المجموعة

const { getGroupMetadata } = require("@lib/cache");
const { deleteBadword } = require("@lib/badword");
const { deleteGroup } = require("@lib/group");
const { deleteAllListInGroup } = require("@lib/list");
const fs = require('fs');
const path = require('path');
const mess = require("@mess");

// Define absolute paths to JSON files
// تحديد مسارات الملفات بصيغة مطلقة
const absenJson = path.join(process.cwd(), 'database', 'additional', 'absen.json');
const groupParticipantJson = path.join(process.cwd(), 'database', 'additional', 'group participant.json');
const totalChatJson = path.join(process.cwd(), 'database', 'additional', 'totalchat.json');
const badwordJson = path.join(process.cwd(), 'database','badword.json');
const slrJson = path.join(process.cwd(), 'database','slr.json');
const listJson = path.join(process.cwd(), 'database','list.json');

// Function to check if sender is group admin
// دالة للتحقق إذا كان المرسل مشرفًا في المجموعة
async function isAdmin(sock, remoteJid, sender) {
    try {
        const groupMetadata = await getGroupMetadata(sock, remoteJid);
        const participants = groupMetadata.participants;
        return participants.some(participant => participant.id === sender && participant.admin);
    } catch (error) {
        return false;
    }
}

// Main function to reset the group
// الدالة الرئيسية لإعادة ضبط إعدادات المجموعة
async function handle(sock, messageInfo) {
    const { remoteJid, isGroup, message, sender } = messageInfo;
    
    if (!isGroup) return; // Only group messages
    // الرسائل من المجموعات فقط

    try {
        // Check if sender is admin
        // التحقق إذا كان المرسل مشرف
        const adminStatus = await isAdmin(sock, remoteJid, sender);
        if (!adminStatus) {
            await sock.sendMessage(remoteJid, { text: mess.general.isAdmin }, { quoted: message });
            return;
        }

        // Reset group settings for the specified remoteJid
        // إعادة ضبط إعدادات المجموعة المحددة
        await resetGroupSettings(remoteJid);

        // Send success message after reset
        // إرسال رسالة نجاح بعد إعادة الضبط
        await sock.sendMessage(remoteJid, { text: "✅ Pengaturan grup ini telah berhasil direset.\n✅ تم إعادة ضبط إعدادات هذه المجموعة بنجاح." }, { quoted: message });
    } catch (error) {
        console.error("Error in resetgc command:", error);

        // Send error message if something goes wrong
        // إرسال رسالة خطأ إذا حدث أي شيء خاطئ
        await sock.sendMessage(
            remoteJid,
            { text: '⚠️ Terjadi kesalahan saat mereset pengaturan grup.\n⚠️ حدث خطأ أثناء إعادة ضبط إعدادات المجموعة.' },
            { quoted: message }
        );
    }
}

// Function to reset group data based on remoteJid
// دالة لإعادة ضبط بيانات المجموعة بناءً على remoteJid
async function resetGroupSettings(remoteJid) {
    try {
        // Read data from all JSON files
        // قراءة البيانات من جميع ملفات JSON
        const absenData = JSON.parse(fs.readFileSync(absenJson, 'utf8'));
        const groupParticipantData = JSON.parse(fs.readFileSync(groupParticipantJson, 'utf8'));
        const totalChatData = JSON.parse(fs.readFileSync(totalChatJson, 'utf8'));
        const badwordData = JSON.parse(fs.readFileSync(badwordJson, 'utf8'));
        const slrData = JSON.parse(fs.readFileSync(slrJson, 'utf8'));
        const listData = JSON.parse(fs.readFileSync(listJson, 'utf8'));
 
        // Reset data in each JSON if it exists
        // إعادة ضبط البيانات في كل ملف إذا كانت موجودة
        if (absenData[remoteJid]) {
            delete absenData[remoteJid];
            fs.writeFileSync(absenJson, JSON.stringify(absenData, null, 2));
        }

        if (groupParticipantData[remoteJid]) {
            delete groupParticipantData[remoteJid];
            fs.writeFileSync(groupParticipantJson, JSON.stringify(groupParticipantData, null, 2));
        }

        if (totalChatData[remoteJid]) {
            delete totalChatData[remoteJid];
            fs.writeFileSync(totalChatJson, JSON.stringify(totalChatData, null, 2));
        }

        if (badwordData[remoteJid]) {
            delete badwordData[remoteJid];
            fs.writeFileSync(badwordJson, JSON.stringify(badwordData, null, 2));
        }

        if (slrData[remoteJid]) {
            delete slrData[remoteJid];
            fs.writeFileSync(slrJson, JSON.stringify(slrData, null, 2));
        }

        if (listData[remoteJid]) {
            delete listData[remoteJid];
            fs.writeFileSync(listJson, JSON.stringify(listData, null, 2));
        }

        // Call additional deletion functions
        // استدعاء الدوال الإضافية للحذف
        await deleteGroup(remoteJid);
        await deleteBadword(remoteJid);
        await deleteAllListInGroup(remoteJid);
            
    } catch (error) {
        throw new Error("❌ Failed to reset group settings.\n❌ فشل إعادة ضبط إعدادات المجموعة.");
    }
}

module.exports = {
    handle,
    Commands: ['resetgc'],
    OnlyPremium: false,
    OnlyOwner: false,
};