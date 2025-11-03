// Prayer intention data / بيانات نية الصلاة
const niatShalat = {
    subuh: {
        sendiri: `أُصَلِّى فَرْضَ الصُّبْح رَكَعتَيْنِ مُسْتَقْبِلَ الْقِبْلَةِ أَدَاءً لله تَعَالَى.

"Ushallii fardash-Shubhi rak’ataini mustaqbilal qiblati adaa’an lillaahi ta’aalaa."

Meaning / المعنى: I intend to perform the Subuh (Fajr) prayer, two raka’at, facing the Qibla, for Allah Ta’ala.`,
        makmum: `أُصَلِّى فَرْضَ الصُّبْح رَكَعتَيْنِ مُسْتَقْبِلَ الْقِبْلَةِ أَدَاءً (مَأْمُوْمًا/إِمَامًا) لله تَعَالَى.

"Ushallii fardhash-Shubhi rak’ataini mustaqbilal qiblati makmuuman lillaahi ta’aalaa."

Meaning / المعنى: I intend to perform the Subuh (Fajr) prayer, two raka’at, facing the Qibla, as a makmum, for Allah Ta’ala.`,
    },
    dzuhur : {
        sendiri: `أُصَلِّى فَرْضَ الظُّهْرِ أَرْبَعَ رَكَعَاتٍ مُسْتَقْبِلَ الْقِبْلَةِ أَدَاءً لِلَّهِ تَعَالَى

(Ushollii fardhodz dzuhri arba’a roka’aatin mustaqbilal qiblati adaa’an lillaahi ta’aalaa)

Meaning / المعنى: I intend to perform the Dzuhur prayer, four raka’at, facing the Qibla, for Allah Ta’ala.`,
        makmum: `أُصَلِّى فَرْضَ الظُّهْرِ أَرْبَعَ رَكَعَاتٍ مُسْتَقْبِلَ الْقِبْلَةِ أَدَاءً مَأْمُوْمًا لِلَّهِ تَعَالَى

(Ushollii fardhodz dzuhri arba’a roka’aatin mustaqbilal qiblati adaa’an ma’muuman lillaahi ta’aalaa)

Meaning / المعنى: I intend to perform the Dzuhur prayer, four raka’at, facing the Qibla, as a makmum, for Allah Ta’ala.`,
    },
    ashar : {
        sendiri: `أُصَلِّى فَرْضَ الْعَصْرِ أَرْبَعَ رَكَعَاتٍ مُسْتَقْبِلَ الْقِبْلَةِ أَدَاءً لِلَّهِ تَعَالَى

(Ushollii fardhol ‘ashri arba’a roka’aatin mustaqbilal qiblati adaa’an lillaahi ta’aalaa)

Meaning / المعنى: I intend to perform the Ashar prayer, four raka’at, facing the Qibla, for Allah Ta’ala.`,
        makmum: `أُصَلِّى فَرْضَ الْعَصْرِ أَرْبَعَ رَكَعَاتٍ مُسْتَقْبِلَ الْقِبْلَةِ أَدَاءً مَأْمُوْمًا لِلَّهِ تَعَالَى

(Ushollii fardhol ‘ashri arba’a roka’aatin mustaqbilal qiblati adaa’an ma’muuman lillaahi ta’aalaa)

Meaning / المعنى: I intend to perform the Ashar prayer, four raka’at, facing the Qibla, as a makmum, for Allah Ta’ala.`,
    },
    maghrib : {
        sendiri: `أُصَلِّى فَرْضَ الْمَغْرِبِ ثَلَاثَ رَكَعَاتٍ مُسْتَقْبِلَ الْقِبْلَةِ أَدَاءً لِلَّهِ تَعَالَى

(Ushollii fardhol maghribi tsalaatsa roka’aatin mustaqbilal qiblati adaa’an lillaahi ta’aalaa)

Meaning / المعنى: I intend to perform the Maghrib prayer, three raka’at, facing the Qibla, for Allah Ta’ala.`,
        makmum: `أُصَلِّى فَرْضَ الْمَغْرِبِ ثَلَاثَ رَكَعَاتٍ مُسْتَقْبِلَ الْقِبْلَةِ أَدَاءً مَأْمُوْمًا لِلَّهِ تَعَالَى

(Ushollii fardhol maghribi tsalaatsa roka’aatin mustaqbilal qiblati adaa’an ma’muuman lillaahi ta’aalaa)

Meaning / المعنى: I intend to perform the Maghrib prayer, three raka’at, facing the Qibla, as a makmum, for Allah Ta’ala.`,
    },
    isya : {
        sendiri: `أُصَلِّى فَرْضَ الْعِشَاءِ أَرْبَعَ رَكَعَاتٍ مُسْتَقْبِلَ الْقِبْلَةِ أَدَاءً لِلَّهِ تَعَالَى

(Ushollii fardhol ‘isyaa’i arba’a roka’aatin mustaqbilal qiblati adaa’an lillaahi ta’aalaa)

Meaning / المعنى: I intend to perform the Isya prayer, four raka’at, facing the Qibla, for Allah Ta’ala.`,
        makmum: `أُصَلِّى فَرْضَ الْعِشَاءِ أَرْبَعَ رَكَعَاتٍ مُسْتَقْبِلَ الْقِبْلَةِ أَدَاءً مَأْمُوْمًا لِلَّهِ تَعَالَى

(Ushollii fardhol ‘isyaa’i arba’a roka’aatin mustaqbilal qiblati adaa’an ma’muuman lillaahi ta’aalaa)

Meaning / المعنى: I intend to perform the Isya prayer, four raka’at, facing the Qibla, as a makmum, for Allah Ta’ala.`,
    }
};

// Function to get greeting and default prayer time / دالة للحصول على التحية ووقت الصلاة الافتراضي
function getGreeting() {
    const now = new Date();
    const utcHours = now.getUTCHours(); // UTC hour / الساعة UTC
    const wibHours = (utcHours + 7) % 24; // Convert to WIB / تحويل إلى توقيت WIB

    let greeting = '';
    let waktuShalat = '';
    let icon = ''; // Icon for greeting / أيقونة التحية

    if (wibHours >= 4 && wibHours < 12) {
        greeting = 'Good morning / صباح الخير!';
        waktuShalat = 'subuh';
        icon = '🌅';
    } else if (wibHours >= 12 && wibHours < 15) {
        greeting = 'Good afternoon / طاب يومك!';
        waktuShalat = 'dzuhur';
        icon = '☀️';
    } else if (wibHours >= 15 && wibHours < 18) {
        greeting = 'Good late afternoon / مساء الخير!';
        waktuShalat = 'ashar';
        icon = '🌇';
    } else if (wibHours >= 18 && wibHours < 19) {
        greeting = 'Good evening / مساء النور!';
        waktuShalat = 'maghrib';
        icon = '🌆';
    } else {
        greeting = 'Good night / مساء الخير!';
        waktuShalat = 'isya';
        icon = '🌙';
    }

    return { greeting: `${icon} ${greeting}`, waktuShalat };
}

// Handle command / معالجة الأمر
async function handle(sock, messageInfo) {
    const { remoteJid, message, content } = messageInfo;
    const { greeting, waktuShalat: defaultWaktuShalat } = getGreeting();

    let waktuShalat = defaultWaktuShalat;

    // Determine prayer time based on user input / تحديد وقت الصلاة حسب إدخال المستخدم
    if (content === 'subuh') waktuShalat = 'subuh';
    else if (content === 'dzuhur' || content === 'zuhur') waktuShalat = 'dzuhur';
    else if (content === 'ashar' || content === 'asar') waktuShalat = 'ashar';
    else if (content === 'maghrib' || content === 'magrib') waktuShalat = 'maghrib';
    else if (content === 'isya') waktuShalat = 'isya';

    const niat = niatShalat[waktuShalat];
    if (niat) {
        const pesan = `${greeting}\n\n_Here