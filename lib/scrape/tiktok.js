const axios = require("axios");
const cheerio = require("cheerio");

/**
 * Download TikTok video metadata
 * تنزيل بيانات التعريف لفيديو TikTok
 * @param {string} url - TikTok video URL / رابط فيديو TikTok
 * @returns {Promise<Object>} Video metadata including title, cover, video link, and music / بيانات الفيديو بما في ذلك العنوان، الغلاف، رابط الفيديو والموسيقى
 */
async function tiktok(url) {
    return new Promise(async (resolve, reject) => {
        try {
            // Prepare request parameters / تحضير معلمات الطلب
            const params = new URLSearchParams();
            params.set("url", url);
            params.set("hd", "1");

            // Send request to Tikwm API / إرسال الطلب إلى واجهة Tikwm
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

            // Ensure data is available / التأكد من توفر البيانات
            if (!data) {
                throw new Error("TikTok video data not found or invalid response. / لم يتم العثور على بيانات الفيديو أو الاستجابة غير صالحة.");
            }

            // Resolve with video data / إرجاع بيانات الفيديو
            resolve({
                title: data.title,
                cover: data.cover,
                origin_cover: data.origin_cover,
                no_watermark: data.play,
                watermark: data.wmplay,
                music: data.music
            });
        } catch (error) {
            // Catch error and reject / التقاط الخطأ ورفض الوعد
            reject(new Error(`Failed to get TikTok video data: ${error.message} / فشل في الحصول على بيانات الفيديو: ${error.message}`));
        }
    });
}

/**
 * Search TikTok videos by keywords
 * البحث عن فيديوهات TikTok باستخدام كلمات مفتاحية
 * @param {string} keywords - Keywords for search / الكلمات المفتاحية للبحث
 * @returns {Promise<Object>} Random video metadata / بيانات فيديو عشوائية
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
            throw new Error("No videos found. / لم يتم العثور على أي فيديوهات.");
        }

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
        throw new Error(`Failed to search videos: ${error.message} / فشل في البحث عن الفيديوهات: ${error.message}`);
    }
}

/**
 * Extract images from TikTok slideshows (ttslide)
 * استخراج الصور من عروض الشرائح على TikTok
 * @param {string} url - TikTok slideshow URL / رابط عرض الشرائح
 * @returns {Promise<Object>} Images array and creator info / مصفوفة الصور ومعلومات المنشئ
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
            if (imgSrc) {
                images.push(imgSrc);
            }
        });

        if (images.length === 0) {
            throw new Error("No images found. / لم يتم العثور على أي صور.");
        }

        // Return structured result / إرجاع النتيجة المنظمة
        return {
            creator,
            images: images.map(img => ({ img, creator }))
        };
    } catch (error) {
        throw new Error(`Failed to process URL: ${error.message} / فشل في معالجة الرابط: ${error.message}`);
    }
}

// Export functions for other modules / تصدير الدوال لاستخدامها في ملفات أخرى
module.exports = { tiktok, tiktokSearch, ttslide };