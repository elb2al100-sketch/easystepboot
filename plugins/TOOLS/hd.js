const { downloadQuotedMedia, downloadMedia, reply } = require("@lib/utils");
const fs = require("fs");
const path = require("path");
const mess = require("@mess");
const ApiAutoresbot = require("api-autoresbot");
const config = require("@config");

async function handle(sock, messageInfo) {
  const { m, remoteJid, message, content, prefix, command, type, isQuoted } = messageInfo;

  try {
    const mediaType = isQuoted ? isQuoted.type : type;

    // Validate media type / التحقق من نوع الوسائط
    if (mediaType !== "image") {
      return await reply(
        m,
        `⚠️ _Send/Reply with an image with caption / أرسل/رد على صورة مع التسمية التوضيحية *${prefix + command}*_`
      );
    }

    // Send loading reaction / إرسال تفاعل تحميل
    await sock.sendMessage(remoteJid, {
      react: { text: "🤌🏻", key: message.key },
    });

    // Download & prepare media / تحميل وتحضير الوسائط
    const media = isQuoted ? await downloadQuotedMedia(message) : await downloadMedia(message);
    const mediaPath = path.join("tmp", media);

    if (!fs.existsSync(mediaPath)) {
      throw new Error("Media file not found after download / الملف غير موجود بعد التحميل.");
    }

    const api = new ApiAutoresbot(config.APIKEY);

    // Upload media / رفع الوسائط
    const response = await api.tmpUpload(mediaPath);

    if (!response || response.code !== 200) {
      throw new Error("Upload failed or no URL returned / فشل الرفع أو لم يتم إرجاع رابط.");
    }

    const url = response.data.url;

    // Process image via Remini API / معالجة الصورة عبر واجهة Remini
    const MediaBuffer = await api.getBuffer("/api/tools/remini", { url });

    if (!Buffer.isBuffer(MediaBuffer)) {
      throw new Error("Invalid response: Expected Buffer / استجابة غير صالحة: Buffer متوقع.");
    }

    // Send processed image / إرسال الصورة المعالجة
    if (response && MediaBuffer) {
      await sock.sendMessage(
        remoteJid,
        {
          image: MediaBuffer,
          caption: mess.general.success,
        },
        { quoted: message }
      );
    } else {
      const errorMessage = `_An error occurred during image upload / حدث خطأ أثناء رفع الصورة._ \n\nERROR : ${error}`;
      await reply(m, errorMessage);
    }
  } catch (error) {
    // Send informative error message / إرسال رسالة خطأ مفصلة
    const errorMessage = `_An error occurred while processing the image / حدث خطأ أثناء معالجة الصورة._ \n\nERROR : ${error}`;
    await reply(m, errorMessage);
  }
}

module.exports = {
  handle,
  Commands: ["hd", "remini"], // Commands handled by this handler / الأوامر التي يتعامل معها هذا الهاندلر
  OnlyPremium: false,
  OnlyOwner: false,
  limitDeduction: 1, // Number of limits to deduct / عدد الاستخدامات التي سيتم خصمها
};