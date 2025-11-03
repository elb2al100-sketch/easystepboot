const axios = require('axios'); // نستخدم axios لاستدعاء API
const config = require('@config'); // تأكد من وضع API_KEY الخاص بك في config

async function handle(sock, messageInfo) {
    const { remoteJid, message, content, prefix, command } = messageInfo;

    // English: Loading icon to indicate process is running
    // العربية: أيقونة تحميل لإظهار أن العملية جارية
    const loadingReaction = { react: { text: "😎", key: message.key } };

    // English: Default error message
    // العربية: رسالة خطأ افتراضية
    const errorMessage = "Sorry, an error occurred while processing your request | عذرًا، حدث خطأ أثناء معالجة طلبك.";

    try {
        // English: Send loading reaction
        // العربية: إرسال رد فعل التحميل
        await sock.sendMessage(remoteJid, loadingReaction);

        // English: Use provided city or default to Cairo
        // العربية: استخدام المدينة المدخلة أو افتراضيًا القاهرة
        const city = content.trim() || "Cairo";

        // English: Call OpenWeatherMap API
        // العربية: استدعاء API الطقس من OpenWeatherMap
        const apiKey = config.WEATHER_API_KEY; // ضع مفتاح OpenWeatherMap هنا
        const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&units=metric&appid=${apiKey}&lang=ar`;

        const response = await axios.get(url);

        if (response.data) {
            const data = response.data;
            const weatherText = `
_*Weather Information | معلومات الطقس*_

◧ City | المدينة: ${data.name}, ${data.sys.country}
◧ Weather | الطقس: ${data.weather[0].description}
◧ Temperature | درجة الحرارة: ${data.main.temp}°C
◧ Feels like | درجة الحرارة المحسوسة: ${data.main.feels_like}°C
◧ Humidity | الرطوبة: ${data.main.humidity}%
◧ Wind Speed | سرعة الرياح: ${data.wind.speed} m/s
`;

            // English: Send weather information
            // العربية: إرسال معلومات الطقس للمستخدم
            await sock.sendMessage(remoteJid, { text: weatherText }, { quoted: message });
        } else {
            await sock.sendMessage(remoteJid, { text: "Sorry, no weather information found | عذرًا، لم يتم العثور على معلومات الطقس." }, { quoted: message });
        }

    } catch (error) {
        console.error("Weather API error:", error);

        // English: Send error message
        // العربية: إرسال رسالة خطأ
        await sock.sendMessage(remoteJid, { text: `${errorMessage}\n\nDetails | التفاصيل: ${error.message || error}` }, { quoted: message });
    }
}

module.exports = {
    handle,
    Commands: ['weather', 'طقس'],
    OnlyPremium: false,
    OnlyOwner: false
};