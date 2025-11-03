// ===========================
// SNAKES AND LADDERS GAME MODULE
// ===========================

const DATABASE = {}; // Store game in RAM / حفظ حالة اللعبة في الذاكرة

const MONEY_MENANG = 100; // Reward money for winner / المال الممنوح للفائز
const opsiLoading = "sticker"; // sticker, emoticon / طريقة عرض عند الرمي: ملصق أو ايموجي

const fs = require("fs");
const path = require("path");

const { getProfilePictureUrl } = require("@lib/cache"); // Get player avatar / الحصول على صورة الملف الشخصي
const {
  getBuffer,
  sendMessageWithMention,
  sendImagesWithMention,
} = require("@lib/utils"); // Utility functions / وظائف مساعدة
const { addUser, updateUser, deleteUser, findUser } = require("@lib/users"); // User database / قاعدة بيانات المستخدمين

// ===== BOARD CONFIGURATION / إعدادات اللوحة =====
const snakes = {
  99: 41, 95: 76, 89: 53, 66: 45, 54: 31, 43: 17, 40: 2, 27: 5
}; // If player lands here, go down / إذا وقع اللاعب هنا، ينزل

const ladders = {
  4: 23, 13: 46, 33: 52, 42: 63, 50: 69, 62: 81, 74: 93
}; // If player lands here, go up / إذا وقع اللاعب هنا، يصعد

let pendingDelete = null; // For deleting previous board image / لحذف صورة اللوحة السابقة

// ===== SEND STICKER FUNCTION / دالة إرسال الملصق =====
async function kirimSticker(sock, remoteJid, namaFile, message) {
  try {
    const mediaPath = path.join(process.cwd(), "database/assets", namaFile);

    if (!fs.existsSync(mediaPath)) {
      throw new Error(`File not found / الملف غير موجود: ${mediaPath}`);
    }

    const buffer = fs.readFileSync(mediaPath);

    await sock.sendMessage(
      remoteJid,
      { sticker: buffer },
      { quoted: message }
    );
  } catch (error) {
    console.error("Failed to send sticker / فشل إرسال الملصق:", error.message);
  }
}

// ===== HANDLE FUNCTION / دالة إدارة اللعبة =====
async function handle(sock, messageInfo) {
  const { remoteJid, sender, isGroup, message, content, senderType } = messageInfo;
  if (!isGroup) return; // Only group chats / فقط للمجموعات

  // ===== INIT GAME OBJECT / تهيئة بيانات اللعبة =====
  let game = DATABASE[remoteJid];
  if (!game) {
    game = { players: [], started: false, turnIndex: 0, positions: {} };
    DATABASE[remoteJid] = game;
  }

  const command = content?.toLowerCase();

  // ===== SHOW GAME INFO / عرض معلومات اللعبة =====
  if (!content) {
    let infoText = "🎮 *Snakes and Ladders Info / معلومات لعبة الثعابين والسلالم*\n";

    if (game.players.length === 0) {
      infoText += "👥 No players joined yet / لا يوجد لاعبين حتى الآن.\n";
    } else {
      const playerList = game.players
        .map(
          (p, i) =>
            `${i + 1}. @${p.split("@")[0]}${i === game.turnIndex && game.started ? " 🔄 (current turn / الدور الحالي)" : ""}`
        )
        .join("\n");
      infoText += `👥 Players (${game.players.length}/10):\n${playerList}\n`;
    }

    infoText += `\nStatus: ${game.started ? "🟢 Started / بدأت" : "🔴 Not started / لم تبدأ"}`;
    infoText += `\n\n✅ Use *.snakes join* to join / للانضمام\n🚀 Use *.snakes start* to start / لبدء اللعبة\n🛠️ Use *.snakes reset* to reset / لإعادة تعيين اللعبة`;

    return await sendMessageWithMention(sock, remoteJid, infoText, message, senderType);
  }

  // ===== JOIN GAME / الانضمام للعبة =====
  if (command === "join") {
    if (game.started) {
      return await sock.sendMessage(remoteJid, { text: "⛔ Game already started / اللعبة بدأت بالفعل." }, { quoted: message });
    }
    if (game.players.includes(sender)) {
      return await sock.sendMessage(remoteJid, { text: "⚠️ You already joined / لقد انضممت بالفعل." }, { quoted: message });
    }
    if (game.players.length >= 10) {
      return await sock.sendMessage(remoteJid, { text: "🚫 Max 10 players reached / تم الوصول للحد الأقصى 10 لاعبين." }, { quoted: message });
    }

    game.players.push(sender);
    game.positions[sender] = 1;
    return await sendMessageWithMention(sock, remoteJid, `✅ @${sender.split("@")[0]} joined. Total players / عدد اللاعبين: ${game.players.length}`, message, senderType);
  }

  // ===== START GAME / بدء اللعبة =====
  if (command === "start") {
    if (game.started) return await sock.sendMessage(remoteJid, { text: "🟡 Game already started / اللعبة بدأت بالفعل." }, { quoted: message });
    if (game.players.length < 2) return await sock.sendMessage(remoteJid, { text: "❌ Minimum 2 players required / الحد الأدنى 2 لاعبين." }, { quoted: message });

    game.started = true;
    game.turnIndex = 0;
    return await sendMessageWithMention(sock, remoteJid, `🎲 Game started!\nFirst turn: @${game.players[0].split("@")[0]} type ".snakes play" / الدور الأول: `.split("@")[0], message, senderType);
  }

  // ===== PLAY TURN / رمي النرد =====
  if (command === "play") {
    if (!game.started) return await sock.sendMessage(remoteJid, { text: "❌ Game not started yet / اللعبة لم تبدأ بعد. Use join and start / استخدم join و start" }, { quoted: message });
    if (game.players[game.turnIndex] !== sender) return await sendMessageWithMention(sock, remoteJid, `🔄 Not your turn / ليس دورك. Current turn: @${game.players[game.turnIndex].split("@")[0]}`, message, senderType);

    const dice = Math.floor(Math.random() * 6) + 1;
    let posBefore = game.positions[sender];
    game.positions[sender] += dice;

    if (game.positions[sender] > 100) {
      const overflow = game.positions[sender] - 100;
      game.positions[sender] = 100 - overflow; // Bounce back / العودة للخلف
    }

    let moveInfo = "";
    if (snakes[game.positions[sender]]) {
      game.positions[sender] = snakes[game.positions[sender]];
      moveInfo = "🐍 Hit a snake! Move down / ضربت ثعبان! انزل";
    } else if (ladders[game.positions[sender]]) {
      game.positions[sender] = ladders[game.positions[sender]];
      moveInfo = "🪜 Climb a ladder! / اصعد السلم!";
    }

    // ===== CHECK WIN / تحقق من الفوز =====
    if (game.positions[sender] === 100) {
      delete DATABASE[remoteJid];

      const user = await findUser(sender);
      if (user) {
        const moneyAdd = (user.money || 0) + MONEY_MENANG;
        await updateUser(sender, { money: moneyAdd });
      } else {
        await addUser(sender, { money: MONEY_MENANG, role: "user", status: "active" });
      }

      return await sendMessageWithMention(sock, remoteJid, `🏆 @${sender.split("@")[0]} won! 🎉\nYou receive / حصلت على: ${MONEY_MENANG} Money`, message, senderType);
    }

    // Next turn / الدور التالي
    game.turnIndex = (game.turnIndex + 1) % game.players.length;

    // Generate board image / توليد صورة اللوحة
    const params = new URLSearchParams();
    for (let player of game.players) {
      const pp = await getProfilePictureUrl(sock, player);
      params.append("pp", pp);
      params.append("positions", game.positions[player] || 1);
    }
    const API_URL = `https://api.autoresbot.com/api/maker/ulartangga?${params.toString()}`;

    try {
      if (opsiLoading == "emoticon") {
        await sock.sendMessage(remoteJid, { react: { text: "🎲", key: message.key } });
      } else if (opsiLoading == "sticker") {
        await kirimSticker(sock, remoteJid, `${dice}.webp`, message);
      }

      const buffer = await getBuffer(API_URL);
      const customizedMessage = `🎲 @${sender.split("@")[0]} rolled: ${dice}\n📍 Current position: ${game.positions[sender]} ${moveInfo}\n➡️ Next turn: @${game.players[game.turnIndex].split("@")[0]}`;

      const result = await sendImagesWithMention(sock, remoteJid, buffer, customizedMessage, message, senderType);
      if (result && pendingDelete) {
        await sock.sendMessage(remoteJid, { delete: { remoteJid, fromMe: true, id: pendingDelete } });
      }
      pendingDelete = result?.key?.id;
    } catch (err) {
      console.error(err);
      await sock.sendMessage(remoteJid, { text: "❌ Failed to fetch board image from API / فشل جلب صورة اللوحة من API" }, { quoted: message });
    }
  }

  // ===== RESET GAME / إعادة تعيين اللعبة =====
  if (command === "reset") {
    if (game.players.length === 0 && !game.started) {
      return await sock.sendMessage(remoteJid, { text: "⚠️ No ongoing game to reset / لا توجد لعبة حالية لإعادة التعيين" }, { quoted: message });
    }
    delete DATABASE[remoteJid];
    return await sock.sendMessage(remoteJid, { text: "✅ Game reset / تمت إعادة تعيين اللعبة. Use *.snakes join* to start again / استخدم *.snakes join للبدء من جديد" }, { quoted: message });
  }
}

// ===== EXPORT MODULE / تصدير الموديول =====
module.exports = {
  handle,
  Commands: ["snakes"], // Commands / الأوامر
  OnlyPremium: false,
  OnlyOwner: false,
};