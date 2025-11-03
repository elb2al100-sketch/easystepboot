const { reply, isURL } = require("@lib/utils");
const fetch = require("node-fetch");

async function handle(sock, messageInfo) {
    const { m, remoteJid, message, prefix, command, content } = messageInfo;

    try {
        // Validate input / التحقق من الإدخال
        if (!content || !content.includes("github.com")) {
            return await reply(
                m, 
                `_⚠️ Usage Format / صيغة الاستخدام:_\n💬 *Example / مثال:* ${prefix + command} https://github.com/WhiskeySockets/Baileys.git`
            );
        }
        
        if (!isURL(content)) {
            return await reply(m, `_❌ Invalid link / رابط غير صالح_`);
        }

        // Send reaction during processing / إرسال تفاعل أثناء المعالجة
        await sock.sendMessage(remoteJid, { react: { text: "🤌🏻", key: message.key } });

        // Extract user and repository info from URL / استخراج معلومات المستخدم والمستودع من الرابط
        const regex = /(?:https|git)(?::\/\/|@)github\.com[/:]([^\/]+)\/([^\/]+)(?:\.git)?$/i;
        const match = content.match(regex);

        if (!match) {
            return await reply(m, `_❌ Invalid GitHub repository URL / الرابط غير صالح لمستودع GitHub_`);
        }

        let [ , user, repo ] = match;
        repo = repo.replace(/.git$/, '');
        const url = `https://api.github.com/repos/${user}/${repo}/zipball`;

        // Get filename from response headers / الحصول على اسم الملف من رؤوس الاستجابة
        const response = await fetch(url, { method: 'HEAD' });
        if (!response.ok) {
            return await reply(m, `_❌ Failed to fetch GitHub repository. Check URL or try again later / فشل في جلب مستودع GitHub. تحقق من الرابط أو حاول لاحقاً._`);
        }

        const contentDisposition = response.headers.get('content-disposition');
        const filenameMatch = contentDisposition?.match(/attachment; filename=(.+)/);
        const filename = filenameMatch ? filenameMatch[1] : `${repo}.zip`;

        // Send file as document / إرسال الملف كوثيقة
        await sock.sendMessage(
            remoteJid,
            {
                document: { url },
                fileName: filename,
                mimetype: 'application/zip'
            },
            { quoted: message }
        );

    } catch (error) {
        console.error("Error in handle function / خطأ في دالة handle:", error);
        const errorMessage = error.message || "Unknown error occurred / حدث خطأ غير معروف.";
        return await reply(m, `_❌ Error: ${errorMessage}_`);
    }
}

module.exports = {
    handle,
    Commands    : ["git"],
    OnlyPremium : false,
    OnlyOwner   : false,
    limitDeduction  : 1, // Amount of limit to deduct / عدد حدود الاستخدام التي سيتم خصمها
};