const config = require("@config");
const {
  removeSpace,
  isQuotedMessage,
  getMessageType,
  getSenderType,
} = require("@lib/utils");
const { getContentType } = require("baileys");

const debug = true;

// **Inisialisasi Map / Initialize Map**
const messageMap = new Map();

// **Get current time HH:MM / إرجاع الوقت الحالي بصيغة HH:MM**
function time() {
  const now = new Date();
  const jam = now.getHours().toString().padStart(2, "0");
  const menit = now.getMinutes().toString().padStart(2, "0");
  return `${jam}:${menit}`;
}

// **Insert message into Map / إدخال بيانات الرسالة في Map**
function insertMessage(id, participant, messageTimestamp, remoteId) {
  messageMap.set(id, {
    participant,
    messageTimestamp,
    remoteId,
  });
}

// **Update partial data of message / تحديث بيانات جزئية للرسالة**
function updateMessagePartial(id, partialData = {}) {
  if (messageMap.has(id)) {
    const current = messageMap.get(id);
    messageMap.set(id, { ...current, ...partialData });
  } else {
    console.log(`Data dengan id ${id} tidak ditemukan / البيانات غير موجودة للمعرف ${id}`);
  }
}

// **Log message with timestamp / طباعة سجل الرسائل مع الوقت**
function logWithTimestamp(...messages) {
  const now = new Date();
  const time = now.toTimeString().split(" ")[0]; // HH:MM:SS
  console.log(`[${time}]`, ...messages);
}

// **Serialize incoming WhatsApp message / تحويل الرسالة الواردة إلى هيكل بيانات موحد**
function serializeMessage(m, sock) {
  try {
    const timestamp = m.messages?.[0]?.messageTimestamp;
    const now = Math.floor(Date.now() / 1000);
    const diffInSeconds = now - timestamp;

    if (diffInSeconds > 30) return null; // Ignore old messages / تجاهل الرسائل القديمة

    if (!m || !m.messages || !m.messages[0]) return null;
    if (m.type === "append") return null;

    const message = m.messages[0];
    const key = message.key || {};
    const remoteJid = key.remoteJid || "";
    const fromMe = key.fromMe || false;
    const id = key.id || "";
    const participant = key.participant || message.participant || "";
    const pushName = message.pushName || "";
    const isGroup = remoteJid.endsWith("@g.us");
    const isBroadcast = remoteJid.endsWith("status@broadcast");
    let sender = isGroup ? participant : remoteJid;

    let senderType = getSenderType(sender);
    const isQuoted = isQuotedMessage(message);
    const isEdited =
      message?.message?.protocolMessage?.editedMessage?.extendedTextMessage?.text ||
      message?.message?.protocolMessage?.editedMessage?.conversation ||
      message?.message?.editedMessage ||
      null;
    const isDeleted = message?.message?.protocolMessage?.type === 0;
    const isForwarded =
      message.message?.[getContentType(message.message)]?.contextInfo?.isForwarded === true;

    let antitagsw = false;
    let isTagMeta = false;

    let objisEdited = {};
    if (isEdited) {
      const messageId = m.messages[0]?.message?.protocolMessage?.key?.id;
      objisEdited = {
        status: true,
        id: messageId || null,
        text: isEdited,
      };
    }

    const isBot =
      (id?.startsWith("3EB0") && id.length === 22) ||
      (message?.message &&
        Object.keys(message.message).some((key) =>
          ["templateMessage", "interactiveMessage", "buttonsMessage"].includes(key)
        ));

    antitagsw = !!(
      message?.message?.groupStatusMentionMessage ||
      message?.message?.groupStatusMentionMessage?.message?.protocolMessage?.type === "STATUS_MENTION_MESSAGE"
    );

    // **Determine message content / تحديد محتوى الرسالة**
    let content = "";
    let messageType = "";

    if (message?.message?.stickerMessage) {
      content = "stickerMessage";
      messageType = "stickerMessage";
    } else {
      content =
        message?.message?.conversation ||
        message?.message?.extendedTextMessage?.text ||
        message?.message?.imageMessage?.caption ||
        message?.message?.videoMessage?.caption ||
        message?.message?.documentMessage?.caption ||
        message?.message?.text ||
        message?.message?.selectedButtonId ||
        message?.message?.singleSelectReply?.selectedRowId ||
        message?.message?.selectedId ||
        message?.message?.contentText ||
        message?.message?.selectedDisplayText ||
        message?.message?.title ||
        "";
      messageType = Object.keys(message.message)[0] || "unknown";
    }

    content = removeSpace(content) || "";

    // **Parse command and prefix / استخراج الأمر والبادئة**
    let command = content?.trim()?.split(" ")[0]?.toLowerCase() || "";
    const usedPrefix = config.prefix.find((p) => (command || "").startsWith(p));
    command = usedPrefix
      ? (command || "").slice(usedPrefix.length).trim().split(/\s+/)[0] || ""
      : config.status_prefix
      ? false
      : (command || "").trim().split(/\s+/)[0] || "";

    const contentWithoutCommand = usedPrefix
      ? (content || "").trim().slice(usedPrefix.length + (command?.length || 0)).trim()
      : (content || "").trim().slice(command?.length || 0).trim();

    // **Quoted message info / معلومات الرسالة المقتبسة**
    const quotedMessage = isQuoted
      ? {
          text: message.message.extendedTextMessage.contextInfo.quotedMessage?.conversation || "",
          sender: message.message.extendedTextMessage.contextInfo.participant || "",
          id: message.message.extendedTextMessage.contextInfo.stanzaId || "",
        }
      : null;

    const ArraymentionedJid = message?.message?.extendedTextMessage?.contextInfo?.mentionedJid || false;
    const cleanContent = content.replace(/\s+/g, " ").trim();
    const preview = cleanContent.length > 20 ? cleanContent.slice(0, 20) + "..." : cleanContent;
    const senderNumber = participant.replace(/@s\.whatsapp\.net$/, "");

    return {
      id,
      timestamp: message.messageTimestamp,
      sender,
      pushName,
      isGroup,
      fromMe,
      remoteJid,
      type: getMessageType(messageType),
      content: contentWithoutCommand,
      message,
      isTagSw: antitagsw,
      prefix: usedPrefix ? usedPrefix : "",
      command,
      fullText: content,
      isQuoted,
      quotedMessage,
      mentionedJid: ArraymentionedJid,
      isBot,
      isTagMeta,
      isForwarded,
      senderType,
      m: { remoteJid, key, message, sock, isDeleted, isEdited: objisEdited, m },
    };
  } catch (e) {
    return null; // Ignore parsing errors / تجاهل الأخطاء
  }
}

module.exports = serializeMessage;