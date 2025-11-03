const { findGroup } = require("@lib/group");
const { logWithTime, logTracking } = require('@lib/utils');

async function process(sock, messageInfo) {
    const { remoteJid, command } = messageInfo;

    try {
        // [EN] Fetch group data from database
        // [AR] جلب بيانات المجموعة من قاعدة البيانات
        const dataMute = await findGroup(remoteJid);

        if (dataMute) {
            const { fitur } = dataMute;

            // [EN] Debug command to show mute status
            // [AR] أمر للتصحيح لعرض حالة كتم الصوت
            if (command === 'debug') {
                console.log(`Mute Status: ${fitur.mute ? 'Active' : 'Inactive'}`);
            }

            // [EN] If mute feature is active
            // [AR] إذا كانت ميزة الكتم مفعلة
            if (fitur.mute) {
                // [EN] Ignore commands except 'unmute'
                // [AR] تجاهل الأوامر إلا إذا كانت 'unmute'
                if(command != 'unmute') {
                    logWithTime('System',`GROUP IS MUTED`);
                    logTracking(`HANDLER - GROUP IS MUTED (${command})`);
                    return false; // [EN] Stop processing
                    // [AR] إيقاف التنفيذ
                }
            }
        } 
    } catch (error) {
        // [EN] Log any errors during mute processing
        // [AR] تسجيل أي خطأ يحدث أثناء معالجة الكتم
        console.error("Error in Mute process:", error.message);
    }

    return true; // [EN] Continue to next plugin
    // [AR] متابعة للملحق التالي
}

module.exports = {
    name        : "Mute",
    priority    : 1,
    process
};