const os = require("os");
const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

// 🕒 دالة تنسيق وقت التشغيل / Format uptime into readable text
function getUptime(seconds) {
  const days = Math.floor(seconds / (24 * 3600));
  seconds %= 24 * 3600;
  const hours = Math.floor(seconds / 3600);
  seconds %= 3600;
  const minutes = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${days}d ${hours}h ${minutes}m ${secs}s`;
}

// 💻 دالة لتحديد نوع النظام / Function to detect platform
function getPlatform() {
  const platform = os.platform();
  if (platform === "win32") return "Windows";
  if (platform === "linux") return "Linux";
  return platform;
}

// 💾 دالة للحصول على معلومات القرص / Function to get disk info
function getDiskInfo() {
  try {
    if (os.platform() === "win32") {
      const stdout = execSync('wmic logicaldisk get size,freespace,caption').toString();
      const lines = stdout.trim().split('\n').filter(line => line.trim());
      const diskData = lines.slice(1).map(line => {
        const [drive, free, total] = line.trim().split(/\s+/);
        return {
          drive,
          total: (parseInt(total) / (1024 ** 3)).toFixed(2) + " GB",
          free: (parseInt(free) / (1024 ** 3)).toFixed(2) + " GB",
          used: ((parseInt(total) - parseInt(free)) / (1024 ** 3)).toFixed(2) + " GB"
        };
      });
      // ⚙️ افتراضيًا، استخدم القرص C / Default: use drive C
      return diskData.find(d => d.drive === "C:") || diskData[0];
    } else {
      // 🧾 على الأنظمة اللينكس / For Linux systems
      const total = execSync("df -h --output=size / | tail -1").toString().trim();
      const free = execSync("df -h --output=avail / | tail -1").toString().trim();
      const used = execSync("df -h --output=used / | tail -1").toString().trim();
      return { total, free, used };
    }
  } catch (err) {
    return { total: "N/A", free: "N/A", used: "N/A" };
  }
}

// 🕓 وقت بدء البوت / Bot start time
const botStartTime = Date.now();

async function handle(sock, messageInfo) {
  const { remoteJid, message } = messageInfo;

  // ⚡ حساب سرعة الاستجابة / Calculate response speed
  const start = process.hrtime();
  const end = process.hrtime(start);
  const responseSpeed = (end[0] + end[1] / 1e6).toFixed(4) + "s";

  // 💻 معلومات النظام / System Information
  const platformName = getPlatform();
  const totalRam = (os.totalmem() / 1024 / 1024 / 1024).toFixed(2) + " GB";
  const freeRam = (os.freemem() / 1024 / 1024 / 1024).toFixed(2) + " GB";
  const usedRam = ((os.totalmem() - os.freemem()) / 1024 / 1024 / 1024).toFixed(2) + " GB";
  const { total: totalDisk, free: freeDisk, used: usedDisk } = getDiskInfo();
  const cpuCores = os.cpus().length;
  const uptimeVPS = getUptime(os.uptime());
  const botRuntime = getUptime((Date.now() - botStartTime) / 1000);

  // 💾 حساب حجم مجلد الجلسة / Calculate session folder size
  const dbSize = (() => {
    let totalSize = 0;
    const folderPath = "./session";
    if (fs.existsSync(folderPath)) {
      fs.readdirSync(folderPath).forEach(file => {
        const filePath = path.join(folderPath, file);
        const stats = fs.statSync(filePath);
        if (stats.isFile()) totalSize += stats.size;
      });
    }
    return (totalSize / (1024 * 1024)).toFixed(2) + " MB";
  })();

  // 📤 إرسال النتائج للمستخدم / Send system info to user
  await sock.sendMessage(
    remoteJid,
    {
      text: `• *معلومات الخادم / SERVER INFORMATION*\n\n` +
        `⌬ *النظام / Platform* : \`\`\`${platformName}\`\`\`\n` +
        `⌬ *إجمالي الذاكرة / Total RAM* : \`\`\`${totalRam}\`\`\`\n` +
        `⌬ *الذاكرة الحرة / Free RAM* : \`\`\`${freeRam}\`\`\`\n` +
        `⌬ *الذاكرة المستخدمة / Used RAM* : \`\`\`${usedRam}\`\`\`\n` +
        `⌬ *إجمالي التخزين / Total Disk* : \`\`\`${totalDisk}\`\`\`\n` +
        `⌬ *التخزين الحر / Free Disk* : \`\`\`${freeDisk}\`\`\`\n` +
        `⌬ *التخزين المستخدم / Used Disk* : \`\`\`${usedDisk}\`\`\`\n` +
        `⌬ *عدد الأنوية / Total CPU* : \`\`\`${cpuCores} Core\`\`\`\n` +
        `⌬ *مدة تشغيل VPS / VPS Uptime* : \`\`\`${uptimeVPS}\`\`\`\n` +
        `____________________________________\n` +
        `• *معلومات البوت / BOT INFORMATION*\n\n` +
        `⌬ *زمن الاستجابة / Response Time* : \`\`\`${responseSpeed}\`\`\`\n` +
        `⌬ *مدة تشغيل البوت / Bot Runtime* : \`\`\`${botRuntime}\`\`\`\n` +
        `⌬ *حجم قاعدة البيانات / Database Size* : \`\`\`${dbSize}\`\`\``,
    },
    { quoted: message }
  );
}

// ⚙️ إعدادات الأمر / Command settings
module.exports = {
  handle,
  Commands: ["runtime"],   // اسم الأمر / Command name
  OnlyPremium: false,      // متاح للجميع / Available for all
  OnlyOwner: false,        // ليس خاصًا بالمالك فقط / Not owner-only
};