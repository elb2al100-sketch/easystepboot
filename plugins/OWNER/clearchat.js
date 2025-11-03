const { delay } = require("@lib/utils");

// Main function
const clearAllChats = async (sock) => {
    try {
        const chats = Object.keys(sock.chats); // Get all chat JIDs

        for (const jid of chats) {
            // 1. Clear chat messages | مسح محتوى الرسائل
            await sock.chatModify(
                {
                    clear: { type: 'all' }
                },
                jid
            );

            // Wait a bit to avoid rate limit | انتظر قليلاً لتجنب تجاوز الحد
            await delay(300); // delay 300ms

            // 2. Delete chat from list | حذف الدردشة من القائمة
            await sock.chatModify(
                {
                    delete: true
                },
                jid
            );

            console.log(`✅ Chat ${jid} cleared & deleted | تم مسح وحذف الدردشة`);
        }
    } catch (err) {
        console.error('❌ Failed to clear all chats | فشل في مسح جميع الدردشات:', err);
    }
};

async function handle(sock, messageInfo) {
    const { remoteJid } = messageInfo;

    await sock.sendMessage(remoteJid, { text: '⏳ Clearing all chats... | جارٍ مسح جميع الدردشات...' });
    await clearAllChats(sock);
    await sock.sendMessage(remoteJid, { text: '✅ All chats successfully deleted! | تم حذف جميع الدردشات بنجاح!' });
}

module.exports = {
    handle,
    Commands: ['clearchat'],
    OnlyPremium: false,
    OnlyOwner: true
};