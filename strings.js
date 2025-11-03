/*
⚠️ WARNING / تحذير:
This script **MUST NOT BE SOLD** / هذا السكربت **لا يجوز بيعه** in any form / بأي شكل من الأشكال!

╔══════════════════════════════════════════════╗
║                🛠️ SCRIPT INFO / معلومات السكربت        ║
╠══════════════════════════════════════════════╣
║ 📦 Version   : 4.2.6                        ║
║ 👨‍💻 Developer  : Eslam Samo               ║
║ 🌐 Website    : https://easystep.life       ║
║ 📲 Number     : +201065537938               ║
╚══════════════════════════════════════════════╝

📌 Starting November 1, 2025 / اعتباراً من 1 نوفمبر 2025,
the **easystepbot** script officially becomes **Open Source** and can be used for free / أصبح السكربت مفتوح المصدر ويمكن استخدامه مجاناً:
🔗 https://easystep.life
*/

// ======================== MESSAGES / الرسائل ========================
const mess = {
    // Game messages / رسائل الألعاب
    game: {
        isPlaying   : "⚠️ _Game is currently running._ Type *nyerah* to quit.\n⚠️ _اللعبة جارية الآن. اكتب *nyerah* للخروج._",
        isGroup     : "⚠️ _This game can only be played in groups_\n⚠️ _هذه اللعبة يمكن لعبها في المجموعات فقط._",
        isStop      : "⚠️ _Game feature is disabled in this group_\n⚠️ _ميزة اللعبة معطلة في هذه المجموعة._",
    },

    // General messages / رسائل عامة
    general : {
        isOwner     : ' _*THIS COMMAND IS FOR OWNER ONLY*_ / _*هذا الأمر مخصص للمالك فقط*_',
        isPremium   : ' _*PREMIUM USERS ONLY*_ / _*للمشتركين فقط*_',
        isAdmin     : ' _*ADMIN ONLY COMMAND*_ / _*هذا الأمر للمديرين فقط*_',
        isGroup     : " _*GROUP ONLY FEATURE*_ / _*ميزة للمجموعات فقط*_",
        limit       : " _*YOUR LIMIT IS OVER*_ / _*لقد انتهت الحدود الخاصة بك*_",
        success     : " _*DONE*_ / _*تم بنجاح*_",
        isBlocked   : " _*USER IS BLOCKED*_ / _*المستخدم محظور*_",
        isBaned     : " _*USER BANNED IN THIS GROUP*_ / _*المستخدم محظور في هذه المجموعة*_",
        fiturBlocked: " _*FEATURE BLOCKED*_ / _*الميزة محظورة*_",
    },

    // Action messages / رسائل الأفعال
    action : {
        grub_open   : '_*GROUP OPENED FOR MEDIA*_ / _*المجموعة مفتوحة للإرسال*_',
        grub_close  : '_*GROUP CLOSED BY ADMIN*_ / _*المجموعة مغلقة بواسطة المسؤول*_',
        user_kick   : ' _*USER KICKED SUCCESSFULLY*_ / _*تم طرد المستخدم بنجاح*_',
        mute        : '_*BOT MUTED BY ADMIN*_ / _*تم كتم البوت بواسطة المسؤول*_',
        unmute      : '_*BOT UNMUTED*_ / _*تم إلغاء كتم البوت*_',
        resetgc     : '_*GROUP LINK RESET SUCCESSFULLY*_ / _*تم إعادة تعيين رابط المجموعة بنجاح*_',
    },

    // Handler notifications / رسائل المعالج
    handler : { 
        badword_warning : '⚠️ _*BADWORD DETECTED*_ (@detectword)\n\n@sender _has been warned_ (@warning/@totalwarning)\n⚠️ _تم اكتشاف كلمة مسيئة_ (@detectword)\n\n@sender _تم تحذيره_ (@warning/@totalwarning)',
        badword_block   : '⛔ @sender _Blocked due to repeated BADWORD_ (@detectword). Contact owner if needed.\n⛔ @sender _تم حظره بسبب إرسال كلمات مسيئة متكررة_ (@detectword). تواصل مع المالك إذا لزم الأمر.',
        antiedit        : '⚠️ _*ANTI EDIT DETECTED*_\n\n_Previous Message_ : @oldMessage\n⚠️ _تم اكتشاف تعديل على الرسالة_\n\n_الرسالة السابقة_ : @oldMessage',
        antidelete      : '⚠️ _*ANTI DELETE DETECTED*_\n\n_Sender_ : @sender \n_Previous Message_ : @text\n⚠️ _تم اكتشاف حذف رسالة_\n\n_المرسل_ : @sender \n_الرسالة السابقة_ : @text',
        antispamchat    : '⚠️ @sender _Do not spam, warning @warning of @totalwarning_\n⚠️ @sender _لا ترسل رسائل سبام، هذا تحذير رقم @warning من @totalwarning._',
        antispamchat2   : '⛔ @sender _Blocked due to repeated spam. Contact owner if needed._\n⛔ @sender _تم حظره بسبب السبام المتكرر. تواصل مع المالك إذا لزم الأمر._',
        antivirtex      : '⚠️ @sender _Detected sending Virtex_\n⚠️ @sender _تم اكتشاف إرسال فيروس فيرس_',
        antitagsw       : '⚠️ @sender _Detected tagging SW in group_\n⚠️ @sender _تم اكتشاف تاغ SW في المجموعة_',
        antibot         : '⚠️ @sender _Detected as a bot_\n⚠️ @sender _تم اكتشاف أنه بوت_',
        afk             : '🚫 *Do not tag!*\n\n❏ _@sender is AFK since *@durasi*_@alasan\n🚫 *لا تقم بعمل تاج له!*\n\n❏ _@sender غير متصل منذ *@durasi*_@alasan',
        afk_message     : '🕊️ @sender has returned from AFK since _*@durasi*_.@alasan\n🕊️ @sender عاد من حالة AFK منذ _*@durasi*_.@alasan',
        sewa_notif      : '⚠️ _*WARNING!*_\n\n_Rental Period:_ @date\n⚠️ _*تحذير!*_\n\n_مدة استئجار البوت:_ @date',
        sewa_out        : `❌ _*RENTAL PERIOD EXPIRED*_\n_Bot will leave automatically_\n\nThank you for using autoresbot rental service.\n\n*Owner Number*\nwa.me/@ownernumber\n❌ _*انتهت مدة استئجار البوت*_\n_سيخرج البوت تلقائياً_\n\nشكراً لاستخدام خدمة تأجير autoresbot.\n\n*رقم المالك*\nwa.me/@ownernumber`
    },

    // Game handler messages / رسائل معالجة اللعبة
    game_handler : {
        menyerah        : 'Surrendered\nAnswer: @answer\n\nWant to play? Type *@command*\nاستسلم\nالجواب: @answer\n\nهل تريد اللعب؟ اكتب *@command*',
        waktu_habis     : '⏳ Time\'s up! Answer: @answer\n⏳ انتهى الوقت! الجواب: @answer',
        tebak_angka     : '🎉 Congrats! Correct guess. You won @hadiah Money.\n🎉 مبروك! إجابتك صحيحة. لقد حصلت على @hadiah Money.',
        tebak_bendera   : '🎉 Congrats! Correct guess. You won @hadiah Money.\n🎉 مبروك! إجابتك صحيحة. لقد حصلت على @hadiah Money.',
        tebak_gambar    : '🎉 Congrats! Correct guess. You won @hadiah Money.\n🎉 مبروك! إجابتك صحيحة. لقد حصلت على @hadiah Money.',
        tebak_hewan     : '🎉 Congrats! Correct guess. You won @hadiah Money.\n🎉 مبروك! إجابتك صحيحة. لقد حصلت على @hadiah Money.',
        tebak_kalimat   : '🎉 Congrats! Correct guess. You won @hadiah Money.\n🎉 مبروك! إجابتك صحيحة. لقد حصلت على @hadiah Money.',
        tebak_kata      : '🎉 Congrats! Correct guess. You won @hadiah Money.\n🎉 مبروك! إجابتك صحيحة. لقد حصلت على @hadiah Money.',
        tebak_lagu      : '🎉 Congrats! Correct guess. You won @hadiah Money.\n🎉 مبروك! إجابتك صحيحة. لقد حصلت على @hadiah Money.',
        tebak_lirik     : '🎉 Congrats! Correct guess. You won @hadiah Money.\n🎉 مبروك! إجابتك صحيحة. لقد حصلت على @hadiah Money.',
    }
};

// ======================== GLOBAL VARIABLES / المتغيرات العامة ========================
global.group = {};
global.group.variable = `
☍ @name       // Group name / اسم المجموعة
☍ @date       // Date / التاريخ
☍ @day        // Day / اليوم
☍ @desc       // Description / الوصف
☍ @group      // Group ID / معرف المجموعة
☍ @greeting   // Greeting message / رسالة الترحيب
☍ @size       // Group size / عدد أعضاء المجموعة
☍ @time       // Current time / الوقت الحالي
`;

module.exports = mess;