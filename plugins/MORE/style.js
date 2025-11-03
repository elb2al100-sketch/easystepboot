const { reply, style } = require('@lib/utils');

async function handle(sock, messageInfo) {
    const { m, remoteJid, message, prefix, command, content } = messageInfo;

    try {
        // 🧾 إذا لم يتم إدخال نص / If no text is provided
        if (!content) {
            return await reply(m, 
`⚠️ _طريقة الاستخدام / Usage format:_ 

💬 _مثال / Example:_ *${prefix + command} resbot*

✨ *أمثلة على الأنماط / Style examples:*  
𝓮𝔁𝓪𝓶𝓹𝓵𝓮 𝓼𝓽𝔂𝓵𝓮1  
𝓮𝔁𝓪𝓶𝓹𝓵𝓮 𝓼𝓽𝔂𝓵𝓮2  
𝐞𝐱𝐚𝐦𝐩𝐥𝐞 𝐬𝐭𝐲𝐥𝐞3  
𝗲𝘅𝗮𝗺𝗽𝗹𝗲 𝘀𝘁𝘆𝗹𝗲4  
𝘦𝘹𝘢𝘮𝘱𝘭𝘦 𝘴𝘵𝘺𝘭𝘦5  
𝙚𝙭𝙖𝙢𝙥𝙡𝙚 𝙨𝙩𝙮𝙡𝙚6  
🄴🅇🄰🄼🄿🄻🄴 🅂🅃🅈🄻🄴7  
🅴🆇🅰🅼🅿🅻🅴 🆂🆃🆈🅻🅴8  

_استخدم الأوامر من .style2 إلى .style10 لتجربة أنماط أخرى_  
_Use .style2 up to .style10 for more styles_`);
        }

        // 🪄 تطبيق الزخرفة / Apply text style
        const result = style(content);
        if (!result) {
            return await reply(m, '⚠️ _فشل في تطبيق النمط، تحقق من النص._ / Failed to apply style. Please check your input.');
        }

        // 📤 إرسال النص المزخرف / Send styled text
        await sock.sendMessage(remoteJid, { text: result }, { quoted: message });
    } catch (error) {
        console.error('Error in handle function:', error);
        // ⚠️ إرسال الخطأ للمستخدم / Send error message
        await sock.sendMessage(remoteJid, { text: `_حدث خطأ: ${error.message}_ / _Error: ${error.message}_` }, { quoted: message });
    }
}

module.exports = {
    handle,
    Commands    : ['style'],
    OnlyPremium : false,
    OnlyOwner   : false
};