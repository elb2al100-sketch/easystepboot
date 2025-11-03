// DONT EDIT / لا تقم بالتعديل
const CACHE_EXPIRATION_TIME = 10 * 60 * 1000; // 10 minutes = 10 * 60 * 1000 milliseconds / 10 دقائق = 10 * 60 * 1000 مللي ثانية
// DONT EDIT / لا تقم بالتعديل

class Cache {
    constructor(expirationTime) {
        this.cache = new Map(); // Map to store cached data / خريطة لتخزين البيانات المؤقتة
        this.expirationTime = expirationTime; // Expiration duration in milliseconds / مدة صلاحية البيانات بالمللي ثانية
    }

    // ✅ Add or update data in cache / إضافة أو تحديث البيانات في الكاش
    set(id, data) {
        const timestamp = Date.now(); // Current timestamp in milliseconds / الطابع الزمني الحالي بالمللي ثانية
        this.cache.set(id, { data, timestamp });
    }

    // ✅ Get data from cache with expiration check / جلب البيانات من الكاش مع التحقق من انتهاء الصلاحية
    get(id) {
        const entry = this.cache.get(id);
        if (entry) {
            const currentTime = Date.now();
            const age = currentTime - entry.timestamp;

            if (age > this.expirationTime) {
                return false; // Data expired / انتهت صلاحية البيانات
            }
            return entry; // Return object { data, timestamp } / إرجاع الكائن { data, timestamp }
        }
        return null; // If id not found / إذا لم يتم العثور على المفتاح
    }

    // ✅ Delete data from cache / حذف بيانات من الكاش
    delete(id) {
        return this.cache.delete(id);
    }

    // ✅ Check if id exists in cache / التحقق مما إذا كان المفتاح موجودًا في الكاش
    has(id) {
        return this.cache.has(id);
    }

    // ✅ Clear entire cache / مسح كامل الكاش
    clear() {
        this.cache.clear();
    }

    // ✅ Get all entries in cache (optional for debugging) / جلب كل البيانات المخزنة (اختياري للتصحيح)
    entries() {
        return Array.from(this.cache.entries()).map(([id, value]) => ({
            id,
            data: value.data,
            timestamp: value.timestamp,
        }));
    }

    // ✅ Get all keys in cache / جلب كل المفاتيح في الكاش
    keys() {
        return Array.from(this.cache.keys());
    }

    // ✅ Get size of cache / معرفة حجم الكاش
    size() {
        return this.cache.size;
    }
}

// ✅ Helper functions for external usage / دوال مساعدة للاستخدام الخارجي

// Check if cache exists for a specific id / التحقق من وجود البيانات لمفتاح معين
function checkCache(id) {
    return myCache.has(id);
}

// Get cache data by id / الحصول على البيانات من الكاش حسب المفتاح
function getCache(id) {
    return myCache.get(id);
}

// Delete cache by id / حذف البيانات من الكاش حسب المفتاح
function deleteCache(id) {
    myCache.delete(id);
}

// Create cache instance with defined expiration time / إنشاء نسخة من الكاش بمدة صلاحية محددة
const myCache = new Cache(CACHE_EXPIRATION_TIME);

// ✅ Export functions for external usage / تصدير الدوال لاستخدامها في مكان آخر
module.exports = {
    checkCache,            // Check if cache exists / التحقق من وجود البيانات
    getCache,              // Get cache data / الحصول على البيانات
    deleteCache,           // Delete cache / حذف البيانات
    setCache: myCache.set.bind(myCache), // Add/update cache / إضافة أو تحديث البيانات
    clearCache: myCache.clear.bind(myCache), // Clear cache / مسح الكاش
    sizeCache: myCache.size.bind(myCache), // Get cache size / معرفة حجم الكاش
    entriesCache: myCache.entries.bind(myCache) // Get all entries / الحصول على كل البيانات
};