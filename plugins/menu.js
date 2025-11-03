const menu = require('@DB/menu'); // move to database folder menu.js / نقل إلى مجلد قاعدة البيانات menu.js

const linkGroup = 'https://chat.whatsapp.com/HGTk5Ha4vSa8irKdIG16sy?mode=wwt';
const AUDIO_MENU = true; // play greeting audio with menu / تشغيل صوت التحية مع قائمة

const fs = require("fs");
const path = require("path");
const config = require("@config");
const { readFileAsBuffer } = require('@lib/fileHelper');
const { reply, style, getCurrentDate, readMore } = require('@lib/utils');
const { isOwner, isPremiumUser } = require("@lib/users");

// Greeting audio files for different times / ملفات صوت التحية للأوقات المختلفة
const soundPagi = 'سورة الفاتحة مشاري راشد العفاسي Surah Al- Fatiha Mishari Rashid Alafasy(MP3_160K).mp3'; // morning / صباح
const soundSiang = 'سورة الفاتحة مشاري راشد العفاسي Surah Al- Fatiha Mishari Rashid Alafasy(MP3_160K).mp3'; // noon / ظهر
const soundSore = 'سورة الفاتحة مشاري راشد العفاسي Surah Al- Fatiha Mishari Rashid Alafasy(MP3_160K).mp3'; // afternoon / بعد ظهر
const soundPetang = 'سورة الفاتحة مشاري راشد العفاسي Surah Al- Fatiha Mishari Rashid Alafasy(MP3_160K).mp3'; // evening / مساء
const soundMalam = 'سورة الفاتحة مشاري راشد العفاسي Surah Al- Fatiha Mishari Rashid Alafasy(MP3_160K).mp3'; // night / ليل
// audio files are located in ./database/audio / الملفات الصوتية موجودة في ./database/audio

// Get greeting audio based on current time / الحصول على ملف صوت التحية حسب الوقت الحالي
function getGreeting() {
    const now = new Date();
    const utcHours = now.getUTCHours(); // UTC hours / الساعة بالتوقيت العالمي
    const wibHours = (utcHours + 7) % 24; // convert to WIB (GMT+7) / تحويل إلى توقيت WIB (GMT+7)
    
    // Determine file based on hour / تحديد الملف بناءً على الساعة
    let fileName;
    if (wibHours >= 5 && wibHours <= 10) {
        fileName = soundPagi;
    } else if (wibHours >= 11 && wibHours < 15) {
        fileName = soundSiang;
    } else if (wibHours >= 15 && wibHours <= 18) {
        fileName = soundSore;
    } else if (wibHours > 18 && wibHours <= 19) {
        fileName = soundPetang;
    } else {
        fileName = soundMalam;
    }

    // Get file path based on main working directory / الحصول على مسار الملف بناءً على مجلد العمل الرئيسي
    const filePath = path.join(process.cwd(), "database", "audio", fileName);

    try {
        // Read file as buffer / قراءة الملف كـ buffer
        const audioBuffer = fs.readFileSync(filePath);
        return audioBuffer;
    } catch (err) {
        console.error("Error reading file / خطأ في قراءة الملف:", err);
        return null;
    }
}

// Handle menu command / معالجة أمر القائمة
async function handle(sock, messageInfo) {
    
    const { m, remoteJid, pushName, sender, content, prefix, command, message } = messageInfo;

    // Determine user role / تحديد دور المستخدم
    const roleUser  = await isOwner(sender) ? 'Owner' : await isPremiumUser(sender) ? 'Premium' : 'user';

    const date      = getCurrentDate();
    const category  = content.toLowerCase();

    let response;
    let result;

    // If category exists in menu / إذا كانت الفئة موجودة في القائمة
    if (category && menu[category]) {
        response = formatMenu(category.toUpperCase(), menu[category]);
        result = await reply(m, style(response) || 'Failed to apply style. / فشل في تطبيق التنسيق');
    } else {
        if (command === 'menu') {
            // Display main menu / عرض القائمة الرئيسية
            response = `
┏━『 *MAIN MENU / القائمة الرئيسية* 』
┃
${Object.keys(menu).map(key => `┣⌬ ${key}`).join('\n')}
┗━━━━━━━◧
            
_Type the category name to see its content / اكتب اسم الفئة لرؤية محتواها_ \n\n_Example: *.menu ai*_ or *.allmenu* to display all menus / مثال: *.menu ai* أو *.allmenu* لعرض جميع القوائم`;
            result = await reply(m, style(response) || 'Failed to apply style. / فشل في تطبيق التنسيق');

        } else if (command === 'allmenu') { // Display all menus / عرض جميع القوائم
            
            response = `
╭─────────────
│ Name  : *${pushName || 'Unknown'}*
│ Role  : *${roleUser}*
│ Date  : *${date}*
├────
╰──────────────

${readMore()}

${Object.keys(menu).map(key => formatMenu(key.toUpperCase(), menu[key])).join('\n\n')}
            `;

            const buffer = readFileAsBuffer('@assets/allmenu.jpg');
          
            result = await sock.sendMessage(remoteJid, {
                text : style(response),
                contextInfo: {
                    externalAdReply: {
                        showAdAttribution: false, 
                        title: `Hello ${pushName} / مرحباً ${pushName}`,
                        body: `Resbot ${config.version}`,
                        thumbnail: buffer,
                        jpegThumbnail: buffer, // add this / أضف هذا
                        thumbnailUrl: linkGroup,
                        sourceUrl: linkGroup,
                        mediaType: 1,
                        renderLargerThumbnail: true
                    }
                }
            }, { quoted: message });
        }
    }

    // Send greeting audio for allmenu / إرسال الصوت التحية عند allmenu
    if(command === 'allmenu' || (command === 'menu' && content === '')) {
        if(AUDIO_MENU){
            const audioBuffer = getGreeting();
            await sock.sendMessage(remoteJid, { audio: audioBuffer , mimetype: 'audio/mp4', ptt: true }, { quoted : result});
        }
    }
}

// Format menu items / تنسيق عناصر القائمة
const formatMenu = (title, items) => {
    const formattedItems = items.map(item => {
        if (typeof item === 'string') {
            return `┣⌬ ${item}`;
        }
        if (typeof item === 'object' && item.command && item.description) {
            return `┣⌬ ${item.command} ${item.description}`;
        }
        return '┣⌬ [Invalid item / عنصر غير صالح]';
    });

    return `┏━『 *${title.toUpperCase()}* 』\n┃\n${formattedItems.join('\n')}\n┗━━━━━━━◧`;
};

// Export module / تصدير الوحدة
module.exports = {
    handle,
    Commands    : ['menu', 'allmenu'], // Command triggers / أوامر التشغيل
    OnlyPremium : false, // Not limited to premium users / غير مقتصر على المميزين
    OnlyOwner   : false  // Not limited to owner / غير مقتصر على المالك
};