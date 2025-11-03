// Import necessary modules / استيراد الوحدات اللازمة
const {
  removeUser,
  getUser,
  isUserPlaying,
  updateUser,
  findDataByKey,
} = require("@tmpDB/suit");
const { sendMessageWithMention } = require("@lib/utils");
const config = require("@config");

// Delay helper function / دالة لتأخير التنفيذ لفترة محددة
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Function to determine the winner of Rock–Paper–Scissors
 * دالة لتحديد الفائز في لعبة حجر ورقة مقص
 * 
 * Rules / القواعد:
 * - Batu (حجر) يهزم Gunting (مقص)
 * - Gunting (مقص) يهزم Kertas (ورقة)
 * - Kertas (ورقة) تهزم Batu (حجر)
 */
function determineWinner(choice1, choice2) {
  if (choice1 === choice2) return "draw"; // Draw / تعادل

  const winningCombinations = {
    batu: "gunting",  // Rock beats Scissors / الحجر يهزم المقص
    gunting: "kertas", // Scissors beats Paper / المقص يهزم الورقة
    kertas: "batu",   // Paper beats Rock / الورقة تهزم الحجر
  };

  return winningCombinations[choice1] === choice2 ? "player1" : "player2";
}

// Main process function / الدالة الرئيسية لمعالجة الرسائل
async function process(sock, messageInfo) {
  const { fullText, message, sender, isGroup, senderType } = messageInfo;
  const { remoteJid } = messageInfo;

  // Retrieve current game data / الحصول على بيانات اللعبة الحالية
  let gameData = isGroup
    ? isUserPlaying(remoteJid)
      ? getUser(remoteJid)
      : null
    : findDataByKey({ player1: sender }) || findDataByKey({ player2: sender });

  if (!gameData) {
    return true; // Continue to the next plugin / المتابعة إلى الإضافة التالية
  }

  const { player1, player2, groupId, status, answer_player1, answer_player2 } =
    gameData;

  // Game invitation acceptance or rejection / قبول أو رفض الدعوة للعب
  if (!status && player2 === sender) {
    if (fullText.toLowerCase() === "terima") {
      updateUser(groupId, { status: true });

      return await sock.sendMessage(
        groupId,
        {
          text: `🎯 _Permainan dimulai!_\n\n_Silakan chat ke nomor bot dan kirimkan pesan *kertas, batu atau gunting*_\nwa.me/${config.phone_number_bot}\n\n🎯 _بدأت اللعبة!_\n\n_الرجاء مراسلة رقم البوت وإرسال أحد الكلمات:_ *kertas (ورقة)*، *batu (حجر)* أو *gunting (مقص)*`,
        },
        { quoted: message }
      );
    } else if (fullText.toLowerCase() === "tolak") {
      removeUser(groupId);

      return await sock.sendMessage(
        groupId,
        { text: `Permainan Suit dibatalkan karena tantangan ditolak.\n❌ تم إلغاء لعبة حجر ورقة مقص لأن التحدي تم رفضه.` },
        { quoted: message }
      );
    }
  }

  // If a player surrenders / إذا استسلم أحد اللاعبين
  if (fullText.toLowerCase().includes("nyerah")) {
    removeUser(groupId);
    return await sock.sendMessage(
      groupId,
      { text: `Permainan Suit berakhir karena salah satu pemain menyerah.\n🏳️ انتهت اللعبة لأن أحد اللاعبين استسلم.` },
      { quoted: message }
    );
  }

  // If a player chooses rock, paper, or scissors / عندما يختار اللاعب حجر أو ورقة أو مقص
  if (["batu", "kertas", "gunting"].includes(fullText.toLowerCase())) {
    const choice = fullText.toLowerCase();

    // Player 1’s choice / اختيار اللاعب الأول
    if (player1 === sender && !answer_player1) {
      updateUser(groupId, { answer_player1: choice });
      await delay(1000);
      await sock.sendMessage(sender, {
        text: `Pilihanmu (${choice}) telah diterima.\n✅ تم استلام اختيارك (${choice}).`,
      });
    } 
    // Player 2’s choice / اختيار اللاعب الثاني
    else if (player2 === sender && !answer_player2) {
      updateUser(groupId, { answer_player2: choice });
      await delay(3000);
      await sock.sendMessage(sender, {
        text: `Pilihanmu (${choice}) telah diterima.\n✅ تم استلام اختيارك (${choice}).`,
      });
    } else {
      return false;
    }

    // Check if both players have chosen / التحقق ما إذا كان كلا اللاعبين قد اختاروا
    const updatedGameData = getUser(groupId);
    if (
      updatedGameData &&
      updatedGameData.answer_player1 &&
      updatedGameData.answer_player2
    ) {
      const winner = determineWinner(
        updatedGameData.answer_player1,
        updatedGameData.answer_player2
      );
      const choicePlayer1 = updatedGameData.answer_player1 || "belum memilih"; // لم يختر بعد
      const choicePlayer2 = updatedGameData.answer_player2 || "belum memilih"; // لم يختر بعد

      let resultMessage;

      // Player 1 wins / اللاعب الأول فاز
      if (winner === "player1") {
        resultMessage = `🏆 Pemenang adalah @${
          updatedGameData.player1.split`@`[0]
        } 🎉\n\nPilihan:\n@${
          updatedGameData.player1.split`@`[0]
        } : ${choicePlayer1}\n@${
          updatedGameData.player2.split`@`[0]
        } : ${choicePlayer2}\n\n🏆 الفائز هو @${
          updatedGameData.player1.split`@`[0]
        } 🎉`;
      } 
      // Player 2 wins / اللاعب الثاني فاز
      else if (winner === "player2") {
        resultMessage = `🏆 Pemenang adalah @${
          updatedGameData.player2.split`@`[0]
        } 🎉\n\nPilihan:\n@${
          updatedGameData.player1.split`@`[0]
        } : ${choicePlayer1}\n@${
          updatedGameData.player2.split`@`[0]
        } : ${choicePlayer2}\n\n🏆 الفائز هو @${
          updatedGameData.player2.split`@`[0]
        } 🎉`;
      } 
      // Draw / تعادل
      else {
        resultMessage = `🤝 Hasilnya adalah seri!\n\nPilihan:\n@${
          updatedGameData.player1.split`@`[0]
        } : ${choicePlayer1}\n@${
          updatedGameData.player2.split`@`[0]
        } : ${choicePlayer2}\n\n🤝 النتيجة تعادل!`;
      }

      removeUser(groupId); // Remove game data / حذف بيانات اللعبة
      await delay(3000);
      await sendMessageWithMention(
        sock,
        groupId,
        resultMessage,
        message,
        senderType
      );
    }

    return false;
  }

  return true; // Continue to next plugin / المتابعة إلى الإضافة التالية
}

// Export the plugin / تصدير الإضافة
module.exports = {
  name: "Suit",     // Plugin name / اسم اللعبة
  priority: 9,      // Priority level / مستوى الأولوية
  process,          // Main process function / الدالة الرئيسية
};