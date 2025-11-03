// Set to track users who already received notifications / مجموعة لتتبع المستخدمين الذين تم إشعارهم مسبقًا
const notifiedUsers = new Set();

// Import required libraries / استيراد المكتبات المطلوبة
const { addUser, findUser, updateUser, isOwner } = require("@lib/users"); // User functions / دوال المستخدم
const { SLRcheckMessage } = require("@lib/slr"); // Function to check SLR message / دالة للتحقق من رسائل SLR
const { findGroup, addGroup, isUserBlocked, isFiturBlocked } = require("@lib/group"); // Group functions / دوال المجموعة
const { logWithTime, warning, logTracking } = require('@lib/utils'); // Utility functions / دوال مساعدة
const mess = require('@mess'); // Message templates / قوالب الرسائل
const { getGroupMetadata } = require("@lib/cache"); // Get group metadata / الحصول على بيانات المجموعة

// Main process function / الدالة الرئيسية لمعالجة المستخدمين والمجموعات
async function process(sock, messageInfo) {
    const { remoteJid, sender, isGroup, pushName, command, message, mentionedJid } = messageInfo;

    if (!sender) return true; // Skip if sender is not valid / تخطي إذا لم يكن هناك مرسل صالح

    try {
        // Check if bot is in self-mode / تحقق إذا كان البوت في وضع self
        const selfChecker = await findGroup('owner');
        if(selfChecker && command != 'public'){
            console.log('BOT IS IN SELF MODE')
            logWithTime('System', `BOT IS IN SELF MODE`);
            if(await isOwner(sender)) {
                return true;
            }
            return false;
        }
        
        // Find user / البحث عن المستخدم
        const user = await findUser(sender);

        if (isGroup) { // Check if in group / تحقق إذا كانت الرسالة من مجموعة
            const dataGrub = await findGroup(remoteJid);
            if (!dataGrub) {
                // Add group if not exists / إضافة المجموعة إذا لم تكن موجودة
                await addGroup(remoteJid, {
                    fitur: {
                        antilink    : false,
                        antilinkv2  : false,
                        antilinkwa  : false,
                        antilinkwav2: false,
                        badword     : false,
                        antidelete  : false,
                        antiedit    : false,
                        antigame    : false,
                        antifoto    : false,
                        antivideo   : false,
                        antiaudio   : false,
                        antidocument: false,
                        antikontak  : false,
                        antisticker : false,
                        antipolling : false,
                        antispamchat: false,
                        antivirtex  : false,
                        antiviewonce: false,
                        autoai      : false,
                        autosimi    : false,
                        autorusuh   : false,
                        welcome     : false,
                        left        : false,
                        promote     : false,
                        demote      : false,
                        onlyadmin   : false,
                        mute        : false,
                        detectblacklist : false,
                        waktusholat : false,
                        antibot     : false,
                        antitagsw   : false,
                        antitagsw2  : false,
                        antitagmeta  : false,
                        antitagmeta2  : false
                    },
                    userBlock : [],
                });
            }

            // Check if user is banned in this group / التحقق إذا كان المستخدم محظور في هذه المجموعة
            const isBaned = await isUserBlocked(remoteJid, sender);
            
            if(isBaned) {
                const notifKey = `ban-${remoteJid}-${sender}`;
                if (!notifiedUsers.has(notifKey)) {
                    notifiedUsers.add(notifKey);
                    logTracking(`User Handler - ban-${remoteJid}-${sender}`);
                    await sock.sendMessage(remoteJid, { text: mess.general.isBaned }, { quoted: message });
                }

                warning(pushName, `User is currently banned in this group / المستخدم محظور حالياً في هذه المجموعة`)
                return false;
            }

            // Check if feature is blocked in this group / التحقق إذا كانت الميزة محظورة في هذه المجموعة
            const isBlockFitur = await isFiturBlocked(remoteJid, command);
            if(isBlockFitur) {
                const notifKey = `fiturblocked-${remoteJid}-${command}`;
                if (!notifiedUsers.has(notifKey)) {
                    notifiedUsers.add(notifKey);
                    logTracking(`User Handler - fiturblocked-${remoteJid}-${command}`);
                    await sock.sendMessage(remoteJid, { text: mess.general.fiturBlocked }, { quoted: message });
                }

                warning(pushName, `Feature is currently blocked in this group / الميزة محظورة حالياً في هذه المجموعة`)
                return false;
            }

            // SLR check if user mentions someone / التحقق من SLR إذا ذكر المستخدم شخصاً ما
            if(mentionedJid?.length > 0){
                const isSlr = await SLRcheckMessage(remoteJid);
                if(isSlr){
                    const groupMetadata = await getGroupMetadata(sock, remoteJid);
                    const participants  = groupMetadata.participants;
                    const isAdmin       = participants.some(participant => participant.id === mentionedJid[0] && participant.admin);
                    if(isAdmin) {
                        logTracking(`User Handler - SLR Feature On`);
                        await sock.sendMessage(remoteJid, { text: isSlr }, { quoted: message });
                        return;
                    }
                }
            }
        }

        if (user) {
            const status = user.status;
            if(status === 'block') { // User is blocked / المستخدم محظور
                const notifKey = `block-${sender}`;
                if (!notifiedUsers.has(notifKey)) {
                    notifiedUsers.add(notifKey); // Mark as notified / وضع علامة بأنه تم الإشعار
                    logTracking(`User Handler - block-${sender}`);
                    await sock.sendMessage(remoteJid, { text: mess.general.isBlocked }, { quoted: message });
                }
                
                warning(pushName, `User is currently blocked / المستخدم محظور حالياً`)
                return false;
            }

            // Increment level_cache, and level up if limit reached / زيادة level_cache، ورفع المستوى إذا تم الوصول للحد
            let { level, level_cache } = user;
            level_cache += 1;

            // Level up if level_cache exceeds 100 / رفع المستوى إذا تجاوز level_cache 100
            if (level_cache > 100) {
                level += 1; // Increase level / زيادة المستوى
                level_cache = 0; // Reset level_cache / إعادة تعيين level_cache
            }
  
            await updateUser(sender,  { level, level_cache } )

        } else {
             // Add user if not exists / إضافة المستخدم إذا لم يكن موجوداً
            await addUser(sender, {
                money: 0,
                limit : 0,
                level_cache : 0,
                level : 1,
                role: "user",
                achievement : 'gamers',
                status: "active",
                afk : {
                    lastchat : 0,
                    alasan : null
                }
            });
        }

        return true; // Continue to next plugin / متابعة إلى الإضافة التالية

    } catch (error) {
        logWithTime('System', `Error in register process / خطأ في عملية التسجيل`);
        return false; // Stop process if error / إيقاف المعالجة إذا حدث خطأ
    }
}

// Export plugin module / تصدير وحدة البرنامج المساعد
module.exports = {
    name: "Users & Group Handle", // Plugin name / اسم البرنامج المساعد
    priority: 3, // Plugin priority / أولوية البرنامج المساعد
    process, // Process function / دالة المعالجة
};