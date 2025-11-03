// utils.js

const fs = require("fs");
const fsp = require("fs").promises;
const path = require("path");
const axios = require("axios");
const crypto = require("crypto");
const chalk = require("chalk");
const config = require("../config");
const archiver = require("archiver");
const ffmpeg = require("fluent-ffmpeg");
const os = require("os");
const FormData = require("form-data");
const { logger, logCustom } = require("@lib/logger");
const levenshtein = require("fast-levenshtein");
const moment = require("moment-timezone");
const https = require("https");
const agent = new https.Agent({ keepAlive: false });
const { spawn } = require("child_process");
const {
  format,
  differenceInSeconds,
  differenceInMinutes,
  differenceInHours,
  differenceInDays,
} = require("date-fns");

const tmpFolder = path.resolve("./tmp");
const DatabaseFolder = path.resolve("./database/media");
const mode = config.mode; // Can be 'production' or 'development / يمكن أن يكون 'production' أو 'development'

// Ensure tmp folder exists or create if not exist
// تأكد من وجود مجلد tmp أو إنشاؤه إذا لم يكن موجوداً
if (!fs.existsSync(tmpFolder)) {
  fs.mkdirSync(tmpFolder, { recursive: true });
}

if (!fs.existsSync(DatabaseFolder)) {
  fs.mkdirSync(DatabaseFolder, { recursive: true });
}

/**
 * Validation configuration / تكوين التحقق
 */
const validations = [
  {
    key: "type_connection",
    validValues: ["pairing", "qr"],
    errorMessage: "Type connection can only be pairing or qr / نوع الاتصال يمكن أن يكون فقط pairing أو qr",
  },
  {
    key: "phone_number_bot",
    validate: (value) => value && value.length >= 7,
    errorMessage: "Ensure BOT NUMBER is valid / تأكد من أن رقم البوت صالح",
  },
  {
    key: "bot_destination",
    validValues: ["group", "private", "both"],
    errorMessage: "Destination can only be group, private, or both / الوجهة يمكن أن تكون group أو private أو both فقط",
  },
  {
    key: "mode",
    validValues: ["production", "development"],
    errorMessage: "Mode can only be production or development / الوضع يمكن أن يكون production أو development فقط",
  },
];

/**
 * Log messages with timestamp / سجل الرسائل مع الطابع الزمني
 */
function logWithTime(pushName, truncatedContent, color = "green") {
  const now = new Date();
  const hours = now.getHours().toString().padStart(2, "0");
  const minutes = now.getMinutes().toString().padStart(2, "0");

  const time = chalk.blue(`[${hours}:${minutes}]`); // Blue color for time / اللون الأزرق للوقت
  const name = chalk.yellow(pushName); // Yellow color for name / اللون الأصفر للاسم

  if (!truncatedContent || typeof truncatedContent !== "string") return;
  const trimmedContent = truncatedContent.trim(); // Trimmed content / المحتوى بعد إزالة المسافات
  if (!trimmedContent) return;

  let message;
  switch (color.toLowerCase()) {
    case "green":
    case "hijau":
      message = chalk.greenBright(trimmedContent);
      break;
    case "red":
    case "merah":
      message = chalk.redBright(trimmedContent);
      break;
    case "blue":
    case "biru":
      message = chalk.blueBright(trimmedContent);
      break;
    case "yellow":
    case "kuning":
      message = chalk.yellowBright(trimmedContent);
      break;
    case "purple":
    case "ungu":
      message = chalk.magentaBright(trimmedContent);
      break;
    case "cyan":
      message = chalk.cyanBright(trimmedContent);
      break;
    default:
      message = chalk.greenBright(trimmedContent);
  }

  if (mode === "development") {
    console.log(`${time} ${name} : ${message}`);
    logger.info(`${pushName} : ${trimmedContent}`);
  }
}

/**
 * Warning log / سجل التحذير
 */
function warning(pushName, truncatedContent) {
  const now = new Date();
  const hours = now.getHours().toString().padStart(2, "0");
  const minutes = now.getMinutes().toString().padStart(2, "0");

  const time = chalk.cyan(`[${hours}:${minutes}]`);
  const name = chalk.yellow(pushName); 
  const message = chalk.yellowBright(truncatedContent); 

  console.log(`${time} ${name} : ${message}`);
  logger.info(`${pushName} : ${truncatedContent}`);
}

/**
 * Danger log / سجل الخطر
 */
function danger(pushName, truncatedContent) {
  const now = new Date();
  const hours = now.getHours().toString().padStart(2, "0");
  const minutes = now.getMinutes().toString().padStart(2, "0");

  const time = chalk.redBright(`[${hours}:${minutes}]`);
  const name = chalk.redBright(pushName);
  const message = chalk.redBright(truncatedContent);

  console.log(`${time} ${name} : ${message}`);
  logger.info(`${pushName} : ${truncatedContent}`);
}

/**
 * Success log / سجل النجاح
 */
function success(pushName, truncatedContent) {
  const now = new Date();
  const hours = now.getHours().toString().padStart(2, "0");
  const minutes = now.getMinutes().toString().padStart(2, "0");
  const time = chalk.cyan(`[${hours}:${minutes}]`);
  const name = chalk.greenBright(pushName);
  const message = chalk.greenBright(truncatedContent);

  console.log(`${time} ${name} : ${message}`);
}

/**
 * Find closest command / ابحث عن أقرب أمر
 */
function findClosestCommand(command, plugins) {
  let closestCommand = null;
  let minDistance = Infinity;

  for (const plugin of plugins) {
    for (const pluginCommand of plugin.Commands) {
      const distance = levenshtein.get(command, pluginCommand);
      if (distance < minDistance) {
        minDistance = distance;
        closestCommand = pluginCommand;
      }
    }
  }

  return closestCommand && minDistance <= 3 ? closestCommand : null;
}

/**
 * Upload temporary file / رفع ملف مؤقت
 */
async function uploadTmpFile(path, time = "1hour") {
  try {
    const form = new FormData();
    form.append("expired", time);
    form.append("file", fs.createReadStream(path));

    const response = await axios.put(
      "https://autoresbot.com/tmp-files/upload",
      form,
      {
        headers: {
          ...form.getHeaders(),
          Referer: "https://autoresbot.com/",
          "User-Agent":
            "Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Mobile Safari/537.36 Edg/126.0.0.0",
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Upload error:", error.message);
    return false;
  }
}

/**
 * Convert audio / تحويل الصوت
 */
function generateUniqueFilename(extension = "m4a") {
  const timestamp = Date.now();
  return `tmp/output_${timestamp}.${extension}`;
}

async function convertAudioToCompatibleFormat(inputPath) {
  const baseDir = process.cwd();
  const outputFormat = "m4a";
  const outputPath = path.join(baseDir, generateUniqueFilename(outputFormat));

  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .inputFormat("mp3")
      .audioCodec("aac")
      .audioFrequency(44100)
      .audioBitrate(128)
      .audioChannels(2)
      .on("end", () => resolve(outputPath))
      .on("error", (error) => reject(error))
      .save(outputPath);
  });
}