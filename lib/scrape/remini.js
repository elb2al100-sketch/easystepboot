const axios = require('axios');
const FormData = require('form-data');

/**
 * ReminiV1 - Enhance image using Remini model v1
 * ReminiV1 - تحسين الصورة باستخدام نموذج Remini الإصدار 1
 * @param {Buffer} buffer - Input image as Buffer / الصورة المدخلة على شكل Buffer
 * @returns {Buffer} - Enhanced image as Buffer / الصورة المحسنة على شكل Buffer
 */
async function ReminiV1(buffer) {
    try {
        if (!Buffer.isBuffer(buffer)) {
            throw new Error('Input must be a Buffer. / يجب أن يكون الإدخال Buffer.');
        }

        const formData = new FormData();
        formData.append("image", buffer, {
            filename: "enhance_image_body.jpg",
            contentType: "image/jpeg"
        });
        formData.append("model_version", 1);

        // Send POST request to Remini API / إرسال طلب POST إلى واجهة Remini
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
                responseType: "arraybuffer", // Receive binary data / استلام البيانات بشكل ثنائي
                timeout: 40000               // 40 seconds timeout / مهلة 40 ثانية
            }
        );

        return Buffer.from(response.data);

    } catch (error) {
        throw error;
    }
}

/**
 * ReminiV2 - Enhance image using PixelCut Upscale API
 * ReminiV2 - تحسين الصورة باستخدام واجهة PixelCut لتكبير الصور
 * @param {Buffer} buffer - Input image as Buffer / الصورة المدخلة على شكل Buffer
 * @returns {Buffer} - Enhanced image as Buffer / الصورة المحسنة على شكل Buffer
 */
async function ReminiV2(buffer) {
    try {
        if (!Buffer.isBuffer(buffer)) {
            throw new Error('Input must be a Buffer. / يجب أن يكون الإدخال Buffer.');
        }

        const formData = new FormData();
        formData.append('image', buffer, { filename: 'image.jpg' });
        formData.append('scale', 2); // Scale factor / معامل التكبير

        // Step 1: Send request to PixelCut API to process the image
        // الخطوة 1: إرسال طلب إلى واجهة PixelCut لمعالجة الصورة
        const response = await axios.post(
            'https://api2.pixelcut.app/image/upscale/v1',
            formData,
            {
                headers: {
                    ...formData.getHeaders(),
                    'Accept': 'application/json',
                },
            }
        );

        const imageUrl = response.data.result_url;
        if (!imageUrl) {
            throw new Error('Failed to get the image URL. / فشل في الحصول على رابط الصورة.');
        }

        // Step 2: Download the processed image
        // الخطوة 2: تنزيل الصورة المعالجة
        const imageResponse = await axios.get(imageUrl, {
            responseType: 'arraybuffer',
        });

        return Buffer.from(imageResponse.data);

    } catch (error) {
        throw error;
    }
}

module.exports = { ReminiV1, ReminiV2 };