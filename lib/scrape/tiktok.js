const axios = require("axios");
const cheerio = require("cheerio");

/**
 * Download TikTok video metadata / تحميل بيانات فيديو TikTok
 * @param {string} url TikTok video URL / رابط فيديو TikTok
 * @returns {Promise<Object>} Metadata including title, cover, video links, and audio / بيانات الفيديو مثل العنوان، الصورة، رابط الفيديو، والصوت
 */
async function tiktok(url) {
    return new Promise(async (resolve, reject) => {
        try {
            // Prepare request parameters / تجهيز معلمات الطلب
            const params = new URLSearchParams();
            params.set("url", url);
            params.set("hd", "1");

            // Send request to Tikwm API / إرسال الطلب إلى Tikwm API
            const response = await axios({
                method: "POST",
                url: "https://tikwm.com/api/",
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
                    "Cookie": "current_language=en",
                    "User-Agent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Mobile Safari/537.36"
                },
                data: params
            });

            const data = response.data.data;

            // Ensure data is available / التأكد من وجود البيانات
            if (!data) {
                throw new Error("TikTok video data not found or invalid response / بيانات الفيديو غير موجودة أو الاستجابة غير صحيحة.");
            }

            // Resolve with video data / إعادة بيانات الفيديو
            resolve({
                title: data.title,          // Video title / عنوان الفيديو
                cover: data.cover,          // Cover image / الصورة المصغرة
                origin_cover: data.origin_cover, // Original cover / الصورة الأصلية
                no_watermark: data.play,    // Video without watermark / الفيديو بدون علامة مائية
                watermark: data.wmplay,     // Video with watermark / الفيديو مع العلامة المائية
                music: data.music           // Music/audio URL / رابط الصوت
            });
        } catch (error) {
            reject(new Error(`Failed to fetch TikTok video data: ${error.message} / فشل في الحصول على بيانات الفيديو`));
        }
    });
}

/**
 * Search TikTok videos by keywords / البحث عن فيديوهات TikTok بالكلمات المفتاحية
 * @param {string} keywords Search keywords / الكلمات المفتاحية للبحث
 * @returns {Promise<Object>} Random selected video metadata / بيانات فيديو مختار عشوائياً
 */
async function tiktokSearch(keywords) {
    try {
        const response = await axios({
            method: "POST",
            url: "https://tikwm.com/api/feed/search",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
                Cookie: "current_language=en",
                "User-Agent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Mobile Safari/537.36"
            },
            data: {
                keywords: keywords,
                count: 50,
                cursor: 0,
                HD: 1
            }
        });

        const videos = response?.data?.data?.videos;

        if (!videos || videos.length === 0) {
            throw new Error("No videos found / لم يتم العثور على فيديوهات.");
        }

        // Pick a random video / اختيار فيديو عشوائي
        const selectedVideo = videos[Math.floor(Math.random() * videos.length)];

        return {
            title: selectedVideo.title,
            cover: selectedVideo.cover,
            origin_cover: selectedVideo.origin_cover,
            no_watermark: selectedVideo.play,
            watermark: selectedVideo.wmplay,
            music: selectedVideo.music
        };
    } catch (error) {
        throw new Error(`Failed to search videos: ${error.message} / فشل البحث عن الفيديوهات`);
    }
}

/**
 * Extract images from a TikTok slide URL / استخراج الصور من رابط TikTok slide
 * @param {string} url URL of the slide / رابط الـ slide
 * @returns {Promise<Object>} Array of images with creator info / مصفوفة الصور مع معلومات المنشئ
 */
async function ttslide(url) {
    try {
        const response = await axios.get(`https://dlpanda.com/id?url=${url}&token=G7eRpMaa`);
        const html = response.data;

        const $ = cheerio.load(html);
        const images = [];
        const creator = "Jikarinka";

        // Extract image URLs / استخراج روابط الصور
        $("div.col-md-12 > img").each((_, element) => {
            const imgSrc = $(element).attr("src");
            if (imgSrc) images.push(imgSrc);
        });

        if (images.length === 0) {
            throw new Error("No images found / لم يتم العثور على صور.");
        }

        // Return structured result / إرجاع النتيجة بشكل منظم
        return {
            creator,
            images: images.map(img => ({ img, creator }))
        };
    } catch (error) {
        throw new Error(`Failed to process URL: ${error.message} / فشل في معالجة الرابط`);
    }
}

// Export functions / تصدير الوظائف لاستخدامها في ملفات أخرى
module.exports = { tiktok, tiktokSearch, ttslide };