const { createLogger, format, transports } = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');
const config = require("@config");

/**
 * Create a Winston logger with daily rotation
 * إنشاء لوجر باستخدام مكتبة Winston مع تدوير يومي للملفات
 */
const logger = createLogger({
    level: 'info',
    format: format.combine(
        format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), // Timestamp format / تنسيق الوقت
        format.printf(({ timestamp, level, message }) => `[${timestamp}] ${level.toUpperCase()}: ${message}`) // Log format / تنسيق السجل
    ),
    transports: [
        new DailyRotateFile({
            filename: 'logs/bot-activity-%DATE%.log', // File name pattern / نمط اسم الملف
            datePattern: 'YYYY-MM-DD', // Rotate by day / التدوير حسب اليوم
            maxSize: '10m', // Maximum file size 10MB / الحجم الأقصى للملف 10 ميجا
            maxFiles: '14d' // Keep logs for 14 days / الاحتفاظ بالسجلات لمدة 14 يومًا
        })
    ]
});

/**
 * Custom function to log messages
 * دالة مخصصة لتسجيل الرسائل
 * @param {string} level - Log level / مستوى السجل
 * @param {string} message - Log message / رسالة السجل
 * @param {string|null} filename - Optional filename for separate log / اسم ملف اختياري لسجل منفصل
 */
function logCustom(level, message, filename = null) {
    // Only log if in development mode / سجل فقط في وضع التطوير
    if (config.mode != 'development') return;
    
    if (filename) {
        // Create a temporary logger for the specified file / إنشاء لوجر مؤقت للملف المحدد
        const tempLogger = createLogger({
            level: level,
            format: format.combine(
                format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
                format.printf(({ timestamp, level, message }) => `[${timestamp}] ${level.toUpperCase()}: ${message}`)
            ),
            transports: [
                new transports.File({
                    filename: `logs/${filename}`, // Create or use existing log file / إنشاء أو استخدام ملف سجل موجود
                    level: level
                })
            ]
        });

        // Use temporary logger to log the message / استخدام اللوجر المؤقت لتسجيل الرسالة
        tempLogger.log(level, message);
    } else {
        // Use main logger if no filename provided / استخدام اللوجر الرئيسي إذا لم يتم تحديد اسم ملف
        logger.log(level, message);
    }
}

module.exports = { logger, logCustom };