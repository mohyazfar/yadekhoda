// ============================================
// config.js - تنظیمات اصلی برنامه
// ============================================

export const CONFIG = {
    APP_NAME: 'یاد خدا',
    VERSION: '1.0.0',
    STORAGE_KEYS: {
        COUNTER: 'counter',
        VIBRATE: 'vibrate',
        VIBRATION_PATTERN: 'vibrationPattern',
        COLOR_THEME: 'colorTheme',
        THEME_MODE: 'themeMode',
        FAVORITE_IDS: 'favoriteIds',
        ZEKR_LIST: 'zekrList'
    }
};

export const WEEK_ZEKR = [
    { text: "يَا ذَا الْجَلَالِ وَالْإِكْرَامِ", meaning: "ای صاحب شکوه و بزرگواری", target: 100 },
    { text: "يَا قَاضِيَ الْحَاجَاتِ", meaning: "ای برآورنده حاجت‌ها", target: 100 },
    { text: "يَا أَرْحَمَ الرَّاحِمِينَ", meaning: "ای مهربان‌ترین مهربانان", target: 100 },
    { text: "يَا حَيُّ يَا قَيُّومُ", meaning: "ای زنده و ای پاینده", target: 100 },
    { text: "لَا إِلٰهَ إِلَّا اللَّهُ الْمَلِكُ الْحَقُّ الْمُبِينُ", meaning: "هیچ معبودی جز خداوند، فرمانروای حق و آشکار نیست", target: 100 },
    { text: "اللَّهُمَّ صَلِّ عَلَىٰ مُحَمَّدٍ وَآلِ مُحَمَّدٍ", meaning: "خدایا بر محمد و خاندان محمد درود فرست", target: 100 },
    { text: "يَا رَبَّ الْعَالَمِينَ", meaning: "ای پروردگار جهانیان", target: 100 }
];

export const WEEK_NAMES = ["یکشنبه", "دوشنبه", "سه‌شنبه", "چهارشنبه", "پنجشنبه", "جمعه", "شنبه"];

// ===== الگوهای ویبره =====
export const VIBRATION_PATTERNS = [
    { id: 0, name: "ضربان قلب", icon: "🫀", pattern: [30, 50, 30, 50, 30, 80] },
    { id: 1, name: "تپش ملایم", icon: "💓", pattern: [15, 30, 15, 30, 15, 30] },
    { id: 2, name: "تپش قوی", icon: "💪", pattern: [50, 80, 50, 80, 50, 100] },
    { id: 3, name: "یکنواخت", icon: "〰️", pattern: [100] },
    { id: 4, name: "سوسو زن", icon: "⚡", pattern: [20, 100, 20, 100, 20, 100] },
    { id: 5, name: "سه ضرب", icon: "🔔", pattern: [30, 50, 30, 50, 30, 50] }
];