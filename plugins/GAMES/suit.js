const mess = require("@mess"); // Message templates / قوالب الرسائل
const { addUser, removeUser, getUser, isUserPlaying } = require("@tmpDB/suit"); // Temporary game DB / قاعدة بيانات مؤقتة للعبة
const { sendMessageWithMention } = require("@lib/utils"); // Utility to send message with @mention / إرسال رسالة مع الإشارة

const WAKTU_GAMES = 60; // 60 seconds / 60 ثانية

// ===== START GAME FUNCTION / دالة بدء اللعبة =====
async function startGame(sock, remoteJid, player1, player2, message, senderType) {
  // Add game to temporary DB / إضافة اللعبة للقاعدة المؤقتة
  addUser(remoteJid, {
    status: false, // Not yet started / لم تبدأ بعد
    player1,
    player2,
    answer_player1: null,
    answer_player2: null,
    hadiah: 10, // Reward / الجائزة
    groupId: remoteJid,
  });

  const gameQuestion = `_*SUIT PvP*_\n\n@${player1.split`@`[0]} challenges @${
    player2.split`@`[0]
  } to a suit game.\n\nPlease @${
    player2.split`@`[0]
  } type *accept* or *decline* within ${WAKTU_GAMES}s / يرجى من @${
    player2.split`@`[0]
  } كتابة *accept* للقبول أو *decline* للرفض خلال ${WAKTU_GAMES} ثانية`;

  await sendMessageWithMention(sock, remoteJid, gameQuestion, message, senderType);

  // Timer to cancel if no response / مؤقت لإلغاء اللعبة إذا لم يرد اللاعب
  setTimeout(async () => {
    if (isUserPlaying(remoteJid)) {
      removeUser(remoteJid);
      await sock.sendMessage(
        remoteJid,
        { text: "Time's up! Suit cancelled / انتهى الوقت! تم إلغاء اللعبة." },
        { quoted: message }
      );
    }
  }, WAKTU_GAMES * 1000); // 60 seconds / 60 ثانية
}

// ===== MAIN HANDLE FUNCTION / الدالة الرئيسية =====
async function handle(sock, messageInfo) {
  const { remoteJid, message, sender, mentionedJid, senderType } = messageInfo;

  // Check if game is already running / التحقق من وجود لعبة نشطة
  if (isUserPlaying(remoteJid)) {
    return await sock.sendMessage(remoteJid, { text: mess.game.isPlaying }, { quoted: message });
  }

  // Check if opponent is mentioned / التحقق من تحديد اللاعب الآخر
  if (!mentionedJid || mentionedJid.length === 0) {
    return await sendMessageWithMention(
      sock,
      remoteJid,
      `_Who do you want to challenge? / من تريد أن تتحدى؟_\nTag the person / ضع إشارة للشخص.\n\nExample: suit @${
        sender.split`@`[0]
      }`,
      message,
      senderType
    );
  }

  const player1 = sender;
  const player2 = mentionedJid[0];

  // Prevent challenging yourself / منع تحدي نفسك
  if (player1 === player2) {
    return await sock.sendMessage(remoteJid, { text: "You cannot challenge yourself / لا يمكنك تحدي نفسك!" }, { quoted: message });
  }

  // Start the game / بدء اللعبة
  await startGame(sock, remoteJid, player1, player2, message, senderType);
}

// ===== EXPORT MODULE / تصدير الموديول =====
module.exports = {
  handle,
  Commands: ["suit"], // Command / الأمر
  OnlyPremium: false,
  OnlyOwner: false,
};