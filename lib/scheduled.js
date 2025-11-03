// STATUS_SCHEDULED controls whether the scheduling system is active
// يتحكم STATUS_SCHEDULED فيما إذا كان نظام الجدولة نشطًا أم لا
const STATUS_SCHEDULED = false; // true or false

const moment    = require('moment-timezone'); // Library for timezone handling / مكتبة لدعم المناطق الزمنية
const path      = require('path');            // Path utilities / أدوات التعامل مع المسارات
const schedule  = require('node-schedule');  // Cron job scheduler / مكتبة جدولة المهام
const fs        = require('fs');              // File system / التعامل مع الملفات
const mess      = require('@mess');           // Predefined messages / رسائل محددة مسبقًا
const config    = require('@config');         // Config file / ملف الإعدادات
const { exec }  = require("child_process");   // Execute shell commands / تنفيذ أوامر النظام
const { readGroup }       = require("@lib/group");    // Group data handler / معالجة بيانات المجموعات
const { getJadwalSholat}  = require("@lib/features"); // Prayer schedule / جدول الصلاة
const { logWithTime, convertTime, getTimeRemaining, logTracking } = require('@lib/utils'); 
// Utility functions / وظائف مساعدة

let lastCallTime = 0; // Last API call time to avoid rate limit / وقت آخر استدعاء لتجنب تجاوز الحد المسموح

// Simple delay function / دالة تأخير بسيطة
async function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Safely get group metadata with delay to avoid hitting rate limits
// الحصول على بيانات المجموعة بأمان مع تأخير لتجنب تجاوز الحد المسموح
async function getGroupMetadataSafe(sock, groupId) {
    const now = Date.now();
    const elapsed = now - lastCallTime;

    if (elapsed < 1000) {
        await delay(1000 - elapsed); // Wait until 1 second passes / انتظر حتى يمر ثانية واحدة
    }

    lastCallTime = Date.now(); // Update last call time / تحديث وقت الاستدعاء الأخير

    try {
        logTracking(`scheduled.js - groupMetadata (${groupId})`)
        const metadata = await sock.groupMetadata(groupId);
        return metadata || null;
    } catch (err) {
        console.error('Failed to fetch group metadata:', groupId, '-', err.message || err);
        return null;
    }
}

let currentSock = null; // Global variable to store the latest socket connection / متغير عالمي لتخزين الاتصال الأخير

// Update socket and reschedule tasks / تحديث الاتصال وإعادة جدولة المهام
async function updateSocket(newSock) {
    if(!STATUS_SCHEDULED) {
        return;
    }

    // Cancel all existing jobs / إلغاء جميع المهام المجدولة
    Object.keys(schedule.scheduledJobs).forEach(jobName => {
        schedule.scheduledJobs[jobName].cancel();
    });
    
    currentSock = newSock;
    await rescheduleGroups(currentSock); // Schedule group open/close / جدولة فتح/إغلاق المجموعات
    await waktuSholat(currentSock);      // Schedule prayer notifications / جدولة إشعارات الصلاة
    if(config.midnight_restart){
        await restaringServer(currentSock); // Schedule server restart at midnight / جدولة إعادة تشغيل السيرفر منتصف الليل
    }
}

// Reschedule groups open/close based on JSON data / إعادة جدولة فتح/إغلاق المجموعات حسب JSON
async function rescheduleGroups(sock) {
    const jsonPath = path.resolve(process.cwd(), './database/additional/group participant.json');

    if (!fs.existsSync(jsonPath)) {
        console.error(`File not found: ${jsonPath}`);
        return;
    }

    const schedules = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));

    for (const [groupId, groupData] of Object.entries(schedules)) {

        // Schedule openTime / جدولة وقت فتح المجموعة
        if (groupData.openTime) {
            logWithTime('System', `Scheduling group ${groupId} open at ${groupData.openTime}`);
            const [openHour, openMinute] = groupData.openTime.split(':').map(Number);

            if (!isNaN(openHour) && !isNaN(openMinute)) {
                const timeInWIB = moment.tz({ hour: openHour, minute: openMinute }, "Asia/Jakarta");

                if (timeInWIB.isValid()) {
                    const serverTime = convertTime(`${openHour}:${openMinute}`);
                    const [convertedHour, convertedMinute] = serverTime.split(':').map(Number);

                    const jobName = `openTime-${serverTime}-${groupId}`;
                    const schedulePattern = `${convertedMinute} ${convertedHour} * * *`;

                    schedule.scheduleJob(jobName, schedulePattern, () => {
                        try {
                            openGroup(sock, groupId);
                        } catch (err) {
                            logWithTime('Error', `Error opening group ${groupId}: ${err.message}`);
                        }
                    });
                } else {
                    console.error(`Invalid openTime for group ${groupId}: ${groupData.openTime}`);
                }
            } else {
                console.error(`Invalid openTime format for group ${groupId}: ${groupData.openTime}`);
            }
        }

        // Schedule closeTime / جدولة وقت إغلاق المجموعة
        if (groupData.closeTime) {
            logWithTime('System', `Scheduling group ${groupId} close at ${groupData.closeTime}`);
            const [closeHour, closeMinute] = groupData.closeTime.split(':').map(Number);
            const serverTime = convertTime(`${closeHour}:${closeMinute}`);
            const [convertedHour, convertedMinute] = serverTime.split(':').map(Number);

            if (!isNaN(closeHour) && !isNaN(closeMinute)) {
                const timeInWIB = moment.tz({ hour: closeHour, minute: closeMinute }, "Asia/Jakarta");

                if (timeInWIB.isValid()) {
                    const jobName = `closeTime-${timeInWIB}-${groupId}`;
                    const schedulePattern = `${convertedMinute} ${convertedHour} * * *`;
                    schedule.scheduleJob(jobName, schedulePattern, () => {
                        closeGroup(sock, groupId);
                    });
                } else {
                    console.error(`Invalid closeTime for group ${groupId}: ${groupData.closeTime}`);
                }
            } else {
                console.error(`Invalid closeTime format for group ${groupId}: ${groupData.closeTime}`);
            }
        }
    }
}

// Queue system to handle sending notifications with delay / نظام قائمة انتظار لإرسال الإشعارات مع تأخير
const queue = [];

async function sendNotifWithDelay(sock, groupId, waktu) {
    queue.push({ sock, groupId, waktu });

    if (queue.length === 1) {
        while (queue.length > 0) {
            const { sock, groupId, waktu } = queue[0];
            await sendNotif(sock, groupId, waktu);
            queue.shift(); 
            await new Promise(resolve => setTimeout(resolve, 2000)); // 2-second delay between groups / تأخير ثانيتين بين كل مجموعة
        }
    }
}

// Send prayer or sahur notification / إرسال إشعار الصلاة أو السحور
async function sendNotif(sock, groupId, waktu) {
    logWithTime('System', `sendNotif running ${waktu} - ${groupId}`);
    try {
        const metadata = await getGroupMetadataSafe(sock, groupId);
        if (!metadata) return;

        if (waktu == 'sahur') {
            const arr = [
                `🕰️ _It's sahur time!_\n\n🍚 Eat sahur to keep energy throughout the day. Don't forget to drink enough water! 💧`,
                `📢 _Sahur reminder:_\n\n🌅 Sahur time has arrived. Prepare healthy food and pray before eating. 🤲`,
                `✨ _Blessings of sahur have come!_\n\n🥣 Sahur is sunnah and full of blessings. Don't miss it! Have a smooth fast. 😊`,
                `🍽️ _Time for sahur!_\n\nWake up and eat sahur, as the Prophet recommended for blessings. 🌟`
            ];
            const randomMessage = arr[Math.floor(Math.random() * arr.length)];
            const result = await sock.sendMessage(groupId, { text: randomMessage });

            const filePath = path.join(process.cwd(), "database", "audio", 'sahur.m4a');
            try {
                const audioBuffer = fs.readFileSync(filePath);
                await sock.sendMessage(groupId,
                    { audio: audioBuffer, mimetype: 'audio/mp4' }, 
                    { quoted : result }
                );
            } catch (err) {
                console.error("Error reading file:", err);
            }
            return;
        }

        const arr = [
            `🕌 _Time for ${waktu} has arrived in Jakarta._\n💧 Prepare for wudu and prayer. 🤲`,
            `🕋 ${waktu} time has started in Jakarta.\n💧 Take wudu and perform prayer.\n✨ Timely prayer brings blessings! 😊`,
            `🌅 _Time to perform ${waktu} prayer in Jakarta._\n💧 Take wudu and pray sincerely. May Allah bless our day!`,
            `📢 _Prayer reminder:_\n🕌 ${waktu} time has arrived in Jakarta.\n💧 Prepare and perform your duty!`,
            `✨ _Time to get closer to Allah._\n🕌 ${waktu} prayer has arrived in Jakarta.\n💧 Take wudu. May blessings be with everyone.`
        ];

        const randomMessage = arr[Math.floor(Math.random() * arr.length)];
        const result = await sock.sendMessage(groupId, { text: randomMessage });

        const azanAudioUrl = waktu === 'subuh' 
            ? 'https://api.autoresbot.com/mp3/azan-subuh.m4a' 
            : 'https://api.autoresbot.com/mp3/azan-umum.m4a';

        await sock.sendMessage(groupId,
            { audio: { url: azanAudioUrl }, mimetype: 'audio/mp4' }, 
            { quoted : result }
        );
        
        logWithTime('System', `Successfully sent prayer time to group ${groupId}`);
    } catch (error) {
        logWithTime('System',`Failed to send prayer notification to group ${groupId}: ${error.message}`)
        console.error(`Failed to send prayer notification to group ${groupId}: ${error.message}`);
    }
}

// Schedule prayer notifications for all groups / جدولة إشعارات الصلاة لجميع المجموعات
async function waktuSholat(sock) {
    try {
        const dataSholat = await getJadwalSholat(); // { subuh, dzuhur, ashar, maghrib, isya }
        const dataGroupSettings = await readGroup();
        if (!dataGroupSettings) return false;

        const groupIds = Object.keys(dataGroupSettings).filter(groupId => dataGroupSettings[groupId]?.fitur?.waktusholat);
        if (groupIds.length === 0) return false;

        for (const [waktu, jam] of Object.entries(dataSholat)) {
            const [hour, minute] = jam.split(':').map(Number);
            if (isNaN(hour) || isNaN(minute)) continue;

            const delayBetweenNotif = 3000;

            for (const groupId of groupIds) {
                const jobName = `jadwalsholat-${waktu}-${groupId}`;
                const schedulePattern = `${minute} ${hour} * * *`;

                let delay = 0;

                schedule.scheduleJob(jobName, schedulePattern, async () => {
                    setTimeout(async () => {
                        await sendNotifWithDelay(sock, groupId, waktu);
                        console.log(`🔔 ${waktu} notification sent to ${groupId} at ${hour}:${minute} WIB`);
                    }, delay);
                    delay += delayBetweenNotif;
                });
            }
        }
    } catch (error) {
        logWithTime('System', `Error in waktuSholat: ${error.message}`);
        console.error('Error in waktuSholat:', error.message);
    }
}

// Schedule server restart at midnight / جدولة إعادة تشغيل السيرفر منتصف الليل
async function restaringServer(sock) {
    try {
        logWithTime('System', 'Preparing restart schedule at 12 AM');
        const jobName = `restaring-server`;
        schedule.scheduleJob(jobName,'0 0 * * *', async () => {
            try {
                logWithTime('System', 'Automatic system restarting...');
                await restaringAction();
            } catch (error) {
                logWithTime('System', `Error during restart: ${error.message}`);
                console.error('Error during restart:', error);
            }
        });
        logWithTime('System', 'Restart schedule successfully set');
    } catch (error) {
        logWithTime('System', `Error in restaring:: ${error.message}`);
        console.error('Error in restaring:', error.message);
    }
}

// Close group / إغلاق المجموعة
async function closeGroup(sock, groupId) {
    try {
        const metadata = await getGroupMetadataSafe(sock, groupId);
        if (!metadata) return;

        await sock.groupSettingUpdate(groupId, 'announcement');
        await sock.sendMessage(groupId, { text: mess.action.grub_close });
    } catch (error) {
        await sock.sendMessage(groupId, { text: `⚠️ _Failed to close group:_ ${error.message}` });
        console.error(`Failed to close group ${groupId}: ${error.message}`);
    }
}

// Open group / فتح المجموعة
async function openGroup(sock, groupId) {
    try {
        const metadata = await getGroupMetadataSafe(sock, groupId);
        if (!metadata) return;

        await sock.groupSettingUpdate(groupId, 'not_announcement');
        await sock.sendMessage(groupId, { text: mess.action.grub_open });
    } catch (error) {
        console.error(`Failed to open group ${groupId}: ${error.message}`);
        await sock.sendMessage(groupId, { text: `⚠️ _Failed to open group:_ ${error.message}` });
    }
}

// Restart action / إجراء إعادة التشغيل
async function restaringAction() {
    try {
        exec(`node index`);
    } catch (error) {
        console.error("Error occurred:", error);
        logWithTime('System', 'Error during automatic restart');
    }
}

module.exports = { updateSocket, rescheduleGroups, waktuSholat };