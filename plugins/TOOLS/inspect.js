const { reply } = require("@lib/utils");
const moment = require("moment-timezone");
const config = require("@config");
const ApiAutoresbot = require("api-autoresbot");
const { logCustom } = require("@lib/logger");

async function handle(sock, messageInfo) {
    const { m, remoteJid, message, content, prefix, command } = messageInfo;

    try {
        // Validate if no content / التحقق إذا لم يكن هناك محتوى
        if (!content) {
            return await reply(m, `_⚠️ Usage Format / صيغة الاستخدام:_ \n\n_💬 Example / مثال:_ _${prefix + command} https://chat.whatsapp.com/GtaKoZ3HCB21CG3BF3gmQ3_`);
        }

        // Extract invite code from WhatsApp group link / استخراج كود الدعوة من رابط المجموعة
        const inviteCode = content.split("https://chat.whatsapp.com/")[1];
        if (!inviteCode) {
            return await reply(m, "⚠️ _Invalid Link / رابط غير صالح_");
        }

        // Send processing reaction / إرسال تفاعل التحميل
        await sock.sendMessage(remoteJid, { react: { text: "🤌🏻", key: message.key } });

        // Query WhatsApp server for group info / استعلام خادم واتساب للحصول على معلومات المجموعة
        const response = await sock.query({
            tag: "iq",
            attrs: { type: "get", xmlns: "w:g2", to: "@g.us" },
            content: [{ tag: "invite", attrs: { code: inviteCode } }]
        });

        const groupInfo = response.content[0]?.attrs || {};

        // Format group details / تنسيق تفاصيل المجموعة
        const groupDetails = `「 _*Inspected Group Info / معلومات المجموعة*_* 」\n\n` +
            `◧ Name / الاسم : ${groupInfo.subject || "undefined"}\n` +
            `◧ Desc / الوصف : ${groupInfo.s_t ? moment(groupInfo.s_t * 1000).tz("Asia/Jakarta").format("DD-MM-YYYY, HH:mm:ss") : "undefined"}\n` +
            `◧ Owner / المالك : ${groupInfo.creator ? "@" + groupInfo.creator.split("@")[0] : "undefined"}\n` +
            `◧ Created / تم الإنشاء : ${groupInfo.creation ? moment(groupInfo.creation * 1000).tz("Asia/Jakarta").format("DD-MM-YYYY, HH:mm:ss") : "undefined"}\n` +
            `◧ Size / عدد الأعضاء : ${groupInfo.size || "undefined"} Member\n` +
            `◧ ID : ${groupInfo.id || "undefined"}`;

        // Attempt to get group profile picture / محاولة الحصول على صورة الملف الشخصي للمجموعة
        let ppUrl = null;
        try {
            ppUrl = await sock.profilePictureUrl(`${groupInfo.id}@g.us`, "image");
        } catch {
            // Fallback using API Autoresbot / استخدام واجهة Autoresbot كخطة بديلة
            const api = new ApiAutoresbot(config.APIKEY);
            const apiResponse = await api.get('/api/stalker/whatsapp-group', { url: content });
            if (!apiResponse || !apiResponse.imageLink) throw new Error("No profile image found / لم يتم العثور على صورة المجموعة");
            ppUrl = apiResponse.imageLink;
        }

        // Send message with or without image / إرسال الرسالة مع أو بدون الصورة
        if (ppUrl) {
            await sock.sendMessage(
                remoteJid,
                { image: { url: ppUrl }, caption: groupDetails },
                { quoted: message }
            );
        } else {
            await reply(m, groupDetails);
        }

    } catch (error) {
        console.error("Error processing group / خطأ أثناء معالجة المجموعة:", error);
        logCustom('info', content, `ERROR-COMMAND-${command}.txt`);

        // Send error message / إرسال رسالة الخطأ
        await sock.sendMessage(
            remoteJid,
            { text: "⚠️ An error occurred while fetching group info. Make sure the format is correct and the bot has permission.\n\nحدث خطأ أثناء جلب معلومات المجموعة. تأكد من صحة الرابط ومن صلاحيات البوت." },
            { quoted: message }
        );
    }
}

module.exports = {
    handle,
    Commands: ["inspect"], // Command to inspect WhatsApp group / أمر فحص مجموعة واتساب
    OnlyPremium: false,
    OnlyOwner: false,
    limitDeduction: 1 // Limit deduction count / عدد الاستخدامات التي سيتم خصمها
};