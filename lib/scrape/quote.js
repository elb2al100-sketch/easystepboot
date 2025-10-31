const axios = require('axios')

/**
 * Generate a quote image / إنشاء صورة اقتباس
 * @param {string} text Quote text / نص الاقتباس
 * @param {string} name Author name / اسم الكاتب
 * @param {string} avatar Avatar URL / رابط صورة الملف الشخصي
 * @returns {Promise<{status:string, creator:string, result:Buffer}>}
 */
const quote = async (text, name, avatar) => {

  // JSON payload / بيانات الإرسال إلى API
  const json = {
    type: "quote",          // Type / النوع
    format: "png",          // Format / صيغة الصورة
    backgroundColor: "#FFFFFF", // Background / الخلفية
    width: 512,             // Width / العرض
    height: 768,            // Height / الارتفاع
    scale: 2,               // Scale / التكبير
    messages: [             // Messages array / قائمة الرسائل
      {
        entities: [],
        avatar: true,       // Show avatar / إظهار الصورة
        from: {
          id: 1,
          name: name,       // Author name / اسم الكاتب
          photo: { url: avatar } // Avatar URL / رابط الصورة
        },
        text: text,         // Quote text / نص الاقتباس
        replyMessage: {}    // Reply info / معلومات الرد (فارغ)
      }
    ]
  }

  // Send POST request to generate quote / إرسال الطلب إلى API
  const res = await axios.post('https://bot.lyo.su/quote/generate', 
    json, 
    { headers: {'Content-Type': 'application/json'} }
  )

  // Convert base64 to buffer / تحويل الصورة من base64 إلى Buffer
  const buffer = Buffer.from(res.data.result.image, 'base64')

  // Return result / إرجاع النتيجة
  return { 
    status: "200", 
    creator: "AdrianTzy",
    result: buffer
  }
}

// Export function / تصدير الوظيفة
module.exports = { quote }