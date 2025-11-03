const { findAbsen, updateAbsen, createAbsen } = require("@lib/absen"); 
// Functions to handle attendance / دوال لإدارة الحضور

async function handle(sock, messageInfo) {
    const { remoteJid, isGroup, message, sender } = messageInfo;

    // ===== Check if in group only / تحقق من أنه في مجموعة فقط =====
    if (!isGroup) return; 

    try {
        // ===== Check if attendance data exists for the group / تحقق إذا كانت بيانات الحضور موجودة =====
        const data = await findAbsen(remoteJid);
        let textNotif;

        if (data) { // If there is existing attendance / إذا كانت هناك بيانات حضور
            // ===== Check if sender already marked / تحقق إذا كان المستخدم قد سجل بالفعل =====
            if (data.member.includes(sender)) {
                textNotif = '⚠️ _Anda sudah absen hari ini!_'; // Already attended today / لقد قمت بالتسجيل اليوم!
            } else {
                // ===== Add sender to attendance list / أضف المستخدم إلى قائمة الحضور =====
                const updateData = {
                    member: [...data.member, sender]
                };
                await updateAbsen(remoteJid, updateData);
                textNotif = '✅ _Absen berhasil!_'; // Attendance successful / تم تسجيل حضورك بنجاح
            }
        } else { // First time attendance / أول تسجيل حضور
            const insertData = { 
                member: [sender]
            };
            await createAbsen(remoteJid, insertData);
            textNotif = '✅ _Absen berhasil!_';
        }

        // ===== Send message to user / إرسال الرسالة للمستخدم =====
        return await sock.sendMessage(
            remoteJid,
            { text: textNotif },
            { quoted: message }
        );
    } catch (error) {
        console.error("Error handling absen:", error);
        // ===== Send error message / إرسال رسالة خطأ =====
        return await sock.sendMessage(
            remoteJid,
            { text: 'Terjadi kesalahan saat memproses absen.' }, // Error processing attendance / حدث خطأ أثناء معالجة الحضور
            { quoted: message }
        );
    }
}

module.exports = {
    handle,
    Commands    : ['absen'], // Command name / اسم الأمر
    OnlyPremium : false,
    OnlyOwner   : false
};