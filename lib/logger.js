const { createLogger, format, transports } = require('winston'); // Using winston for logging | استخدام مكتبة winston لتسجيل الأحداث
const DailyRotateFile = require('winston-daily-rotate-file'); // Daily log rotation | تدوير سجلات يوميًا
const config = require("@config");

/**
 * ============================
 * Main Logger
 * السجل الرئيسي
 * ============================
 */
const logger = createLogger({
    level: 'info', // Default log level | مستوى السجل الافتراضي
    format: format.combine(
        format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), // Include timestamp | تضمين الطابع الزمني
        format.printf(({ timestamp, level, message }) => `[${timestamp}] ${level.toUpperCase()}: ${message}`)
    ),
    transports: [
        new DailyRotateFile({
            filename: 'logs/bot-activity-%DATE%.log', // File name pattern | نمط اسم الملف
            datePattern: 'YYYY-MM-DD', // Daily rotation | تدوير يومي
            maxSize: '10m', // Maximum log file size 10MB | الحد الأقصى لحجم الملف 10 ميجابايت
            maxFiles: '14d' // Keep logs for 14 days | الاحتفاظ بالسجلات لمدة 14 يوم
        })
    ]
});

/**
 * ============================
 * Custom logging function
 * دالة تسجيل مخصصة
 * ============================
 */
function logCustom(level, message, filename = null) {
    if(config.mode != 'development') return; // Only log in development | التسجيل فقط في وضع التطوير

    if (filename) {
        // Temporary logger for custom file | سجل مؤقت لملف مخصص
        const tempLogger = createLogger({
            level: level,
            format: format.combine(
                format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
                format.printf(({ timestamp, level, message }) => `[${timestamp}] ${level.toUpperCase()}: ${message}`)
            ),
            transports: [
                new transports.File({
                    filename: `logs/${filename}`, // Use or create the specified log file | استخدام الملف المحدد أو إنشاؤه
                    level: level
                })
            ]
        });

        tempLogger.log(level, message); // Log message | تسجيل الرسالة
    } else {
        logger.log(level, message); // Use main logger | استخدام السجل الرئيسي
    }
}

// Export main logger and custom logging function | تصدير السجل الرئيسي والدالة المخصصة
module.exports = { logger, logCustom };