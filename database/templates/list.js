// ===============================================
// 🧩 Function: applyTemplate
// 📜 Description: Apply a selected message template with user data
// 💬 الوصف: تطبيق قالب رسالة مختار باستخدام بيانات المستخدم
// ===============================================

function applyTemplate(templateIndex, data) {
    // ==========================================
    // 📚 Templates Array
    // 📚 مصفوفة القوالب
    // Each template defines a different style of formatted message
    // كل قالب يحدد تنسيقًا مختلفًا للرسائل أو القوائم
    // ==========================================
    const templates = [

        // ================= TEMPLATE 0 =================
        {
            name: "Default Template / القالب الافتراضي",
            isUppercase: false, // Keep letters as they are / إبقاء الأحرف كما هي
            sortList: false,    // Do not sort list / لا يتم ترتيب القائمة
            orderNumber: false, // No numbering / بدون ترقيم
            prefixSymbol: "-",  // Symbol before each item / الرمز قبل كل عنصر
            data: `
╭──「 𝙷𝙰𝙻𝙾 @name 」
│
│ 🏷️ Name / الاسم : @name
│ 👥 Group / المجموعة : @group
│ 📅 Date / التاريخ : @date
│ ⏰ Time / الوقت : @time
│
│ ✨ List / القائمة :
│ @list
╰──────────────────────────────
`
        },

        // ================= TEMPLATE 1 =================
        {
            name: "Classic Menu / القائمة الكلاسيكية",
            isUppercase: false, // Keep lowercase and uppercase / إبقاء الحروف كما هي
            sortList: false,    // Keep original order / الاحتفاظ بالترتيب الأصلي
            orderNumber: true,  // Add numbering / إضافة ترقيم
            prefixSymbol: "• ", // Symbol before each list item / رمز قبل كل عنصر
            data: `
╭──「 𝙷𝙴𝙻𝙻𝙾 @name 」
│ Group / المجموعة : @group
│ Date / التاريخ : @date
│ Time / الوقت : @time
│
│ 🧾 Menu / القائمة :
│ @list
╰──────────────────────────────
`
        },

        // ================= TEMPLATE 2 =================
        {
            name: "Shop Template / قالب المتجر",
            isUppercase: false,
            sortList: true, // Sort alphabetically / ترتيب أبجدي
            orderNumber: false,
            prefixSymbol: "- ",
            data: `
Halo @name / مرحبًا @name

Selamat Datang di grub @group
أهلاً وسهلاً بك في مجموعة @group

📆 Tanggal / التاريخ : @date
⏰ Jam / الوقت : @time

╭✄┈ BERIKUT DAFTAR LIST🍧 / القائمة أدناه
@list
╰──────────◇
Untuk Melihat List menu / لعرض قائمة الأوامر
Ketik / اكتب *teks* di atas
`
        },

        // ================= TEMPLATE 3 =================
        {
            name: "Simple Lines / خطوط بسيطة",
            isUppercase: false,
            sortList: false,
            orderNumber: true,
            prefixSymbol: "",
            data: `
🌸 @greeting @name! / 🌸 تحية طيبة @name!
Welcome to / مرحبًا بك في: @group
📅 Date / التاريخ: @date | ⏰ Time / الوقت: @time

Your list / قائمتك:
@list

Enjoy your experience! / استمتع بتجربتك!
`
        },

        // ================= TEMPLATE 4 =================
        {
            name: "Fancy Box / صندوق أنيق",
            isUppercase: true, // Convert to uppercase / تحويل النصوص إلى أحرف كبيرة
            sortList: true,    // Sort alphabetically / ترتيب أبجدي
            orderNumber: false,
            prefixSymbol: "◆ ",
            data: `
╔════════════════════════════╗
║ 🎀 HELLO @name 🎀
║ WELCOME TO @group
║ 📅 DATE: @date
║ ⏰ TIME: @time
╠════════════════════════════╣
║ 🌟 YOUR LIST 🌟 / قائمتك:
@list
╚════════════════════════════╝
`
        },

        // ================= TEMPLATE 5 =================
        {
            name: "Emoji Menu / قائمة الإيموجي",
            isUppercase: false,
            sortList: false,
            orderNumber: true,
            prefixSymbol: "👉 ",
            data: `
👋 Hi @name / مرحبًا @name
You're in / أنت في: @group

🗓️ Date / التاريخ: @date
🕒 Time / الوقت: @time

Here’s your menu / هذه قائمتك:
@list

Enjoy your time! / استمتع بوقتك!
`
        },

        // ================= TEMPLATE 6 =================
        {
            name: "Bot Commands / أوامر البوت",
            isUppercase: false,
            sortList: true, // Alphabetical / أبجدي
            orderNumber: false,
            prefixSymbol: "⚙️ ",
            data: `
🤖 BOT COMMANDS / أوامر البوت

👤 User / المستخدم: @name
💬 Group / المجموعة: @group
📅 Date / التاريخ: @date
⏰ Time / الوقت: @time

@list

Type *help* for more info / اكتب *help* للمزيد من المعلومات.
`
        },

        // ================= TEMPLATE 7 =================
        {
            name: "Elegant Divider / الفاصل الأنيق",
            isUppercase: false,
            sortList: false,
            orderNumber: true,
            prefixSymbol: "• ",
            data: `
───────────────
🌼 Hello @name / مرحبًا @name
───────────────
🏷️ Group / المجموعة: @group
📆 Date / التاريخ: @date
⏰ Time / الوقت: @time

Your List / قائمتك:
@list
───────────────
`
        },

        // ================= TEMPLATE 8 =================
        {
            name: "Dark Mode / النمط الداكن",
            isUppercase: true, // Uppercase text / النص بالأحرف الكبيرة
            sortList: false,
            orderNumber: false,
            prefixSymbol: "★ ",
            data: `
⬛ DARK MODE MENU ⬛ / قائمة النمط الداكن

HELLO / مرحبًا: @name
GROUP / المجموعة: @group
DATE / التاريخ: @date
TIME / الوقت: @time

LIST / القائمة:
@list

ENJOY NIGHT MODE / استمتع بالنمط الليلي 🌙
`
        }
    ];

    // ==========================================
    // ⚙️ Process Template / معالجة القالب
    // ==========================================

    // Select the template / اختيار القالب
    const template = templates[templateIndex];
    if (!template) return 'Template not found / القالب غير موجود.';

    // Prepare the list / تجهيز القائمة
    let list = data.list || [];

    // Sort alphabetically if required / ترتيب أبجدي عند الحاجة
    if (template.sortList) list = list.sort();

    // Convert list items to uppercase if required / تحويل العناصر إلى أحرف كبيرة
    if (template.isUppercase) list = list.map(i => i.toUpperCase());

    // Add numbering if required / إضافة أرقام تسلسلية عند الحاجة
    if (template.orderNumber) {
        list = list.map((i, idx) => `${idx + 1}. ${template.prefixSymbol}${i}`);
    } else {
        list = list.map(i => `${template.prefixSymbol}${i}`);
    }

    // Join list items / دمج عناصر القائمة في نص واحد
    const formattedList = list.join('\n');

    // Replace placeholders in the template / استبدال العلامات في القالب بالقيم الفعلية
    let result = template.data
        .replace(/@name/g, data.name || '')
        .replace(/@group/g, data.group || '')
        .replace(/@greeting/g, data.greeting || '')
        .replace(/@date/g, data.date || '')
        .replace(/@time/g, data.time || '')
        .replace(/@day/g, data.day || '')
        .replace(/@list/g, formattedList);

    // Return the final formatted text / إرجاع النص النهائي المنسق
    return result;
}