// استيراد الوظائف الأساسية لإدارة اللعبة
// Import core functions for managing the game
const {
  removeUser,
  getUser,
  isUserPlaying,
  updateGame,
} = require("@tmpDB/tictactoe");
const { sendMessageWithMention } = require("@lib/utils");
const TicTacToe = require("@games/tictactoe");

// رموز لوحة اللعبة
// Symbols for the game board
const SYMBOLS = {
  X: "❌",
  O: "⭕",
  1: "1️⃣",
  2: "2️⃣",
  3: "3️⃣",
  4: "4️⃣",
  5: "5️⃣",
  6: "6️⃣",
  7: "7️⃣",
  8: "8️⃣",
  9: "9️⃣",
};

// الدالة الرئيسية لمعالجة الرسائل أثناء اللعبة
// Main function to process messages during the game
async function process(sock, messageInfo) {
  const { remoteJid, fullText, message, sender, senderType } = messageInfo;

  // التحقق مما إذا كان هناك لعبة نشطة
  // Check if there is an active game
  if (!isUserPlaying(remoteJid)) {
    return true; // تابع إلى البلجن التالي / Continue to next plugin
  }

  const data = getUser(remoteJid);
  const lowerText = fullText.toLowerCase();

  // معالجة الاستسلام
  // Handle surrender
  if (lowerText.includes("nyerah")) {
    removeUser(remoteJid);
    await sock.sendMessage(
      remoteJid,
      {
        text: `Yahh menyerah 😢\nGame dibatalkan!\n\nIngin bermain? Ketik *.tictactoe*`,
      },
      { quoted: message }
    );
    return false; // العملية انتهت / Process finished
  }

  // معالجة قبول التحدي لبدء اللعبة
  // Handle challenge acceptance to start the game
  if (lowerText.includes("ttc") || lowerText.includes("tictactoe")) {
    if (data.playerX === sender) return false; // اللاعب نفسه لا يمكنه اللعب ضد نفسه
    if (data.state === "PLAYING") return false; // اللعبة قد بدأت بالفعل

    // تحديث بيانات اللعبة / Update game data
    data.playerO = sender;
    data.game.playerO = sender;
    data.state = "PLAYING";
    updateGame(remoteJid, data);

    // عرض لوحة اللعبة / Render game board
    const board = data.game.render().map((v) => SYMBOLS[v] || v);
    const gameBoard = `
Room ID: ${data.id_room}

${board.slice(0, 3).join("")}
${board.slice(3, 6).join("")}
${board.slice(6).join("")}

Menunggu @${data.game.currentTurn.split("@")[0]}

Ketik *nyerah* untuk menyerah dan mengakui kekalahan
        `.trim();

    await sendMessageWithMention(
      sock,
      remoteJid,
      gameBoard,
      message,
      senderType
    );
    return false; // العملية انتهت / Process finished
  }

  // معالجة الحركة أثناء دور اللاعب
  // Handle player's turn
  const match = fullText.match(/^\d$/); // تطابق الأرقام 1-9 / Match numbers 1-9
  if (match) {
    const move = parseInt(match[0], 10) - 1; // تحويل إلى index (0-8) / Convert to index
    const player = sender === data.playerX ? 0 : 1;

    // تنفيذ الحركة / Execute turn
    const result = data.game.turn(player, move);

    // تقييم نتيجة الدور / Evaluate turn result
    if (result === -1 || result === 0 || result === -2) {
      return; // الحركة غير صالحة أو لا تأثير / Invalid move or no effect
    } else if (result === -3) {
      removeUser(remoteJid);
      await sock.sendMessage(
        remoteJid,
        { text: `Game selesai! Tidak ada pemenang.` }, // لا يوجد فائز / No winner
        { quoted: message }
      );
    } else {
      // تحديث عرض اللوحة بعد الدور / Update board display
      const board = data.game.render().map((v) => SYMBOLS[v] || v);
      const boardDisplay = `
Room ID: ${data.id_room}

${board.slice(0, 3).join("")}
${board.slice(3, 6).join("")}
${board.slice(6).join("")}

Giliran @${data.game.currentTurn.split("@")[0]}

Ketik angka 1-9 untuk bermain.
            `.trim();

      await sendMessageWithMention(sock, remoteJid, boardDisplay, message);

      // التحقق من الفائز / Check for winner
      const winner = data.game.winner;
      if (winner) {
        removeUser(remoteJid);
        await sendMessageWithMention(
          sock,
          remoteJid,
          `Selamat! 🎉 @${winner.split("@")[0]} memenangkan permainan.`,
          message
        );
      }
    }

    return false; // العملية انتهت / Process finished
  }

  return true; // تابع إلى البلجن التالي / Continue to next plugin
}

// تصدير إعدادات اللعبة / Export game settings
module.exports = {
  name: "Tictactoe",
  priority: 10,
  process,
};