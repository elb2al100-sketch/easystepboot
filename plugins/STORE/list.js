const { getDataByGroupId } = require("@lib/list");
const { applyTemplate } = require("@DB/templates/list");
const { getGroupMetadata } = require("@lib/cache");
const { checkMessage } = require("@lib/participants");
const fs = require("fs").promises;
const {
  sendMessageWithMention,
  getCurrentTime,
  getCurrentDate,
  getGreeting,
  getHari,
} = require("@lib/utils");

async function handle(sock, messageInfo) {
  const { remoteJid, isGroup, sender, message, content, senderType } =
    messageInfo;

  // Set list ID / تحديد معرف القائمة
  let idList = remoteJid;
  if (!isGroup) {
    // Private chat / دردشة خاصة
    idList = "owner";
  }

  // Check custom list template / التحقق من قالب قائمة مخصص
  const first_checksetlist = await checkMessage(remoteJid, "setlist");

  // Default template ID / القالب الافتراضي
  let defaultLIst = 1;
  const result = await checkMessage(remoteJid, "templatelist");
  if (result) {
    defaultLIst = result;
  }

  // Group metadata / بيانات المجموعة
  let nameGrub = "";
  let size = "";
  let desc = "";
  if (isGroup) {
    const groupMetadata = await getGroupMetadata(sock, remoteJid);
    nameGrub = groupMetadata.subject || "";
    size = groupMetadata.size || "";
    desc = groupMetadata.desc || "";
  }

  try {
    // Fetch current list / جلب القائمة الحالية
    const currentList = await getDataByGroupId(idList);

    if (!currentList || !currentList.list || Object.keys(currentList.list).length === 0) {
      await sock.sendMessage(remoteJid, {
        text: "_No list available in this group, type *addlist* to create one_\n\n_Only *admins* can add/delete lists / لا توجد قائمة في هذه المجموعة، اكتب *addlist* لإنشاء واحدة\n\nفقط *المشرفون* يمكنهم الإضافة أو الحذف_",
      });
      return;
    }

    // Prepare keyword lists / إعداد قائمة الكلمات الرئيسية
    const keywordList = Object.keys(currentList.list);
    const keywordList2 = Object.keys(currentList.list).sort();

    // Check if user requested a specific element / التحقق مما إذا تم طلب عنصر محدد
    const firstElement =
      content > 0 && content <= keywordList.length
        ? keywordList[content - 1]
        : false;

    if (!firstElement) {
      // Dynamic data for template / البيانات الديناميكية للقالب
      const data = {
        name: `@${sender.split("@")[0]}`,
        date: getCurrentDate(),
        day: getHari(),
        desc: desc,
        group: nameGrub,
        greeting: getGreeting(),
        size: size,
        time: `${getCurrentTime()} WIB`,
        list: keywordList,
      };

      if (first_checksetlist) {
        // Custom template exists / إذا كان هناك قالب مخصص
        let lines = first_checksetlist.split("\n");
        let formattedList = [];

        for (let line of lines) {
          if (line.includes("@x")) {
            let template = line.replace("@x", "").trim();
            let listItems = keywordList2
              .map((item) => `${template} ${item}`)
              .join("\n");
            formattedList.push(listItems);
          } else {
            formattedList.push(line);
          }
        }

        let message2 = formattedList.join("\n");

        message2 = message2
          .replace(/@name/g, data.name)
          .replace(/@date/g, data.date)
          .replace(/@day/g, data.day)
          .replace(/@desc/g, data.desc)
          .replace(/@group/g, data.group)
          .replace(/@greeting/g, data.greeting)
          .replace(/@size/g, data.size)
          .replace(/@time/g, data.time);

        return await sendMessageWithMention(
          sock,
          remoteJid,
          message2,
          message,
          senderType
        );
      }

      const finalMessage = applyTemplate(defaultLIst, data);
      return await sendMessageWithMention(
        sock,
        remoteJid,
        finalMessage,
        message,
        senderType
      );
    }

    // Search for specific keyword / البحث عن كلمة محددة
    const searchResult = Object.keys(currentList.list).filter((item) =>
      item.toLowerCase().includes(firstElement.toLowerCase())
    );

    if (searchResult.length === 0) {
      return await sock.sendMessage(remoteJid, {
        text: "_No matching list found / لا توجد قائمة مطابقة_",
      });
    } else {
      const { text, media } = currentList.list[searchResult[0]].content;

      if (media) {
        const buffer = await getMediaBuffer(media);
        if (buffer) {
          await sendMediaMessage(sock, remoteJid, buffer, text, message);
        } else {
          console.error(`Media not found or failed to read: ${media}`);
        }
      } else {
        await sendMessageWithMention(
          sock,
          remoteJid,
          text,
          message,
          senderType
        );
      }
    }
  } catch (error) {
    console.error("Error in list command / خطأ في أمر القائمة:", error);
  }
}

// Read media file buffer / قراءة محتوى ملف الوسائط
async function getMediaBuffer(mediaFileName) {
  const filePath = `./database/media/${mediaFileName}`;
  try {
    return await fs.readFile(filePath);
  } catch (error) {
    console.error(`Failed to read media file: ${filePath} / فشل قراءة الملف`, error);
    return null;
  }
}

// Send media message / إرسال رسالة وسائط
async function sendMediaMessage(sock, remoteJid, buffer, caption, quoted) {
  try {
    await sock.sendMessage(remoteJid, { image: buffer, caption }, { quoted });
  } catch (error) {
    console.error("Failed to send media message / فشل إرسال الوسائط:", error);
  }
}

module.exports = {
  handle,
  Commands: ["list"],
  OnlyPremium: false,
  OnlyOwner: false,
};