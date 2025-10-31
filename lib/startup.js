/*
⚠️ WARNING:
This script **MUST NOT BE SOLD** in any form!
هذا السكربت **لا يجوز بيعه** بأي شكل من الأشكال!

╔══════════════════════════════════════════════╗
║                🛠️ SCRIPT INFORMATION        ║
╠══════════════════════════════════════════════╣
║ 📦 Version   : 4.1.5
║ 👨‍💻 Developer  : 𝑬𝒔𝒍𝒂𝒎
║ 🌐 Website    : https://easystep.life
║ 📲 Number  : +201065537938
╚══════════════════════════════════════════════╝

📌 Starting April 1, 2025,
The **Autoresbot** script is officially **Open Source** and can be used for free:
🔗 https://autoresbot.com
*/

/* Import libraries */
// استيراد المكتبات
const os        = require('os');
const chalk     = require('chalk');
const figlet    = require('figlet');
const axios     = require('axios');
const config    = require("@config");
const { success, danger }   = require('@lib/utils');
const { connectToWhatsApp }   = require('@lib/connection');

// Terminal settings
// إعدادات الطرفية
const TERMINAL_WIDTH = process.stdout.columns || 45; // Default to 45 if unavailable
// العرض الافتراضي للطرفية
const ALIGNMENT_PADDING = 5;

const horizontalLine = (length = TERMINAL_WIDTH, char = '=') => char.repeat(length);
// رسم خط أفقي للطرفية

let cachedIP = null; // Cache public IP
// تخزين IP العام مؤقتًا

/* Get Public IP */
// الحصول على IP العام
const getPublicIP = async () => {
    if (cachedIP) {
        return cachedIP;
    }

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
            // Continue to next URL if failed
            // الانتقال إلى الخدمة التالية إذا فشل
            continue;
        }
    }

    throw new Error('Unable to fetch public IP from all services');
    // لا يمكن الحصول على IP العام من جميع الخدمات
};

/* Get server specifications */
// الحصول على مواصفات السيرفر
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

/* Get API key status */
// الحصول على حالة API Key
const getStatusApikey = async () => {
    try {
        const response = await axios.get(`https://api.autoresbot.com/check_apikey?apikey=${config.APIKEY}`);
        const { limit_apikey } = response.data || {};
        if(limit_apikey <= 0) return chalk.redBright('Limit Reached');
        return chalk.green(limit_apikey);
    
    } catch (error) {
        if (error.response) {
            const { status, data } = error.response;
            const errorCode = data?.error_code;
            const errorMessage = data?.message;

            // Handle specific HTTP status codes
            // التعامل مع رموز حالة HTTP محددة
            if (status === 403) return status;
            if (status === 404) return chalk.redBright('Not Found: Invalid endpoint or resource');
            if (status === 401) return chalk.redBright('Unauthorized: API key is missing or invalid');

            // Handle specific error codes in response
            // التعامل مع رموز الأخطاء المحددة في الرد
            if (errorCode === 'LIMIT_REACHED') return chalk.redBright(`LIMIT_REACHED (${errorMessage || 'No message'})`);
            if (errorCode === 'INVALID_API_KEY') return chalk.redBright('INVALID_API_KEY');
        }
        return chalk.red('Error fetching API status');
        // خطأ عند جلب حالة API
    }
};

/* Show server information in terminal */
// عرض معلومات السيرفر في الطرفية
async function showServerInfo(e = {}) {
    const {
        title: t = "RESBOT",
        borderChar: o = "=",
        color: i = "cyan"
    } = e, n = {
        horizontalLayout: TERMINAL_WIDTH > 40 ? "default" : "fitted",
        width: Math.min(TERMINAL_WIDTH - 4, 40)
    }, a = await getServerSpecs(), s = await getStatusApikey();

    if (403 == s) {
        console.log("--------------------");
        danger("Error ⚠️", "Forbidden: API key is not authorized");
        danger("Error ⚠️", `Solution: Add your IP ${await getPublicIP()} to the whitelist`);
        success("IP", await getPublicIP());
        success("Info", "Visit the link and add your IP");
        console.log("https://autoresbot.com/services/rest-api");
        console.log("--------------------");
        const e = e => new Promise((t => setTimeout(t, e)));
        return await e(30000), void process.exit()
    }

    const r = ["◧ Hostname", "◧ Platform", "◧ Architecture", "◧ Total Memory", "◧ Free Memory", "◧ Uptime", "◧ Public IP", "◧ Mode"],
        l = Object.values(a),
        c = Math.max(...r.map((e => e.length))),
        u = r.map(((e, t) => `${chalk.green(e.padEnd(c+ALIGNMENT_PADDING))}: ${l[t]}`)).join("\n");

    return console.log(`\n${chalk[i](horizontalLine(TERMINAL_WIDTH,o))}\n${chalk[i](figlet.textSync(t,n))}\n${chalk[i](horizontalLine(TERMINAL_WIDTH,o))}\n\n${chalk.yellow.bold("◧ Script Info :")}\n${chalk.green("Version :")} Resbot ${global.version}\n${chalk.green("API Key :")} ${s}\n${chalk.yellow.bold("------------------")}\n${chalk.yellow.bold("◧ Server Specifications :")}\n${u}\n\n${chalk[i](horizontalLine(TERMINAL_WIDTH,o))}\n${chalk[i].bold(" ◧ Thank you for using this script! ◧ ")}\n${chalk[i](horizontalLine(TERMINAL_WIDTH,o))}\n`);
}

/* Start application */
// بدء تشغيل التطبيق
async function start_app() {
    await showServerInfo();
    connectToWhatsApp();
}

module.exports = { showServerInfo, start_app, getServerSpecs };