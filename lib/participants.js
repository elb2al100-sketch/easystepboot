// Importing required modules | استيراد المكتبات المطلوبة
const fs = require('fs').promises;
const { updateSocket } = require('@lib/scheduled');
const pathjson_participant = './database/additional/group participant.json';
const { logWithTime, cleanText } = require('@lib/utils');
const { getCache, setCache, deleteCache, entriesCache, sizeCache } = require('@lib/globalCache');

/**
 * ✅ Check if a file exists
 * التحقق مما إذا كان الملف موجودًا
 */
async function fileExists(filePath) {
    try {
        await fs.access(filePath);
        return true;
    } catch {
        return false;
    }
}

/**
 * ✅ Read JSON file with caching system
 * قراءة ملف JSON مع استخدام الكاش لتسريع الأداء
 */
async function readJsonFile() {
    try {
        let currentParticipant;
        const cachedData = getCache(`group-participant`);
        if (cachedData) {
            // Use cached data if available | استخدام البيانات من الكاش إذا كانت متوفرة
            currentParticipant = cachedData.data;
        } else {
            if (!await fileExists(pathjson_participant)) {
                // Create new file if not exists | إنشاء ملف جديد إذا لم يكن موجودًا
                await fs.writeFile(pathjson_participant, JSON.stringify({}, null, 2), 'utf8');
            }
            const data = await fs.readFile(pathjson_participant, 'utf8');
            currentParticipant = JSON.parse(data);
            setCache(`group-participant`, currentParticipant); // Save to cache | حفظ في الكاش
        }
        return currentParticipant;
    } catch (err) {
        if (err.code === 'ENOENT') {
            // If file not found, create new one | إذا لم يوجد الملف، يتم إنشاؤه
            await fs.writeFile(pathjson_participant, JSON.stringify({}));
            return {};
        } else {
            throw err;
        }
    }
}

let isWriting = false; // To prevent concurrent writes | لتجنب الكتابة المتزامنة

/**
 * ✅ Write JSON data to file
 * كتابة البيانات في ملف JSON
 */
async function writeJsonFile(data) {
    while (isWriting) {
        // Wait if another write is in progress | الانتظار إذا كانت هناك عملية كتابة أخرى جارية
        await new Promise(resolve => setTimeout(resolve, 10));
    }

    isWriting = true;
    try {
        await fs.writeFile(pathjson_participant, JSON.stringify(data, null, 2));
        deleteCache('group-participant'); // Delete cache after writing | حذف الكاش بعد الكتابة
        logWithTime('DELETE CACHE FILE', `group participant.json`, 'merah');
    } catch (err) {
        console.error('Error writing to JSON file:', err);
        throw err;
    } finally {
        isWriting = false;
    }
}

/**
 * ✅ Set custom welcome message
 * تعيين رسالة الترحيب المخصصة للمجموعة
 */
async function setWelcome(remoteJid, text) {
    const data = await readJsonFile();
    if (!data[remoteJid]) data[remoteJid] = {};
    const cleanTxt = text ? cleanText(text) : 'Selamat datang di grup!'; // Default: Welcome message
    data[remoteJid].add = cleanTxt;
    await writeJsonFile(data);
}

/**
 * ✅ Set custom farewell message
 * تعيين رسالة الوداع المخصصة
 */
async function setLeft(remoteJid, text) {
    const data = await readJsonFile();
    if (!data[remoteJid]) data[remoteJid] = {};
    const cleanTxt = text ? cleanText(text) : 'Selamat jalan, semoga sukses!'; // Default goodbye
    data[remoteJid].remove = cleanTxt;
    await writeJsonFile(data);
}

/**
 * ✅ Set promote message
 * تعيين رسالة الترقية إلى مشرف
 */
async function setPromote(remoteJid, text) {
    const data = await readJsonFile();
    if (!data[remoteJid]) data[remoteJid] = {};
    const cleanTxt = text ? cleanText(text) : 'Selamat! Anda telah dipromosikan menjadi admin.';
    data[remoteJid].promote = cleanTxt;
    await writeJsonFile(data);
}

/**
 * ✅ Set demote message
 * تعيين رسالة خفض المستخدم من المشرفين
 */
async function setDemote(remoteJid, text) {
    const data = await readJsonFile();
    if (!data[remoteJid]) data[remoteJid] = {};
    const cleanTxt = text ? cleanText(text) : 'Maaf, Anda telah diturunkan dari admin.';
    data[remoteJid].demote = cleanTxt;
    await writeJsonFile(data);
}

/**
 * ✅ Set template list (style for list messages)
 * تعيين قالب قائمة مخصص للرسائل
 */
async function setTemplateList(remoteJid, text) {
    const data = await readJsonFile();
    if (!data[remoteJid]) data[remoteJid] = {};
    data[remoteJid].templatelist = text || '1';
    await writeJsonFile(data);
}

/**
 * ✅ Set custom list message
 * تعيين رسالة قائمة مخصصة
 */
async function setList(remoteJid, text) {
    const data = await readJsonFile();
    if (!data[remoteJid]) data[remoteJid] = {};
    const cleanTxt = text ? cleanText(text) : 'Template list default dari set list';
    data[remoteJid].setlist = cleanTxt;
    await writeJsonFile(data);
}

/**
 * ✅ Set "Done" message
 * تعيين رسالة إتمام المهمة
 */
async function setDone(remoteJid, text) {
    const data = await readJsonFile();
    if (!data[remoteJid]) data[remoteJid] = {};
    const cleanTxt = text ? cleanText(text) : 'Template Done default';
    data[remoteJid].setdone = cleanTxt;
    await writeJsonFile(data);
}

/**
 * ✅ Set "In Process" message
 * تعيين رسالة أثناء المعالجة
 */
async function setProses(remoteJid, text) {
    const data = await readJsonFile();
    if (!data[remoteJid]) data[remoteJid] = {};
    const cleanTxt = text ? cleanText(text) : 'Template Done default';
    data[remoteJid].setproses = cleanTxt;
    await writeJsonFile(data);
}

/**
 * ✅ Set welcome image template
 * تعيين قالب صورة الترحيب
 */
async function setTemplateWelcome(remoteJid, text) {
    const data = await readJsonFile();
    if (!data[remoteJid]) data[remoteJid] = {};
    data[remoteJid].templatewelcome = text || '1';
    await writeJsonFile(data);
}

/**
 * ✅ Generic group schedule configuration
 * تعيين جدول زمني عام للمجموعة (مثل فتح/إغلاق تلقائي)
 */
async function setGroupSchedule(sock, remoteJid, text, property) {
    const data = await readJsonFile();
    if (!data[remoteJid]) data[remoteJid] = {};

    if (text.toLowerCase() === "off") {
        if (data[remoteJid][property]) {
            delete data[remoteJid][property]; // Delete property | حذف الخاصية
        } else {
            console.log(`${property} not found for group ${remoteJid}.`);
        }
    } else {
        data[remoteJid][property] = text; // Save time or schedule | حفظ الوقت أو الجدول
    }

    await writeJsonFile(data);
    updateSocket(sock); // Update running schedule | تحديث الجدولة النشطة
}

/**
 * ✅ Check if a group message template exists
 * التحقق مما إذا كانت رسالة معينة مخصصة للمجموعة
 */
async function checkMessage(remoteJid, type) {
    const data = await readJsonFile();
    if (!data || typeof data !== 'object') {
        throw new Error('Invalid data or failed to read file | البيانات غير صالحة أو فشل في قراءة الملف');
    }

    if (!data[remoteJid]) {
        return false;
    }

    const messageTypes = {
        add: 'add',
        remove: 'remove',
        promote: 'promote',
        demote: 'demote',
        templatelist: 'templatelist',
        templatewelcome: 'templatewelcome',
        jadwalsholat: 'jadwalsholat',
        setlist: 'setlist',
        setdone: 'setdone',
        setproses: 'setproses',
    };

    const messageKey = messageTypes[type];
    if (!messageKey) {
        throw new Error(`Invalid message type. Supported: ${Object.keys(messageTypes).join(', ')}`);
    }
    const messageData = data[remoteJid][messageKey];

    return messageData || false;
}

/**
 * ✅ Delete specific message template
 * حذف رسالة مخصصة معينة للمجموعة
 */
async function deleteMessage(remoteJid, type) {
    const data = await readJsonFile();
    if (!data || typeof data !== 'object' || !data[remoteJid]) {
        return false;
    }

    const messageTypes = {
        add: 'add',
        remove: 'remove',
        promote: 'promote',
        demote: 'demote',
        templatelist: 'templatelist',
        templatewelcome: 'templatewelcome',
        jadwalsholat: 'jadwalsholat',
        setlist: 'setlist',
        setdone: 'setdone',
        setproses: 'setproses'
    };

    const messageKey = messageTypes[type];
    if (!messageKey || !data[remoteJid][messageKey]) {
        return false;
    }

    delete data[remoteJid][messageKey];
    
    // If group has no more keys, remove it | حذف المجموعة إذا لم يبق فيها خصائص
    if (Object.keys(data[remoteJid]).length === 0) {
        delete data[remoteJid];
    }

    await writeJsonFile(data);
    return true;
}

// ✅ Export all functions | تصدير جميع الدوال
module.exports = { 
    setTemplateList, setList, setDone, setProses, deleteMessage, 
    setTemplateWelcome, setWelcome, setLeft, setPromote, 
    setDemote, setGroupSchedule, checkMessage 
};