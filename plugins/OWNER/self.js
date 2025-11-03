const { findGroup, updateGroup, addGroup, deleteGroup } = require("@lib/group");

async function handle(sock, messageInfo) {
    const { remoteJid, message, command } = messageInfo;

    try {
        // Get bot/group data for owner
        // جلب بيانات البوت/المجموعة للـ Owner
        const dataGroup = await findGroup('owner', true);

        const isSelf = dataGroup?.fitur?.self;

        // Variables for response text and update data
        // متغيرات للنص للرد وتحديث البيانات
        let responseText = "";
        let updateData = null;

        // Respond based on command
        // الرد بناءً على الأمر
        switch (command) {
            case "self":
                updateData = { fitur: { self: true } };
                responseText =
                    "_✅ Bot successfully set to Self. Bot can only be used by the Owner. To make it public, type_ *.public*.";
                if(isSelf){
                    responseText = '_ℹ️ Bot is already in Self mode._';
                }
                break;

            case "public":
                if (dataGroup) {
                    await deleteGroup('owner');
                } else {
                    responseText = '_ℹ️ Bot is already in Public mode._';
                    return await sock.sendMessage(remoteJid, { text: responseText }, { quoted: message });
                }
                updateData = { fitur: { public: false } };
                responseText = "_✅ Bot successfully set to Public mode._";
                break;

            default:
                responseText = "_⚠️ Command not recognized._";
        }

        // Update group data if needed
        // تحديث بيانات البوت إذا كان هناك تغيير
        if (updateData) {
            const dataGroup2 = await findGroup('owner');
            if (dataGroup2) {
                await updateGroup('owner', updateData);
            }
        }

        // Send response to the owner
        // إرسال الرد إلى الـ Owner
        await sock.sendMessage(remoteJid, { text: responseText }, { quoted: message });
    } catch (error) {
        // Handle errors
        // معالجة الأخطاء
        console.error(error.message);
        await sock.sendMessage(
            remoteJid,
            { text: "⚠️ An error occurred while processing the command. Please try again.\n\n⚠️ حدث خطأ أثناء معالجة الأمر. يرجى المحاولة مرة أخرى." },
            { quoted: message }
        );
    }
}

module.exports = {
    handle,
    Commands    : ["self", "public"],
    OnlyPremium : false,
    OnlyOwner   : true
};