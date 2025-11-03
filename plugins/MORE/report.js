const ApiAutoresbot = require('api-autoresbot');
const config = require("@config");
const { reply } = require('@lib/utils');

async function handle(sock, messageInfo) {
    const { m, remoteJid, content, prefix, command } = messageInfo;

    try {
        // ✅ التحقق من وجود المحتوى / Validate content
        if (!content) {
            return await reply(
                m,
                `⚠️ _طريقة الاستخدام / Usage Format:_ 
                
💬 *مثال / Example:* 
_${prefix + command}_ خطأ في تشغيل الموسيقى، الرابط: https://tiktok.com`
            );
        }

        // ✅ التحقق من الحد الأدنى للطول / Minimum character validation
        if (content.length < 30) {
            return await reply(
                m,
                `⚠️ _الحد الأدنى 30 حرفًا / Minimum 30 characters required_`
            );
        }

        // 📝 تحضير البيانات / Prepare data
        const title = `تقرير خطأ / Bug Report - Resbot V${global.version}`;
        const api = new ApiAutoresbot(config.APIKEY);

        // 📤 إرسال التقرير إلى API / Send report to API
        const response = await api.get(`/api/database/report-issues`, {
            title,
            description: content
        });

        // ✅ إذا تم الإرسال بنجاح / If successfully submitted
        if (response && response.status) {
            await sock.sendMessage(
                remoteJid,
                {
                    text: '✅ تم إرسال التقرير بنجاح. شكرًا لمساهمتك! / Report sent successfully. Thank you for your contribution!'
                },
                { quoted: m }
            );
        } else {
            throw new Error('⚠️ لا يوجد رد من الخادم / No response from API.');
        }
    } catch (error) {
        console.error('🚫 خطأ أثناء إرسال التقرير / Error while sending report:', error.message);
        await reply(m, `⚠️ ${error.message}`);
    }
}

// ⚙️ إعدادات الأمر / Command settings
module.exports = {
    handle,
    Commands: ['report'],      // اسم الأمر / Command name
    OnlyPremium: false,        // متاح للجميع / Available for all users
    OnlyOwner: false           // ليس خاصًا بالمالك فقط / Not owner-only
};