// ===========================
// TRUTH OR DARE - DARE MODULE
// ===========================

// ===== IMPORTS / الاستيراد =====
const { readFileAsBuffer } = require('@lib/fileHelper'); 
// Helper to read files as buffer / دالة لمطالعة الملفات كـ buffer

// ===== LOAD IMAGE / تحميل صورة =====
const buffer = readFileAsBuffer('@assets/game truth dare.jpg'); 
// Image buffer for Dare game / صورة اللعبة كـ buffer

// ===== LIST OF DARES / قائمة التحديات =====
const dares = [
    'Send a message to your ex saying "I still like you" / أرسل رسالة لشخص تحبه سابقًا وقل "لا زلت أحبك"',
    'Call your crush/partner now and screenshot the result / اتصل بحبيبك أو crush الآن والتقط لقطة للشاشة',
    'Send your location to one group member / أرسل موقعك لأحد أعضاء المجموعة',
    'Say "YOU ARE REALLY BEAUTIFUL, NO JOKE" to a guy / قل "أنت جميلة جدًا، بدون كذب" لشخص ذكر',
    'Screenshot recent WhatsApp calls / التقط لقطة لمكالمات واتساب الأخيرة',
    'Use the emoji "🤸💨" every time you type in group/pc for 1 day / استخدم رمز "🤸💨" كلما كتبت في المجموعة لمدة يوم',
    'Send a voice note saying "Can I call u baby?" / أرسل ملاحظة صوتية تقول "هل يمكنني الاتصال بك حبيبي؟"',
    'Post a song lyric/quote and tag the member it suits / انشر مقطع أغنية أو اقتباس وعلّم العضو المناسب',
    'Use Sule’s photo as profile picture for 3 days / استخدم صورة Sule كصورة الملف الشخصي لمدة 3 أيام',
    'Type in your local language for 24 hours / اكتب بلغة منطقتك لمدة 24 ساعة',
    'Change your name to "I am Lucinta Luna’s kid" for 5 hours / غيّر اسمك إلى "أنا ابن/ابنة Lucinta Luna" لمدة 5 ساعات',
    'Message WhatsApp contact in order of battery %, say "I lucky to have you" / أرسل رسالة إلى جهة اتصال وفق ترتيب البطارية وقل "أنا محظوظ لوجودك"',
    'Prank chat your ex and say "I love you, want to get back?" / امزح مع حبيبك السابق وقل "أحبك، هل تريد العودة؟"',
    'Record voice reading surah Al-Kautsar / سجل صوتك أثناء قراءة سورة الكوثر',
    'Say "I have a crush on you, want to be my partner?" to last person you chatted / قل "أحببتك، هل تريد أن تكون شريكي؟" لآخر شخص تحدثت معه',
    'Mention your ideal type of partner / اذكر نوع شريكك المثالي',
    'Snap/post photo of your partner/crush / التقط أو انشر صورة لشريكك أو crush',
    'Scream randomly and send voice note to group / صرخ عشوائيًا وأرسل ملاحظة صوتية للمجموعة',
    'Show your face and send to a friend / أظهر وجهك وأرسله لأحد أصدقائك',
    'Send your photo with caption "I am adopted" / أرسل صورتك مع التعليق "أنا متبنى"',
    'Scream using bad words in voice note and send to group / اصرخ باستخدام كلمات نابية في ملاحظة صوتية وأرسلها للمجموعة',
    'Shout "Anjimm bored anjimmm!" in front of your house / صرخ "Anjimm bored anjimmm!" أمام منزلك',
    'Change name to "BOWO" for 24 hours / غيّر اسمك إلى "BOWO" لمدة 24 ساعة',
    'Pretend to be possessed, e.g., tiger, grasshopper, fridge, etc. / تظاهر بأنك مسكون، مثل: نمر، جندب، ثلاجة، إلخ.'
];

// ===== HANDLE FUNCTION / دالة التعامل مع الرسائل =====
/**
 * Handle Dare command / إدارة أمر Dare
 * @param {Object} sock - Connection instance / كائن الاتصال
 * @param {Object} messageInfo - Message information / معلومات الرسالة
 */
async function handle(sock, messageInfo) {
    const { remoteJid, message } = messageInfo;

    // ===== SELECT RANDOM DARE / اختيار تحدٍ عشوائي =====
    const selectedDare = dares[Math.floor(Math.random() * dares.length)];

    // ===== SEND DARE TO USER / إرسال التحدي للمستخدم =====
    await sock.sendMessage(
        remoteJid,
        {
            image: buffer,
            caption: `*Dare / التحدي*\n\n${selectedDare}`,
        },
        { quoted: message }
    );
}

// ===== EXPORT MODULE / تصدير الموديول =====
module.exports = {
    handle,
    Commands: ["dare"], // Commands / الأوامر
    OnlyPremium: false,  // Available to all users / متاح لجميع المستخدمين
    OnlyOwner: false
};