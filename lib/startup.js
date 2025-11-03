/*
⚠️ WARNING / تحذير:
This script **MUST NOT BE SOLD** in any form! / هذا السكربت **لا يجوز بيعه** بأي شكل!

╔══════════════════════════════════════════════╗
║                🛠️ SCRIPT INFO / معلومات السكربت          ║
╠══════════════════════════════════════════════╣
║ 📦 Version   : 4.1.5
║ 👨‍💻 Developer  : eslam samo
║ 🌐 Website    : https://easystep.life
║ 📲 Number  : +201065537938
╚══════════════════════════════════════════════╝

📌 Starting Nov 1, 2025, the easystep script is 
🔗 https://easystep.life
*/

const os        = require('os'); // Operating system module / مكتبة نظام التشغيل
const chalk     = require('chalk'); // Terminal colors / ألوان التيرمينال
const figlet    = require('figlet'); // ASCII text / نصوص ASCII
const axios     = require('axios'); // HTTP requests / طلبات HTTP
const config    = require("@config"); // Project config / إعدادات المشروع
const { success, danger }   = require('@lib/utils'); // Utility functions / دوال مساعدة
const { connectToWhatsApp }   = require('@lib/connection'); // WhatsApp connection / اتصال واتساب

const TERMINAL_WIDTH = process.stdout.columns || 45; // Default to 45 if not available / العرض الافتراضي للتيرمينال
const ALIGNMENT_PADDING = 5; // Padding for alignment / المسافة للتنسيق

// Create horizontal line / إنشاء خط أفقي
const horizontalLine = (length = TERMINAL_WIDTH, char = '=') => char.repeat(length);

let cachedIP = null; // Cache for public IP / تخزين مؤقت للـIP العام

// **Get public IP from multiple services / الحصول على IP عام من عدة خدمات**
const getPublicIP = async () => {
    if (cachedIP) return cachedIP;

    const ipServices = [
        'https://api.ipify.org?format=json',
        'https://ipv4.icanhazip.com',
        'https://ifconfig.me/ip'
    ];

    for (const url of ipServices) {
        try {
            const response = await axios.get(url);

            let ip;
            if (response.data && typeof response.data === 'object' && response.data.ip) {
                ip = response.data.ip;
            } else if (typeof response.data === 'string') {
                ip = response.data.trim();
            }

            if (ip) {
                cachedIP = ip;
                return cachedIP;
            }
        } catch (error) {
            // Continue to next URL if failed / تابع إلى الخدمة التالية إذا فشل
            continue;
        }
    }

    throw new Error('Cannot fetch public IP from all services / لا يمكن الحصول على IP عام من جميع الخدمات');
};

// **Get server specifications / الحصول على معلومات الخادم**
const getServerSpecs = async () => ({
    hostname: os.hostname(),
    platform: os.platform(),
    arch: os.arch(),
    totalMemory: `${(os.totalmem() / (1024 ** 3)).toFixed(2)} GB`,
    freeMemory: `${(os.freemem() / (1024 ** 3)).toFixed(2)} GB`,
    uptime: `${(os.uptime() / 3600).toFixed(2)} hours`,
    publicIp :  await getPublicIP(),
    mode : config.mode
});

// **Check API key status / التحقق من حالة مفتاح API**
const getStatusApikey = async () => {
    try {
        const response = await axios.get(`https://api.autoresbot.com/check_apikey?apikey=${config.APIKEY}`);
        const { limit_apikey } = response.data || {};
        if(limit_apikey <= 0) return chalk.redBright('Limit Reached / الحد تم الوصول له');
        return chalk.green(limit_apikey);
    
    } catch (error) {
        if (error.response) {
            const { status, data } = error.response;
            const errorCode = data?.error_code;
            const errorMessage = data?.message;

            if (status === 403) return status;
            if (status === 404) return chalk.redBright('Not Found: Invalid endpoint or resource / غير موجود');
            if (status === 401) return chalk.redBright('Unauthorized: API key missing or invalid / مفتاح API غير صالح');

            if (errorCode === 'LIMIT_REACHED') return chalk.redBright(`LIMIT_REACHED (${errorMessage || 'No message'})`);
            if (errorCode === 'INVALID_API_KEY') return chalk.redBright('INVALID_API_KEY');
        }
        return chalk.red('Error fetching API status / خطأ في جلب حالة API');
    }
};

// **Show server info in terminal / عرض معلومات الخادم في التيرمينال**
async function showServerInfo(e = {}) {
    const { title: t = "RESBOT", borderChar: o = "=", color: i = "cyan" } = e;
    const n = { horizontalLayout: TERMINAL_WIDTH > 40 ? "default" : "fitted", width: Math.min(TERMINAL_WIDTH - 4, 40) };
    const a = await getServerSpecs();
    const s = await getStatusApikey();

    if (s === 403) {
        console.log("--------------------");
        danger("Error ⚠️", "Forbidden: API key is not authorized / مفتاح API غير مصرح");
        danger("Error ⚠️", `Solution / الحل: Add your IP ${await getPublicIP()} to whitelist`);
        success("IP", await getPublicIP());
        success("Info", "Visit the link and add your IP / قم بزيارة الرابط وأضف IP الخاص بك");
        console.log("https://autoresbot.com/services/rest-api");
        console.log("--------------------");
        const wait = e => new Promise(t => setTimeout(t, e));
        await wait(30000);
        return process.exit();
    }

    const labels = ["◧ Hostname", "◧ Platform", "◧ Architecture", "◧ Total Memory", "◧ Free Memory", "◧ Uptime", "◧ Public IP", "◧ Mode"];
    const values = Object.values(a);
    const maxLabelLength = Math.max(...labels.map(e => e.length));
    const formatted = labels.map((e, idx) => `${chalk.green(e.padEnd(maxLabelLength + ALIGNMENT_PADDING))}: ${values[idx]}`).join("\n");

    console.log(`\n${chalk[i](horizontalLine(TERMINAL_WIDTH, o))}`);
    console.log(`${chalk[i](figlet.textSync(t, n))}`);
    console.log(`${chalk[i](horizontalLine(TERMINAL_WIDTH, o))}\n`);
    console.log(`${chalk.yellow.bold("◧ Script Info / معلومات السكربت :")}`);
    console.log(`${chalk.green("Version :")} Resbot ${global.version}`);
    console.log(`${chalk.green("API Key :")} ${s}`);
    console.log(`${chalk.yellow.bold("------------------")}`);
    console.log(`${chalk.yellow.bold("◧ Server Specifications / مواصفات الخادم :")}`);
    console.log(formatted);
    console.log(`\n${chalk[i](horizontalLine(TERMINAL_WIDTH, o))}`);
    console.log(`${chalk[i].bold(" ◧ Thank you for using this script! / شكراً لاستخدامك السكربت ◧ ")}`);
    console.log(`${chalk[i](horizontalLine(TERMINAL_WIDTH, o))}\n`);
}

// **Start the application / تشغيل التطبيق**
async function start_app() {
    await showServerInfo();
    connectToWhatsApp(); // Connect to WhatsApp / الاتصال بالواتساب
}

module.exports = { showServerInfo, start_app, getServerSpecs };