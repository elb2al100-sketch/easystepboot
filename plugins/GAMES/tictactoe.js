const mess = require('@mess'); // Message templates / قوالب الرسائل
const { addUser, removeUser, getUser, isUserPlaying } = require("@tmpDB/tictactoe"); // Temporary DB / قاعدة بيانات مؤقتة
const TicTacToe = require("@games/tictactoe"); // TicTacToe class / كلاس لعبة إكس-أو

const WAKTU_GAMES   = 60; // 60 seconds waiting time / 60 ثانية وقت الانتظار

async function handle(sock, messageInfo) {
    const { remoteJid, message, sender, isGroup, command } = messageInfo;

    const groupOnlyMessage = { text: mess.game.isGroup }; // Message if not in a group / رسالة إذا لم يكن في مجموعة
    const waitingMessage = `Waiting for a partner (${WAKTU_GAMES} s)...\n\nType *${command}* to respond\nانتظار شريك (${WAKTU_GAMES} ث)\n\nاكتب *${command}* للانضمام`;
    const timeoutMessage = `⏳ Time's up! No opponent wants to play\n⏳ انتهى الوقت! لا يوجد منافس يرغب باللعب`;

    // ===== Check if the game is in a group / تحقق ما إذا كانت اللعبة في مجموعة =====
    if (!isGroup) {
        return sock.sendMessage(remoteJid, groupOnlyMessage, { quoted: message });
    }

    // ===== Check if user is already playing / تحقق ما إذا كان المستخدم يلعب بالفعل =====
    const isPlaying = isUserPlaying(remoteJid);
    if (isPlaying) {
        const currentGame = getUser(remoteJid);
        if (currentGame.state === 'PLAYING') return true;

        await sock.sendMessage(
            remoteJid,
            { text: mess.game.isPlaying }, // User already playing message / رسالة المستخدم يلعب بالفعل
            { quoted: message }
        );
        return true;
    }

    // ===== Add user to temporary DB / إضافة المستخدم للقاعدة المؤقتة =====
    addUser(remoteJid, {
        id_room: remoteJid,      // Room ID / معرف الغرفة
        playerX: sender,         // Player X / اللاعب X
        playerO: null,           // Player O / اللاعب O
        state: 'WAITING',        // Current state / الحالة الحالية
        game: new TicTacToe(sender, 'o'), // Initialize TicTacToe instance / إنشاء كائن لعبة XO
    });

    // ===== Set timer for waiting opponent / ضبط مؤقت انتظار الخصم =====
    setTimeout(async () => {
        if (isUserPlaying(remoteJid)) {
            const currentGame = getUser(remoteJid);
            if (currentGame.state === 'PLAYING') return true;

            removeUser(remoteJid); // Remove user if timeout / إزالة المستخدم إذا انتهى الوقت
            await sock.sendMessage(
                remoteJid,
                { text: timeoutMessage },
                { quoted: message }
            );
            return true;
        }
    }, WAKTU_GAMES * 1000);

    // ===== Send waiting message / إرسال رسالة انتظار =====
    await sock.sendMessage(
        remoteJid,
        { text: waitingMessage },
        { quoted: message }
    );
    return true;
}

module.exports = {
    handle,
    Commands: ["ttc", "ttt", "tictactoe"], // Commands / الأوامر
    OnlyPremium: false,
    OnlyOwner: false,
};