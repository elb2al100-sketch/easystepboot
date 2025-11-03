const fs = require('fs');
const path = require('path');
const { getGroupMetadata } = require("@lib/cache");

/**
 * Generate vCard format for a contact
 * / توليد صيغة vCard لجهة الاتصال
 * @param {string} userId - The ID of the user (e.g., phone number or unique identifier)
 * @returns {string} - vCard formatted string / نص vCard
 */
async function generateVCard(userId) {
    const displayName = `Pushkontak - ${userId.split('@')[0]}`;
    const phoneNumber = userId.split('@')[0];

    // Format vCard version 3.0 / صيغة vCard الإصدار 3.0
    const vCard = `
BEGIN:VCARD
VERSION:3.0
FN:${displayName}
TEL;TYPE=CELL:${phoneNumber}
END:VCARD
    `.trim();
    return vCard;
}

/**
 * Handle command to save group contacts into a VCF file
 * / معالجة أمر حفظ جهات اتصال المجموعة في ملف VCF
 */
async function handle(sock, messageInfo) {
    const { remoteJid, message, content, prefix, command } = messageInfo;

    try {
        // Validate empty input / التحقق من إدخال فارغ
        if (!content || content.trim() === '') {
            return await sock.sendMessage(
                remoteJid,
                { text: `_⚠️ Usage Format / صيغة الاستخدام:_ \n\n_💬 Example / مثال:_ _*${prefix + command} xxx@g.us*_` },
                { quoted: message }
            );
        }

        // Send reaction to indicate processing / إرسال رد فعل لإظهار أن العملية جارية
        await sock.sendMessage(remoteJid, { react: { text: "⏰", key: message.key } });

        // Fetch group metadata / جلب بيانات المجموعة
        const Metadata = await getGroupMetadata(sock, content);
        if (!Metadata) {
            return await sock.sendMessage(
                remoteJid,
                { text: '❌ Group not found / لم يتم العثور على المجموعة.' },
                { quoted: message }
            );
        }

        // Filter participants ending with '.net' / تصفية الأعضاء الذين تنتهي أرقامهم بـ '.net'
        const allUsers = Metadata.participants.filter(v => v.id.endsWith('.net')).map(v => v.id);
        if (allUsers.length === 0) {
            return await sock.sendMessage(
                remoteJid,
                { text: '⚠️ _No contacts matched the filter / لا يوجد جهات اتصال مطابقة للفلتر._' },
                { quoted: message }
            );
        }

        // Generate vCard text for all users / توليد نص vCard لجميع المستخدمين
        let textVCF = '';
        for (let user of allUsers) {
            const vCard = await generateVCard(user);
            textVCF += `${vCard}\n`;
        }

        // Ensure save directory exists / التأكد من وجود مجلد الحفظ
        const saveDir = path.join(process.cwd(), 'tmp'); // Using current working directory / استخدام دليل العمل الحالي
        if (!fs.existsSync(saveDir)) {
            fs.mkdirSync(saveDir, { recursive: true });
        }

        // Save to .vcf file / حفظ الملف بصيغة .vcf
        const filePath = path.join(saveDir, `${content.split('@')[0]}_contacts.vcf`);
        fs.writeFileSync(filePath, textVCF, 'utf8');

        // Send the VCF file / إرسال ملف VCF
        await sock.sendMessage(remoteJid, {
            document: fs.readFileSync(filePath),
            fileName: `${content.split('@')[0]}_contacts.vcf`,
            mimetype: 'text/vcard' // or 'text/x-vcard'
        }, { quoted: message });

    } catch (error) {
        console.error("Error in handle function / خطأ في دالة المعالجة:", error);
        await sock.sendMessage(
            remoteJid,
            { text: `❌ _An error occurred: ${error.message} / حدث خطأ: ${error.message}_` },
            { quoted: message }
        );
    }
}

module.exports = {
    handle,
    Commands    : ['savekontak'],
    OnlyPremium : false,
    OnlyOwner   : true
};