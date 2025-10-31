// DONT EDIT / لا تعدل
const CACHE_EXPIRATION_TIME = 10 * 60 * 1000; // 10 minutes = 10 * 60 * 1000 milliseconds / 10 دقائق = 10 * 60 * 1000 ميلي ثانية
// DONT EDIT / لا تعدل

/**
 * 🇬🇧 Cache class to store data with expiration
 * 🇸🇦 فئة Cache لتخزين البيانات مع صلاحية محددة
 */
class Cache {
    constructor(expirationTime) {
        this.cache = new Map(); // 🇬🇧 Store cached data / 🇸🇦 تخزين البيانات المؤقتة
        this.expirationTime = expirationTime; // 🇬🇧 Expiration duration in milliseconds / 🇸🇦 مدة الصلاحية بالميلي ثانية
    }

    /**
     * 🇬🇧 Add or update data in cache
     * 🇸🇦 إضافة أو تحديث البيانات في الكاش
     */
    set(id, data) {
        const timestamp = Date.now(); // 🇬🇧 Current timestamp / 🇸🇦 الطابع الزمني الحالي
        this.cache.set(id, { data, timestamp });
    }

    /**
     * 🇬🇧 Get data from cache with expiration check
     * 🇸🇦 جلب البيانات من الكاش مع التحقق من الصلاحية
     */
    get(id) {
        const entry = this.cache.get(id);
        if (entry) {
            const currentTime = Date.now();
            const age = currentTime - entry.timestamp;

            if (age > this.expirationTime) {
                return false; // 🇬🇧 Data expired / 🇸🇦 انتهت صلاحية البيانات
            }
            return entry; // 🇬🇧 Return object { data, timestamp } / 🇸🇦 إرجاع الكائن { data, timestamp }
        }
        return null; // 🇬🇧 ID not found / 🇸🇦 لم يتم العثور على المعرف
    }

    /**
     * 🇬🇧 Delete data from cache
     * 🇸🇦 حذف البيانات من الكاش
     */
    delete(id) {
        return this.cache.delete(id);
    }

    /**
     * 🇬🇧 Check if id exists in cache
     * 🇸🇦 التحقق إذا كان المعرف موجود في الكاش
     */
    has(id) {
        return this.cache.has(id);
    }

    /**
     * 🇬🇧 Clear all cache
     * 🇸🇦 مسح كامل الكاش
     */
    clear() {
        this.cache.clear();
    }

    /**
     * 🇬🇧 Get all entries (useful for debugging)
     * 🇸🇦 الحصول على جميع البيانات (مفيد للتصحيح)
     */
    entries() {
        return Array.from(this.cache.entries()).map(([id, value]) => ({
            id,
            data: value.data,
            timestamp: value.timestamp,
        }));
    }

    /**
     * 🇬🇧 Get all IDs in cache
     * 🇸🇦 الحصول على جميع المعرفات في الكاش
     */
    keys() {
        return Array.from(this.cache.keys());
    }

    /**
     * 🇬🇧 Get cache size
     * 🇸🇦 الحصول على حجم الكاش
     */
    size() {
        return this.cache.size;
    }
}

// 🇬🇧 Helper functions / 🇸🇦 وظائف مساعدة
function checkCache(id) {
    return myCache.has(id);
}

function getCache(id) {
    return myCache.get(id);
}

function deleteCache(id) {
    myCache.delete(id);
}

// 🇬🇧 Create cache instance with expiration time / 🇸🇦 إنشاء نسخة من الكاش مع مدة صلاحية محددة
const myCache = new Cache(CACHE_EXPIRATION_TIME);

// 🇬🇧 Export functions for external use / 🇸🇦 تصدير الوظائف للاستخدام الخارجي
module.exports = {
    checkCache,
    getCache,
    deleteCache,
    setCache: myCache.set.bind(myCache),
    clearCache: myCache.clear.bind(myCache),
    sizeCache: myCache.size.bind(myCache),
    entriesCache: myCache.entries.bind(myCache)
};