const STATUS_SCHEDULED = false; // English: true or false | العربية: تفعيل أو تعطيل الجدولة (صحيح أو خطأ)

const moment    = require('moment-timezone');
const path      = require('path');
const schedule  = require('node-schedule');
const fs        = require('fs');
const mess      = require('@mess');
const config    = require('@config');
const { exec }  = require("child_process");
const { readGroup }       = require("@lib/group");
const { getJadwalSholat}  = require("@lib/features");
const { logWithTime, convertTime, getTimeRemaining, logTracking }     = require('@lib/utils');

let lastCallTime = 0;

async function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function getGroupMetadataSafe(sock, groupId) {
    const now = Date.now();
    const elapsed = now - lastCallTime;

    if (elapsed < 1000) {
        await delay(1000 - elapsed); 
        // English: Wait until 1 second has passed
        // العربية: الانتظار حتى تمر ثانية واحدة بين كل طلب بيانات مجموعة
    }

    lastCallTime = Date.now(); 

    try {
        logTracking(`scheduled.js - groupMetadata (${groupId})`)
        const metadata = await sock.groupMetadata(groupId);
        return metadata || null;
    } catch (err) {
        console.error('Failed to get group metadata:', groupId, '-', err.message || err);
        // English: Failed to fetch group info
        // العربية: فشل في جلب بيانات المجموعة
        return null;
    }
}

let currentSock = null; 
// English: Global variable to store the latest socket instance
// العربية: متغير عام لتخزين أحدث اتصال (sock)

async function updateSocket(newSock) {
    if(!STATUS_SCHEDULED) {
        return;
    }

    // English: Cancel all currently scheduled jobs
    // العربية: إلغاء جميع المهام المجدولة حاليًا
    Object.keys(schedule.scheduledJobs).forEach(jobName => {
        schedule.scheduledJobs[jobName].cancel();
    });
    
    currentSock = newSock;
    await rescheduleGroups(currentSock);
    await waktuSholat(currentSock);
    if(config.midnight_restart){
        await restaringServer(currentSock);
    }

}

async function rescheduleGroups(sock) {
    const jsonPath = path.resolve(process.cwd(), './database/additional/group participant.json');

    // English: Validate that the JSON file exists
    // العربية: التحقق من وجود ملف الإعدادات
    if (!fs.existsSync(jsonPath)) {
        console.error(`File not found: ${jsonPath}`);
        return;
    }

    const schedules = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));

    // English: Iterate over each group schedule entry
    // العربية: التكرار على كل إعدادات المجموعات
    for (const [groupId, groupData] of Object.entries(schedules)) {
  
        // English: Schedule the openTime
        // العربية: جدولة وقت فتح المجموعة
        if (groupData.openTime) {
        logWithTime('System', `Scheduling group ${groupId} open time at ${groupData.openTime}`);

        const [openHour, openMinute] = groupData.openTime.split(':').map(Number);

        if (!isNaN(openHour) && !isNaN(openMinute)) {
                const timeInWIB = moment.tz({ hour: openHour, minute: openMinute }, "Asia/Jakarta");

                if (timeInWIB.isValid()) {
                    const serverTime = convertTime(`${openHour}:${openMinute}`);
                    const [convertedHour, convertedMinute] = serverTime.split(':').map(Number);
                
                    const jobName = `openTime-${serverTime}-${groupId}`;
                    const schedulePattern = `${convertedMinute} ${convertedHour} * * *`;
                
                    // English: Schedule a daily task to open the group
                    // العربية: جدولة مهمة يومية لفتح المجموعة تلقائيًا
                    schedule.scheduleJob(jobName, schedulePattern, () => {
                        try {
                            openGroup(sock, groupId);
                        } catch (err) {
                            logWithTime('Error', `Error running openGroup for group ${groupId}: ${err.message}`);
                        }
                    });
                } else {
                    console.error(`Invalid open time for group ${groupId}: ${groupData.openTime}`);
                }
            } else {
                console.error(`Invalid open time format for group ${groupId}: ${groupData.openTime}`);
            }
        }

        // English: Schedule the closeTime
        // العربية: جدولة وقت إغلاق المجموعة
        if (groupData.closeTime) {
            logWithTime('System', `Scheduling closeTime for group ${groupId} at ${groupData.closeTime}`);
            
            const [closeHour, closeMinute] = groupData.closeTime.split(':').map(Number);

            const serverTime = convertTime(`${closeHour}:${closeMinute}`);

            const [convertedHour, convertedMinute] = serverTime.split(':').map(Number);
        
            if (!isNaN(closeHour) && !isNaN(closeMinute)) {
                const timeInWIB = moment.tz({ hour: closeHour, minute: closeMinute }, "Asia/Jakarta");
                
                if (timeInWIB.isValid()) {
                    const jobName = `closeTime-${timeInWIB}-${groupId}`;
                    const schedulePattern = `${convertedMinute} ${convertedHour} * * *`;

                    // English: Schedule daily job to close the group
                    // العربية: جدولة مهمة يومية لإغلاق المجموعة تلقائيًا
                    schedule.scheduleJob(jobName, schedulePattern, () => {
                        closeGroup(sock, groupId);
                    });
                } else {
                    console.error(`Invalid close time for group ${groupId}: ${groupData.closeTime}`);
                }
            } else {
                console.error(`Invalid close time format for group ${groupId}: ${groupData.closeTime}`);
            }
        }
    }
}

const queue = []; 
// English: Queue to control message sending
// العربية: قائمة انتظار لتنظيم إرسال الرسائل بالتتابع

async function sendNotifWithDelay(sock, groupId, waktu) {
    queue.push({ sock, groupId, waktu });

    if (queue.length === 1) {
        while (queue.length > 0) {
            const { sock, groupId, waktu } = queue[0];
            await sendNotif(sock, groupId, waktu);
            queue.shift(); 
            await new Promise(resolve => setTimeout(resolve, 2000)); 
            // English: Wait 2 seconds before sending to next group
            // العربية: الانتظار لمدة ثانيتين قبل إرسال الرسالة للمجموعة التالية
        }
    }
}

async function sendNotif(sock, groupId, waktu) {
    logWithTime('System', `sendNotif executed for ${waktu} - ${groupId}`);
    try {

        const metadata = await getGroupMetadataSafe(sock, groupId);
        if (!metadata) return;

        // English: If it's sahur time
        // العربية: إذا كان وقت السحور
        if (waktu == 'sahur') {
            const arr = [
                `🕰️ _It's time for sahur!_\n\n🍚 Let's eat sahur to stay energized all day. Don't forget to drink water! 💧`,
                `📢 _Sahur Reminder:_\n\n🌅 It's sahur time. Prepare a healthy meal and pray before eating. 🤲`,
                `✨ _Blessings of sahur have arrived!_\n\n🥣 Eating sahur is full of blessings. Don't miss it! Have a great fast today. 😊`,
                `🍽️ _Time for sahur!_\n\nThe Prophet encouraged sahur as a source of blessings. 🌟`
            ];
            const randomMessage = arr[Math.floor(Math.random() * arr.length)];
            const result = await sock.sendMessage(groupId, { text: randomMessage });

            const filePath = path.join(process.cwd(), "database", "audio", 'sahur.m4a');
            try {
                const audioBuffer = fs.readFileSync(filePath);
                await sock.sendMessage(groupId,
                    {
                        audio: audioBuffer,
                        mimetype: 'audio/mp4',
                    }, { quoted : result}
                );
            } catch (err) {
                console.error("Error reading sahur audio file:", err);
            }
            return;
        }

        const arr = [
            `🕌 _It's time for ${waktu} prayer in Jakarta and surrounding areas._\n\n💧 Let's perform wudu and pray sincerely. 🤲`,
            `🕋 _${waktu} prayer time has come in Jakarta._\n💧 Perform wudu and pray on time — it brings blessings! 😊`,
            `🌅 _It's time for ${waktu} prayer._\n\n💧 Take wudu and perform your prayer. May your day be blessed! 🤲`,
            `📢 _Prayer Reminder:_\n\n🕌 _It's time for ${waktu} prayer in Jakarta._\n💧 Let’s fulfill our duty!`,
            `✨ _Time to get closer to Allah._\n\n🕌 _${waktu} prayer has arrived._\n💧 Prepare for wudu and seek blessings.`
        ];

        const randomMessage = arr[Math.floor(Math.random() * arr.length)];
        const result = await sock.sendMessage(groupId, { text: randomMessage });
    
        const azanAudioUrl = waktu === 'subuh' 
            ? 'https://api.autoresbot.com/mp3/azan-subuh.m4a' 
            : 'https://api.autoresbot.com/mp3/azan-umum.m4a';

        await sock.sendMessage(groupId,
            {
                audio: { url: azanAudioUrl },
                mimetype: 'audio/mp4',
            }, { quoted : result}
        );
        
        logWithTime('System', `Successfully sent prayer time notification to group ${groupId}`);
    } catch (error) {
        logWithTime('System',`Failed to send prayer notification to group ${groupId}: ${error.message}`)
        console.error(`Failed to send prayer notification to group ${groupId}: ${error.message}`);
    }
}

async function waktuSholat(sock) {
    try {
        const dataSholat = await getJadwalSholat(); 
        const dataGroupSettings = await readGroup();
        if (!dataGroupSettings) return false;

        const groupIds = Object.keys(dataGroupSettings).filter(groupId => dataGroupSettings[groupId]?.fitur?.waktusholat);
        if (groupIds.length === 0) return false;

        for (const [waktu, jam] of Object.entries(dataSholat)) {
            const [hour, minute] = jam.split(':').map(Number);
            if (isNaN(hour) || isNaN(minute)) {
                console.error(`Invalid prayer time format for ${waktu}: ${jam}`);
                continue;
            }

            const delayBetweenNotif = 3000;

            for (const groupId of groupIds) {
                const jobName = `jadwalsholat-${waktu}-${groupId}`;
                const schedulePattern = `${minute} ${hour} * * *`;

                let delay = 0;

                schedule.scheduleJob(jobName, schedulePattern, async () => {
                    setTimeout(async () => {
                        await sendNotifWithDelay(sock, groupId, waktu);
                        console.log(`🔔 Notification for ${waktu} sent to ${groupId} at ${hour}:${minute} WIB`);
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


async function restaringServer(sock) {
    try {
        logWithTime('System', 'Scheduling automatic restart at midnight');

        const jobName = `restaring-server`;
        schedule.scheduleJob(jobName,'0 0 * * *', async () => {
            try {
                logWithTime('System', 'Restarting system automatically ...');
                await restaringAction();
            } catch (error) {
                logWithTime('System', `Error during restart: ${error.message}`);
                console.error('Error during restart:', error);
            }
        });

        logWithTime('System', 'Restart schedule set successfully');

    } catch (error) {
        logWithTime('System', `Error in restaring:: ${error.message}`);
        console.error('Error in restaring:', error.message);
    }
}

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

async function restaringAction() {
    try {
        exec(`node index`);
    } catch (error) {
        console.error("Error during restart:", error);
        logWithTime('System', 'Error during automatic restart');
    }
}

module.exports = { updateSocket, rescheduleGroups, waktuSholat };