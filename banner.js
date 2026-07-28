// ============================================
// banner.js - مدیریت بنر هدر
// ============================================

const WEEK_ZEKR_BANNER = [
    { text: "يَا ذَا الْجَلَالِ وَالْإِكْرَامِ", source: "ذکر امروز" },
    { text: "يَا قَاضِيَ الْحَاجَاتِ", source: "ذکر امروز" },
    { text: "يَا أَرْحَمَ الرَّاحِمِينَ", source: "ذکر امروز" },
    { text: "يَا حَيُّ يَا قَيُّومُ", source: "ذکر امروز" },
    { text: "لَا إِلٰهَ إِلَّا اللَّهُ الْمَلِكُ الْحَقُّ الْمُبِينُ", source: "ذکر امروز" },
    { text: "اللَّهُمَّ صَلِّ عَلَىٰ مُحَمَّدٍ وَآلِ مُحَمَّدٍ", source: "ذکر امروز" },
    { text: "يَا رَبَّ الْعَالَمِينَ", source: "ذکر امروز" }
];

// تعداد ثابت برای تمام ذکرها
const DEFAULT_TARGET = 100;

/**
 * مقداردهی اولیه بنر هدر
 * ذکر روز را بر اساس روز هفته نمایش میدهد
 */
export function initBanner() {
    setDailyZekr();
}

/**
 * تنظیم ذکر روز در هدر
 * بر اساس روز جاری هفته (0=یکشنبه, 6=شنبه)
 */
function setDailyZekr() {
    const day = new Date().getDay();
    const info = WEEK_ZEKR_BANNER[day] || WEEK_ZEKR_BANNER[0];
    
    const headerContent = document.getElementById('headerZekrContent');
    const headerLabel = document.getElementById('headerLabel');
    const headerCount = document.getElementById('headerCount');
    
    if (headerContent) {
        headerContent.textContent = info.text;
    }
    if (headerLabel) {
        headerLabel.textContent = "ذکر امروز";
    }
    if (headerCount) {
        headerCount.textContent = "تعداد: " + DEFAULT_TARGET;
    }
}

/**
 * به‌روزرسانی دستی بنر هدر
 * @param {string} text - متن ذکر جدید
 * @param {number} target - تعداد هدف (پیش‌فرض: 100)
 */
export function updateBannerZekr(text, target = DEFAULT_TARGET) {
    const headerContent = document.getElementById('headerZekrContent');
    const headerCount = document.getElementById('headerCount');
    
    if (headerContent) {
        headerContent.textContent = text;
    }
    if (headerCount) {
        headerCount.textContent = "تعداد: " + target;
    }
}

/**
 * دریافت ذکر امروز
 * @returns {Object} - شیء شامل text و source
 */
export function getTodayZekr() {
    const day = new Date().getDay();
    return WEEK_ZEKR_BANNER[day] || WEEK_ZEKR_BANNER[0];
}

/**
 * دریافت تعداد پیش‌فرض
 * @returns {number} - 100
 */
export function getDefaultTarget() {
    return DEFAULT_TARGET;
}