const axios = require('axios');
const FormData = require('form-data');

/**
 * ReminiV1: Enhance image using Vyro API / تحسين الصورة باستخدام Vyro API
 * @param {Buffer} buffer Image buffer / مصفوفة البايتات للصورة
 * @returns {Promise<Buffer>} Enhanced image / الصورة المحسنة
 */
async function ReminiV1(buffer) {
    try {
        if (!Buffer.isBuffer(buffer)) throw new Error('Input must be a Buffer.'); // تحقق من الإدخال

        const formData = new FormData();
        formData.append("image", buffer, { filename: "enhance_image_body.jpg", contentType: "image/jpeg" });
        formData.append("model_version", 1);

        const response = await axios.post(
            'https://inferenceengine.vyro.ai/enhance.vyro',
            formData,
            {
                headers: { 
                    ...formData.getHeaders(), 
                    "User-Agent": "okhttp/4.9.3", 
                    Connection: "Keep-Alive", 
                    "Accept-Encoding": "gzip" 
                },
                responseType: "arraybuffer",
                timeout: 40000
            }
        );

        return Buffer.from(response.data); // Return enhanced image / إرجاع الصورة المحسنة

    } catch (error) {
        throw error;
    }
}

/**
 * ReminiV2: Enhance image using Pixelcut API / تحسين الصورة باستخدام Pixelcut API
 * @param {Buffer} buffer Image buffer / مصفوفة البايتات للصورة
 * @returns {Promise<Buffer>} Enhanced image / الصورة المحسنة
 */
async function ReminiV2(buffer) {
    try {
        if (!Buffer.isBuffer(buffer)) throw new Error('Input must be a Buffer.');

        const formData = new FormData();
        formData.append('image', buffer, { filename: 'image.jpg' });
        formData.append('scale', 2);

        // Step 1: Send image to API / إرسال الصورة إلى API
        const response = await axios.post(
            'https://api2.pixelcut.app/image/upscale/v1',
            formData,
            { headers: { ...formData.getHeaders(), 'Accept': 'application/json' } }
        );

        const imageUrl = response.data.result_url;
        if (!imageUrl) throw new Error('Failed to get the image URL.');

        // Step 2: Download the enhanced image / تنزيل الصورة المحسنة
        const imageResponse = await axios.get(imageUrl, { responseType: 'arraybuffer' });
        return Buffer.from(imageResponse.data);

    } catch (error) {
        throw error;
    }
}

module.exports = { ReminiV1, ReminiV2 };