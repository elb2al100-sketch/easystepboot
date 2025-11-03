/*!
⚠️ تحذير / WARNING:
هذا السكريبت **لا يجوز بيعه بأي شكل من الأشكال**
This script **MUST NOT BE SOLD** in any form!

╔══════════════════════════════════════════════╗
║                🛠️ معلومات السكريبت / Script Information           ║
╠══════════════════════════════════════════════╣
║ 📦 النسخة / Version   : 4.2.6                       ║
║ 👨‍💻 المطور / Developer  : EslamSamo               ║
║ 🌐 الموقع / Website   : https://easystep.life     ║
║ 📲 GitHub / Number    : +201065537938             ║
╚══════════════════════════════════════════════╝

📌 اعتبارًا من 1 نوفمبر 2025:
أصبح سكريبت **easystepbot** رسميًا **مفتوح المصدر** ويمكن استخدامه مجانًا.
Starting from November 1, 2025:
The "easystepbot" script officially becomes **Open Source** and can be used for free.
🔗 https://easystep.life
*/

// ===== استيراد المكتبات / Import Dependencies =====
const chokidar = require('chokidar'); // مراقب الملفات للتطوير / File watcher for development
const config = require("@config"); // إعدادات السكريبت / Config file
const mode = config.mode; // وضع السكريبت: development / production / Script mode
const { findGroup } = require("@lib/group"); // دوال المجموعات / Group utilities
const chalk = require('chalk'); // ألوان للترمينال / Terminal colors
const handler = require('./lib/handler'); // معالجة الرسائل / Message handler
const mess = require("@mess"); // رسائل جاهزة / Predefined messages
const { updateParticipant } = require("@lib/cache"); // تحديث بيانات المشاركين / Update participant cache
const lastMessageTime = {}; // لتخزين آخر وقت رسالة / Store last message time
const path = require('path'); // التعامل مع المسارات / Path module
const { handleActiveFeatures } = require('./lib/participant_update'); // إدارة ميزات المجموعة / Handle active group features
const { logWithTime, log, danger, findClosestCommand, logTracking } = require('@lib/utils'); // دوال مساعدة / Utility functions
const { isOwner, isPremiumUser, updateUser, findUser } = require("@lib/users"); // دوال المستخدمين / User functions
const pluginsPath = path.join(process.cwd(), 'plugins'); // مسار الإضافات / Plugins path
const lastSent_participantUpdate = {}; // لتخزين آخر تحديث للمشاركين / Store last participant update time

const { reloadPlugins } = require("@lib/plugins"); // إعادة تحميل الإضافات / Reload plugins
const { logCustom } = require("@lib/logger"); // تسجيل مخصص / Custom logging
let plugins = [];

// ===== تحميل الإضافات عند التشغيل / Load plugins on startup =====
reloadPlugins().then((loadedPlugins) => {
    plugins = loadedPlugins;
}).catch((error) => {
    console.error('❌ ERROR: Gagal memuat plugins / Failed to load plugins:', error);
});

// ===== مراقبة التغيرات في وضع التطوير / Hot reload in development mode =====
if (mode === 'development') {
    const watcher = chokidar.watch(pluginsPath, {
        persistent: true,
        ignoreInitial: true,
        ignored: /(^|[\/\\])\../, // تجاهل الملفات المخفية / Ignore hidden files
    });

    watcher.on('change', (filePath) => {
        if (filePath.endsWith('.js')) {
            logWithTime('System', `File changed: ${filePath}`);
            
            reloadPlugins().then((loadedPlugins) => {
                plugins = loadedPlugins;
            }).catch((error) => {
                console.error('❌ ERROR: Gagal memuat plugins / Failed to load plugins:', error);
            });
        }
    });

    logWithTime('System', 'Hot reload active in development mode.');
} else {
    logWithTime('System', 'Hot reload disabled in production mode.');
}

// ===== الدالة الرئيسية لمعالجة الرسائل / Main function to process messages =====
async function processMessage(sock, messageInfo) { 
    const { remoteJid, isGroup, message, sender, pushName, fullText, prefix, command } = messageInfo;

    const isPremiumUsers = await isPremiumUser(sender); // هل المستخدم بريميوم / Is premium user
    const isOwnerUsers = await isOwner(sender); // هل المستخدم مالك / Is owner
    
    try {
        const shouldContinue = await handler.preProcess(sock, messageInfo); 
        // تنفيذ المعالجة الأولية / Pre-process message
        if (!shouldContinue) return; // توقف إذا قرر handler التوقف / Stop if handler decided

        // ===== معدل الرسائل / Rate limiter =====
        let truncatedContent = fullText.length > 10 ? fullText.slice(0, 10) + '...' : fullText;
        const currentTime = Date.now();
        if (lastMessageTime[remoteJid] && (currentTime - lastMessageTime[remoteJid] < config.rate_limit) && prefix && !isOwnerUsers) {
            danger(pushName, `Rate limit : ${truncatedContent}`)
            return; 
        }
        if(prefix) lastMessageTime[remoteJid] = currentTime;

        if (truncatedContent.trim() && prefix) { // تأكد أن النص غير فارغ / Ensure text not empty
            const logMessage = config.mode === 'production'
                ? () => log(pushName, truncatedContent)
                : () => logWithTime('CHAT', `${pushName}(${sender.split("@")[0]}) - ${truncatedContent}`);
            logMessage();
        }

        // ===== تحقق من نوع الدردشة / Check chat destination =====
        if (
            (config.bot_destination.toLowerCase() === 'private' && isGroup) || 
            (config.bot_destination.toLowerCase() === 'group' && !isGroup)
        ) {
            if(!isOwnerUsers){
                logWithTime('SYSTEM',`Destination handle only - ${config.bot_destination} chat`);
                return;
            }
        }

        let commandFound = false;

        // ===== البحث عن الأمر في الإضافات / Iterate through plugins =====
        for (const plugin of plugins) {
            if (plugin.Commands.includes(command)) {
                commandFound = true;

                // تحقق من أوامر بريميوم / Check premium only commands
                if (plugin.OnlyPremium && !isPremiumUsers && !isOwnerUsers) {
                    logTracking(`Handler - Not premium (${command})`)
                    await sock.sendMessage(remoteJid, { text: mess.general.isPremium }, { quoted: message });
                    return;
                }

                // تحقق من أوامر المالك / Check owner only commands
                if (plugin.OnlyOwner && !isOwnerUsers) {
                    logTracking(`Handler - Not Owner (${command})`)
                    await sock.sendMessage(remoteJid, { text: mess.general.isOwner }, { quoted: message });
                    return;
                }

                // تحقق من حد الاستخدام / Check command usage limit
                if (!isPremiumUsers && !isOwnerUsers && plugin.limitDeduction) {
                    try {
                        const dataUsers = await findUser(sender);
                        if (!dataUsers) return;

                        const isLimitExceeded = dataUsers.limit < plugin.limitDeduction || dataUsers.limit < 1;
                        if (isLimitExceeded) {
                            logTracking('Handler - Limit reached ')
                            await sock.sendMessage(remoteJid, { text: mess.general.limit }, { quoted: message });
                            return;
                        }

                        await updateUser(sender, { limit: dataUsers.limit - plugin.limitDeduction });
                    } catch (error) {
                        console.error(`Terjadi kesalahan saat mengurangi limit pengguna / Error reducing user limit: ${error.message}`);
                    }
                }

                const pluginResult = await plugin.handle(sock, messageInfo);
                logTracking(`Plugins - ${command} executed by ${sender}`)

                // إذا طلبت الإضافة إيقاف التنفيذ / Stop execution if plugin returns false
                if (pluginResult === false) return;
            }
        }

        // ===== اقتراح الأمر الأقرب إذا لم يتم العثور على الأمر / Suggest closest command if not found =====
        if(config.commandSimilarity && !commandFound) {
            const closestCommand = findClosestCommand(command, plugins);
            if (closestCommand && command != '' && fullText.length < 20 && prefix) {
                logTracking(`Handler - Command not found (${command})`)
                logCustom('info', `_Command *${command}* not found_ \n\n_Did you mean *.${closestCommand}*?_`, `ERROR-COMMAND-NOT-FOUND.txt`);
                await sock.sendMessage(remoteJid, { text: `_Command *${command}* not found_ \n\n_Did you mean *.${closestCommand}*?_` }, { quoted: message });
            }
        }

    } catch (error) {
        logCustom('info', error, `ERROR-processMessage.txt`);
        danger(command, `Kesalahan di processMessage / Error in processMessage: ${error}`)
    }
}

// ===== تحديث المشاركين / Participant update =====
async function participantUpdate(sock, messageInfo) {
    const { id, action, participants } = messageInfo;
    const now = Date.now();

    try {
        const settingGroups = await findGroup(id);
        const validActions = ['promote', 'demote', 'add', 'remove'];

        if (validActions.includes(action)) {
            try {
                updateParticipant(sock, id, participants, action);
            }catch(e){
                console.log('Error updateParticipant:', e)
            }
        } else {
            return console.log('Action not valid / الإجراء غير صالح:', action)
        }

        if (settingGroups) {
            if (lastSent_participantUpdate[id]) {
                if (now - lastSent_participantUpdate[id] < config.rate_limit) {
                    return console.log(chalk.redBright(`Rate limit : ${id}`));
                }
            }
            lastSent_participantUpdate[id] = now;

            await handleActiveFeatures(sock, messageInfo, settingGroups.fitur);
        }

    }