const axios = require('axios'); // HTTP client library | مكتبة للتعامل مع طلبات HTTP
const config = require("@config"); // Configuration file | ملف الإعدادات
const { logWithTime } = require("@lib/utils"); // Custom logger | دالة تسجيل مخصصة
const fs = require('fs'); // File system module | وحدة التعامل مع الملفات
const { Client } = require("ssh2"); // SSH client | مكتبة عميل SSH

// Paths to JSON files storing user and server data | مسارات ملفات JSON لتخزين بيانات المستخدم والخادم
const userDataPath = './database/additional/user_panel.json'; 
const serverDataPath = './database/additional/server_panel.json'; 

// Check if panel configuration is ready | التحقق من جاهزية إعدادات لوحة التحكم
function panelReady() {
  const { URL, KEY_APPLICATION, SERVER_EGG, id_location } = config.PANEL;
  return Boolean(URL && KEY_APPLICATION && SERVER_EGG && id_location);
}

/**
 * ============================
 * User Management
 * إدارة المستخدمين
 * ============================
 */
async function createUser(email, username, password, root_admin = false) {
    if (!email || !username || !password) {
        throw new Error('Email, username and password cannot be empty');
    }
    const apiUrl = `${config.PANEL.URL}/api/application/users`;
    const data = {
        email,
        username,
        first_name: username,
        last_name: username,
        password,
        root_admin
    };

    const headers = {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.PANEL.KEY_APPLICATION}`,
    };

    try {
        const response = await axios.post(apiUrl, data, { headers });
        return response.data;
    } catch (error) {
        throw error.response ? error.response.data : new Error('Internal Server Error');
    }
}

async function deleteUser(id_user) {
    const apiUrl = `${config.PANEL.URL}/api/application/users/${id_user}`;
    try {
        const response = await axios.delete(apiUrl, {
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${config.PANEL.KEY_APPLICATION}`,
            },
        });
        return response.status >= 200 && response.status < 300;
    } catch (error) {
        throw error.response ? error.response.data : new Error('Internal Server Error');
    }
}

async function listUser(page = 1) {
    const apiUrl = `${config.PANEL.URL}/api/application/users?page=${page}`;
    const headers = {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.PANEL.KEY_APPLICATION}`,
    };
    try {
        const response = await axios.get(apiUrl, { headers });
        return response.data;
    } catch (error) {
        throw error.response ? error.response.data : new Error('Internal Server Error');
    }
}

// Save all users into local JSON file | حفظ جميع المستخدمين في ملف JSON محلي
async function saveUser(filePath = userDataPath) {
    let allUsers = [];
    let currentPage = 1;
    let totalPages = 1;
    try {
        do {
            const result = await listUser(currentPage);
            if (result.data && result.data.length > 0) {
                allUsers = allUsers.concat(result.data);
                totalPages = result.meta.pagination.total_pages; // Total pages from metadata | إجمالي الصفحات من البيانات الوصفية
                currentPage++;
            } else break;
        } while (currentPage <= totalPages);

        fs.writeFileSync(filePath, JSON.stringify(allUsers, null, 2), 'utf-8');
        return allUsers.length; // Return total number of users saved | إعادة عدد المستخدمين المحفوظين
    } catch (error) {
        console.error("❌ Error saving users:", error.message);
        throw error;
    }
}

// Find a user by email in local JSON file | البحث عن مستخدم بواسطة البريد الإلكتروني في ملف JSON
async function findUserByEmail(email) {
    try {
        if (!fs.existsSync(userDataPath)) return null;
        const data = fs.readFileSync(userDataPath, 'utf-8');
        if (!data.trim()) return null; // Ensure data is not empty | التأكد من أن البيانات ليست فارغة
        const users = JSON.parse(data);
        return users.find(u => u.attributes.email === email) || null; // Adjust based on JSON structure | ضبط وفقًا لبنية JSON
    } catch (error) {
        console.error('Error finding user:', error.message);
        return null;
    }
}

/**
 * ============================
 * Server Management
 * إدارة الخوادم
 * ============================
 */
async function listServer(page = 1) {
    const url = `${config.PANEL.URL}/api/application/servers?page=${page}`;
    try {
        const response = await axios.get(url, {
            headers: {
                'Accept': 'application/json',
                'Authorization': `Bearer ${config.PANEL.KEY_APPLICATION}`
            }
        });
        return response.data;
    } catch (error) {
        throw error;
    }
}

// Save all servers into local JSON file | حفظ جميع الخوادم في ملف JSON محلي
async function saveServer(filePath = serverDataPath) {
    let allServer = [];
    let currentPage = 1;
    let totalPages = 1;
    try {
        do {
            const result = await listServer(currentPage);
            if (result.data && result.data.length > 0) {
                allServer = allServer.concat(result.data);
                totalPages = result.meta.pagination.total_pages;
                currentPage++;
            } else break;
        } while (currentPage <= totalPages);

        fs.writeFileSync(filePath, JSON.stringify(allServer, null, 2), 'utf-8');
        return allServer.length;
    } catch (error) {
        console.error("❌ Error saving servers:", error.message);
        throw error;
    }
}

async function createServer(name_server, id_panel, resource) {
    const apiUrl = `${config.PANEL.URL}/api/application/servers`;
    const data = {
        name: name_server,
        user: id_panel,
        egg: config.PANEL.SERVER_EGG,
        docker_image: 'ghcr.io/parkervcp/yolks:nodejs_18',
        startup: "if [[ -d .git ]] && [[ {{AUTO_UPDATE}} == \"1\" ]]; then git pull; fi; if [[ ! -z ${NODE_PACKAGES} ]]; then /usr/local/bin/npm install ${NODE_PACKAGES}; fi; if [[ ! -z ${UNNODE_PACKAGES} ]]; then /usr/local/bin/npm uninstall ${UNNODE_PACKAGES}; fi; if [ -f /home/container/package.json ]; then /usr/local/bin/npm install; fi; if [[ ! -z ${CUSTOM_ENVIRONMENT_VARIABLES} ]]; then vars=$(echo ${CUSTOM_ENVIRONMENT_VARIABLES} | tr \";\" \"\\n\"); for line in $vars; do export $line; done fi; /usr/local/bin/${CMD_RUN};",
        environment: {
            INST: 'npm',
            USER_UPLOAD: '0',
            AUTO_UPDATE: '0',
            CMD_RUN: 'npm start',
            JS_FILE: 'index.js',
            P_SERVER_ALLOCATION_LIMIT: '0'
        },
        limits: resource,
        feature_limits: { databases: 0, backups: 0, allocations: 0 },
        description: config.PANEL.description,
        deploy: { locations: [config.PANEL.id_location], dedicated_ip: false, port_range: ['0-1000000000'] },
        allocation: { default: 1 },
        start_on_completion: true,
        skip_scripts: false,
        oom_disabled: true
    };

    try {
        const response = await axios.post(apiUrl, data, {
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${config.PANEL.KEY_APPLICATION}`
            },
            withCredentials: true
        });
        return response.data;
    } catch (error) {
        throw error.response ? error.response.data : new Error('Internal Server Error');
    }
}

async function deleteServer(idserver) {
    const apiUrl = `${config.PANEL.URL}/api/application/servers/${idserver}/force`;
    try {
        const response = await axios.delete(apiUrl, {
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${config.PANEL.KEY_APPLICATION}`
            }
        });
        return response.status >= 200 && response.status < 300;
    } catch (error) {
        throw error.response ? error.response.data : new Error('Internal Server Error');
    }
}

async function UpdateUser(userId, email, username, newPassword) {
    const apiUrl = `${config.PANEL.URL}/api/application/users/${userId}`;
    const data = { email, username, first_name: username, last_name: username, language: "en", password: newPassword };
    try {
        const response = await axios.patch(apiUrl, data, {
            headers: { 'Accept': 'application/json', 'Content-Type': 'application/json', 'Authorization': `Bearer ${config.PANEL.KEY_APPLICATION}` },
            withCredentials: true
        });
        return response.data;
    } catch (error) {
        throw error.response ? error.response.data : 'Internal Server Error';
    }
}

async function getServerFilter(page, uuid) {
    const url = `${config.PANEL.URL}/api/application/servers?per_page=${page}&filter[uuid]=${uuid}`;
    try {
        const response = await axios.get(url, { headers: { 'Accept': 'application/json', 'Authorization': `Bearer ${config.PANEL.KEY_APPLICATION}` } });
        return response.data;
    } catch (error) {
        throw error;
    }
}

async function getServerByUUID(uuid) {
    const url = `${config.PANEL.URL}/api/application/servers?per_page=10&filter[uuid]=${uuid}`;
    try {
        const response = await axios.get