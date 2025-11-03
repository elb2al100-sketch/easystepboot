const { findUser, isOwner, isPremiumUser } = require("@lib/users");
const { getGroupMetadata, getProfilePictureUrl } = require("@lib/cache");
const ApiAutoresbot = require("api-autoresbot");
const config = require("@config");

/**
 * English: Get country flag based on sender's number prefix
 * العربية: الحصول على علم الدولة بناءً على بادئة رقم المرسل
 */
const getCountryFlag = (sender) => {
    const countryCode = sender.slice(0, 2); // First two digits | أول رقمين
    const flagMap = {
        '62': './62.png', // Indonesia | إندونيسيا
        '60': './60.png', // Malaysia | ماليزيا
    };
    return flagMap[countryCode] || './0.png'; // Default flag | العلم الافتراضي
};

/**
 * English: Get achievement badge image path
 * العربية: الحصول على مسار صورة شارة الإنجاز
 */
const getAchievementBadge = (achievement) => {
    const achievementsList = [
        'gamers', 'coding', 'conqueror', '100', 'content creator',
        'fotografer', 'music', 'ilmuwan', 'petualang', 'hacker',
        'snake', 'bull', 'bear', 'tiger', 'cobra', 'wolf', 'imortal'
    ];
    return achievementsList.includes(achievement) 
        ? `./${achievement}.png` 
        : './gamers.png'; // Default badge | الشارة الافتراضية
};

async function handle(sock, messageInfo) {
    try {
        const { remoteJid, isGroup, message, sender, pushName } = messageInfo;
        const Nosender = sender.replace('@s.whatsapp.net', '');

        // English: Get user data
        // العربية: الحصول على بيانات المستخدم
        const dataUsers = await findUser(sender);
        if (!dataUsers) return;

        // English: Ensure command runs only in groups
        // العربية: التأكد من أن الأمر يعمل في المجموعات فقط
        if(!isGroup) {
            await sock.sendMessage(remoteJid, { text: 'Gunakan .me2 ya kak | Use .me2 command in group | استخدم أمر .me2 في المجموعة' }, { quoted: message });
            return;
        }

        // English: React with clock emoji while processing
        // العربية: إرسال رد فعل على شكل ساعة أثناء المعالجة
        await sock.sendMessage(remoteJid, { react: { text: "♥", key: message.key } });

        // English: Get group metadata
        // العربية: الحصول على بيانات المجموعة
        const groupMetadata = await getGroupMetadata(sock, remoteJid);
        const participants = groupMetadata.participants;

        // English: Check if sender is admin
        // العربية: التحقق ما إذا كان المرسل مشرفاً
        const isAdmin = participants.some(participant => participant.id === sender && participant.admin);
        const roleInGrub = isAdmin ? 'Admin' : 'Member'; // English & Arabic: role in group | الدور في المجموعة

        // English: Determine user role (Owner / Premium / default role)
        // العربية: تحديد دور المستخدم (مالك / بريميوم / الدور الافتراضي)
        const role = await isOwner(sender) 
            ? 'Owner | مالك' 
            : await isPremiumUser(sender) 
            ? 'Premium | بريميوم' 
            : dataUsers.role;

        // English: Get profile picture URL
        // العربية: الحصول على رابط صورة الملف الشخصي
        const ppUser = await getProfilePictureUrl(sock, sender);

        // English: Get country flag and achievement badge
        // العربية: الحصول على علم الدولة وشارة الإنجاز
        const flag = getCountryFlag(sender);
        const achievement = getAchievementBadge(dataUsers.achievement);

        // English: Generate profile card image using API
        // العربية: إنشاء صورة بطاقة الملف الشخصي باستخدام API
        const api = new ApiAutoresbot(config.APIKEY);
        const buffer = await api.getBuffer("/api/maker/profile3", {
            name: pushName,
            level_cache: dataUsers.level_cache || 0,
            nosender: Nosender,
            role,
            level: dataUsers.level || 0,
            money: dataUsers.money || 0,
            limit: dataUsers.limit || 0,
            roleInGrub,
            flag,
            badge: achievement,
            pp: ppUser,
        });

        // English: Send profile image to the group
        // العربية: إرسال صورة الملف الشخصي إلى المجموعة
        await sock.sendMessage(
            remoteJid,
            { image: buffer, caption: '' },
            { quoted: message }
        );

    } catch (error) {
        console.error("Error in handle function:", error.message);

        // English: Log error | العربية: تسجيل الخطأ
    }
}

module.exports = {
    handle,
    Commands    : ['me','limit'], // Command aliases | أسماء الأوامر
    OnlyPremium : false,
    OnlyOwner   : false
};