const axios = require('axios')

/**
 * Generate a chat quote image / توليد صورة اقتباس دردشة
 * @param {string} text - The message text / نص الرسالة
 * @param {string} name - Sender's name / اسم المرسل
 * @param {string} avatar - URL of sender's avatar / رابط صورة المرسل
 * @returns {Object} - Status and result buffer / الحالة والنتيجة على شكل بافر
 */
const quote = async (text, name, avatar) => {

    // JSON payload for quote API / البيانات المرسلة لواجهة API
    const json = {
        "type": "quote",              // Type of content / نوع المحتوى
        "format": "png",              // Output format / صيغة الإخراج
        "backgroundColor": "#FFFFFF", // Background color / لون الخلفية
        "width": 512,                 // Image width / عرض الصورة
        "height": 768,                // Image height / ارتفاع الصورة
        "scale": 2,                   // Scale factor / معامل التكبير
        "messages": [
            {
                "entities": [],       // Message entities (like mentions) / الكيانات داخل الرسالة
                "avatar": true,      // Show avatar / إظهار الصورة
                "from": {
                    "id": 1,
                    "name": name,    // Sender name / اسم المرسل
                    "photo": {
                        "url": avatar, // Avatar URL / رابط الصورة
                    }
                },
                "text": text,       // Message text / نص الرسالة
                "replyMessage": {}  // Optional reply message / رسالة الرد (اختياري)
            }
        ]
    };

    // Send POST request to generate the quote / إرسال طلب POST لتوليد الاقتباس
    const res = await axios.post(
        'https://bot.lyo.su/quote/generate', 
        json, 
        { headers: {'Content-Type': 'application/json'} }
    );

    // Convert base64 result to buffer / تحويل الصورة من Base64 إلى Buffer
    const buffer = Buffer.from(res.data.result.image, 'base64');

    return { 
        status: "200",       // Status code / كود الحالة
        creator: "AdrianTzy", // Creator info / منشئ الكود
        result: buffer       // Image buffer / الصورة على شكل بافر
    }
}

module.exports = {
    quote
}