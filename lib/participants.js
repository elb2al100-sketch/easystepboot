const fs                   = require('fs').promises; // File system with promises / مكتبة الملفات بشكل غير متزامن
const { updateSocket }     = require('@lib/scheduled'); // Update group schedule / تحديث جدول المجموعة
const pathjson_participant = './database/additional/group participant.json'; // JSON file path / مسار ملف JSON
const { logWithTime, cleanText }  = require('@lib/utils'); // Utility functions / وظائف مساعدة
const { getCache, setCache, deleteCache, entriesCache, sizeCache } = require('@lib/globalCache'); // Cache utilities / وظائف الكاش

// Check if a file exists / التحقق من وجود الملف
async function fileExists(filePath) {
    try {
        await fs.access(filePath);
        return true;
    } catch {
        return false;
    }
}

// Read JSON file / قراءة ملف JSON
async function readJsonFile() {
    try {
        let currentParticipant;
        const cachedData = getCache(`group-participant`); // Get cached data / الحصول على البيانات من الكاش
        if (cachedData) {
            currentParticipant = cachedData.data;
        } else {
            if (!await fileExists(pathjson_participant)) {
                // Create empty file if not exists / إنشاء ملف فارغ إذا لم يكن موجودًا
                await fs.writeFile(pathjson_participant, JSON.stringify({}, null, 2), 'utf8');
            }
            const data = await fs.readFile(pathjson_participant, 'utf8');
            currentParticipant = JSON.parse(data);
            setCache(`group-participant`, currentParticipant); // Set cache / تخزين البيانات في الكاش
        }
        return currentParticipant;
    } catch (err) {
        if (err.code === 'ENOENT') {
            await fs.writeFile(pathjson_participant, JSON.stringify({}));
            return {};
        } else {
            throw err;
        }
    }
}

let isWriting = false; // Flag to prevent concurrent writes / متغير لمنع الكتابة المتزامنة

// Write JSON file / كتابة بيانات JSON للملف
async function writeJsonFile(data) {
    while (isWriting) {
        await new Promise(resolve => setTimeout(resolve, 10)); // Wait if another process is writing / انتظر إذا كان هناك عملية كتابة أخرى
    }
    
    isWriting = true;
    try {
        await fs.writeFile(pathjson_participant, JSON.stringify(data, null, 2));
        deleteCache('group-participant'); // Clear cache / مسح الكاش
        logWithTime('DELETE CACHE FILE', `group participant.json`, 'merah');
    } catch (err) {
        console.error('Error writing to JSON file:', err);
        throw err;
    } finally {
        isWriting = false;
    }
}

// Set welcome message / تعيين رسالة الترحيب
async function setWelcome(remoteJid, text) {
    const data = await readJsonFile();
    if (!data[remoteJid]) data[remoteJid] = {};

    const cleanTxt = text ? cleanText(text) : 'Selamat datang di grup!'; // Default: Welcome to the group
    data[remoteJid].add = cleanTxt;
    await writeJsonFile(data);
}

// Set left/farewell message / تعيين رسالة الوداع
async function setLeft(remoteJid, text) {
    const data = await readJsonFile();
    if (!data[remoteJid]) data[remoteJid] = {};

    const cleanTxt = text ? cleanText(text) : 'Selamat jalan, semoga sukses!'; // Default farewell
    data[remoteJid].remove = cleanTxt;
    await writeJsonFile(data);
}

// Set promote message / تعيين رسالة الترقية
async function setPromote(remoteJid, text) {
    const data = await readJsonFile();
    if (!data[remoteJid]) data[remoteJid] = {};

    const cleanTxt = text ? cleanText(text) : 'Selamat! Anda telah dipromosikan menjadi admin.'; // Default promote
    data[remoteJid].promote = cleanTxt;
    await writeJsonFile(data);
}

// Set demote message / تعيين رسالة التنزيل
async function setDemote(remoteJid, text) {
    const data = await readJsonFile();
    if (!data[remoteJid]) data[remoteJid] = {};

    const cleanTxt = text ? cleanText(text) : 'Maaf, Anda telah diturunkan dari admin.'; // Default demote
    data[remoteJid].demote = cleanTxt;
    await writeJsonFile(data);
}

// Set template list / تعيين قائمة القوالب
async function setTemplateList(remoteJid, text) {
    const data = await readJsonFile();
    if (!data[remoteJid]) data[remoteJid] = {};

    data[remoteJid].templatelist = text || '1';
    await writeJsonFile(data);
}

// Set list text / تعيين نص القائمة
async function setList(remoteJid, text) {
    const data = await readJsonFile();
    if (!data[remoteJid]) data[remoteJid] = {};

    const cleanTxt = text ? cleanText(text) : 'Template list default dari set list';
    data[remoteJid].setlist = cleanTxt;
    await writeJsonFile(data);
}

// Set done template / تعيين قالب Done
async function setDone(remoteJid, text) {
    const data = await readJsonFile();
    if (!data[remoteJid]) data[remoteJid] = {};

    const cleanTxt = text ? cleanText(text) : 'Template Done default';
    data[remoteJid].setdone = cleanTxt;
    await writeJsonFile(data);
}

// Set process template / تعيين قالب Proses
async function setProses(remoteJid, text) {
    const data = await readJsonFile();
    if (!data[remoteJid]) data[remoteJid] = {};

    const cleanTxt = text ? cleanText(text) : 'Template Done default';
    data[remoteJid].setproses = cleanTxt;
    await writeJsonFile(data);
}

// Set template welcome / تعيين قالب الترحيب
async function setTemplateWelcome(remoteJid, text) {
    const data = await readJsonFile();
    if (!data[remoteJid]) data[remoteJid] = {};

    data[remoteJid].templatewelcome = text || '1';
    await writeJsonFile(data);
}

// Generic function to set group schedule / دالة عامة لتعيين جدول المجموعة
async function setGroupSchedule(sock, remoteJid, text, property) {
    const data = await readJsonFile();
    if (!data[remoteJid]) data[remoteJid] = {};

    if (text.toLowerCase() === "off") {
        if (data[remoteJid][property]) {
            delete data[remoteJid][property]; // Delete property / حذف الخاصية
        } else {
            console.log(`${property} not found for group ${remoteJid}.`);
        }
    } else {
        data[remoteJid][property] = text; // Save schedule in UTC / حفظ الوقت
    }

    await writeJsonFile(data);
    updateSocket(sock); // Update scheduled tasks / تحديث المهام المجدولة
}

// Check if message exists / التحقق من وجود الرسالة
async function checkMessage(remoteJid, type) {
    const data = await readJsonFile();
    if (!data || typeof data !== 'object') throw new Error('Invalid data or failed to read file.');

    if (!data[