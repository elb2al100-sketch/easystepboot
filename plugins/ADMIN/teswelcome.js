const { getGroupMetadata, getProfilePictureUrl } = require("@lib/cache");
// Import functions to get group metadata and user profile picture
// استدعاء دوال للحصول على بيانات المجموعة وصورة ملف المستخدم

const axios = require('axios');
// Import axios for HTTP requests
// استدعاء axios لعمل طلبات HTTP

async function handle(sock, messageInfo) {

    const { remoteJid, sender, message, pushName, content, prefix, command } = messageInfo;

    try {
        // Validate input content
        // التحقق من صحة المحتوى المدخل
        if (!content) {
            await sock.sendMessage(remoteJid, {
                text: `_⚠️ Usage format / صيغة الاستخدام:_ \n\n_💬 Example / مثال:_ _*${prefix + command} 1*_`
            }, { quoted: message });
            return;
        }

        // Show processing indicator
        // عرض مؤشر المعالجة
        await sock.sendMessage(remoteJid, { react: { text: "🫣", key: message.key } });

        // Get group metadata and profile pictures
        // الحصول على بيانات المجموعة وصور الملفات الشخصية
        const groupMetadata = await getGroupMetadata(sock, remoteJid);
        const { size, subject, desc } = groupMetadata;
        const ppUser  = await getProfilePictureUrl(sock, sender);
        const ppGroup = await getProfilePictureUrl(sock, remoteJid);

        let buffer;

        // Map content to API parameters
        // ربط المحتوى بوسائط الـ API
        const apiRoutes = {
            '1': { endpoint: 'https://api.autoresbot.com/api/maker/welcome1', params: { pp: ppUser, name: pushName, gcname: subject, member: size, ppgc: ppGroup } },
            '2': { endpoint: 'https://api.autoresbot.com/api/maker/welcome2', params: { pp: ppUser, name: pushName, gcname: subject, member: size, ppgc: ppGroup, bg: 'https://autoresbot.com/tmp_files/f83c1c1d-f975-4c1b-9919-a00209102065.jpg' } },
            '3': { endpoint: 'https://api.autoresbot.com/api/maker/welcome3', params: { pp: ppUser, name: pushName, gcname: subject, desk: desc, ppgc: ppGroup, bg: 'https://autoresbot.com/tmp_files/f83c1c1d-f975-4c1b-9919-a00209102065.jpg' } },
            '4': { endpoint: 'https://api.autoresbot.com/api/maker/welcome4', params: { pp: ppUser, name: pushName } },
            '5': { endpoint: 'https://api.autoresbot.com/api/maker/welcome5', params: { pp: ppUser, name: pushName } },
            '6': { endpoint: 'https://api.autoresbot.com/api/maker/welcome6', params: { pp: ppUser, name: pushName, gcname: subject, member: size, ppgc: ppGroup } },
            '7': { endpoint: 'https://api.autoresbot.com/api/maker/welcome7', params: { pp: ppUser, name: pushName, gcname: subject, member: size, ppgc: ppGroup } },
        };

        // Handle "text" input
        // التعامل مع إدخال "text"
        if(content == 'text') {
            await sock.sendMessage(remoteJid, {
                text: `_Welcome bro in group / مرحبًا بك في المجموعة ${subject}_\n\n_To use this template type_ / لاستخدام هذا القالب اكتب_ *.templatewelcome ${content}*`
            }, { quoted: message });
            return;
        }

        // Check if content is valid
        // التحقق مما إذا كان المحتوى صالحًا
        const route = apiRoutes[content];
        if (!route) {
            await sock.sendMessage(remoteJid, {
                text: `_⚠️ Invalid format! / صيغة غير صحيحة! Choose number 1-7 / اختر رقم من 1-7_\n_ or text / أو text_`
            }, { quoted: message });
            return;
        }

        // Fetch buffer from API
        // جلب البيانات من الـ API على شكل Buffer
        try {
            const response = await axios.post(route.endpoint, route.params, {
              responseType: 'arraybuffer', // Return data as buffer
              // إعادة البيانات كـ buffer
            });
            buffer = Buffer.from(response.data);
        } catch (error) {
            console.error("Error fetching welcome buffer:", error);
            buffer = null;
        }

        // Send result to user
        // إرسال النتيجة للمستخدم
        await sock.sendMessage(
            remoteJid,
            { image: buffer, caption: `_To use this template type_ / لاستخدام هذا القالب اكتب_ *.templatewelcome ${content}*` },
            { quoted: message }
        );

    } catch (error) {
        console.error("Error in handle function:", error);
        await sock.sendMessage(remoteJid, {
            text: `_❌ An error occurred / حدث خطأ: ${error.message}_`
        }, { quoted: message });
    }
}

module.exports = {
    handle,
    Commands: ['teswelcome'],
    OnlyPremium: false,
    OnlyOwner: false
};