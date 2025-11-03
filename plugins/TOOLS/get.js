const axios = require('axios');
const { isURL, reply } = require('@lib/utils');

async function handle(sock, messageInfo) {
    const { m, remoteJid, message, prefix, command, content } = messageInfo;
    const startTime = performance.now();

    try {
        // Validate input / التحقق من الإدخال
        if (!content || !isURL(content)) {
            return await reply(
                m, 
                `_⚠️ Usage Format / صيغة الاستخدام:_\n💬 *Example / مثال:* ${prefix + command} https://autoresbot.com`
            );
        }

        // Send loading reaction / إرسال تفاعل التحميل
        await sock.sendMessage(remoteJid, { react: { text: "🤌🏻", key: message.key } });

        // Process GET request / معالجة طلب GET
        const response = await axios.get(content);
        const endTime = performance.now();
        const responseTime = (endTime - startTime).toFixed(2);

        // Check content type from response headers / التحقق من نوع المحتوى من رؤوس الاستجابة
        const contentType = response.headers['content-type'] || '';
        if (contentType.includes('application/json')) {
            // If JSON, display JSON data / إذا كان JSON، عرض البيانات
            const jsonData = JSON.stringify(response.data, null, 2);
            const jsonResponse = `🌐 Website Info / معلومات الموقع:
- Status / الحالة: ${response.status}
- Response Time / زمن الاستجابة: ${responseTime} ms

JSON Data / بيانات JSON:
${jsonData}`;
            return await reply(m, jsonResponse);
        }

        // If not JSON, parse HTML to get title and meta description / إذا لم يكن JSON، استخراج العنوان والوصف من HTML
        const html = response.data;
        const titleMatch = html.match(/<title>(.*?)<\/title>/i);
        const metaMatch = html.match(/<meta\s+name="description"\s+content="(.*?)"/i);

        const title = titleMatch ? titleMatch[1] : 'Not found / غير موجود';
        const metaDescription = metaMatch ? metaMatch[1] : 'Not found / غير موجود';

        const infoGet = `🌐 Website Info / معلومات الموقع:
- Title / العنوان: ${title}
- Meta Description / وصف الميتا: ${metaDescription}
- Status / الحالة: ${response.status}
- Response Time / زمن الاستجابة: ${responseTime} ms`;

        await reply(m, infoGet);
    } catch (error) {
        // Handle errors / التعامل مع الأخطاء
        const errorMessage = `_❌ Sorry, an error occurred while processing your request. Please try again later / حدث خطأ أثناء معالجة طلبك. حاول مرة أخرى لاحقاً._\n\nError Details / تفاصيل الخطأ: ${error.message}`;
        await sock.sendMessage(remoteJid, { text: errorMessage }, { quoted: message });
    }
}

module.exports = {
    handle,
    Commands    : ['get'],
    OnlyPremium : false,
    OnlyOwner   : false,
    limitDeduction  : 1, // Amount of limit to deduct / عدد حدود الاستخدام التي سيتم خصمها
};