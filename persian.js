// ============================================
// persian.js - توابع تبدیل به فارسی (نسخه اصلاح‌شده)
// ============================================

const PERSIAN_DIGITS = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];

// ===== کش برای تاریخ‌های شمسی =====
const dateCache = new Map();

export function toPersianNumber(num) {
    try {
        return String(num).split("").map(d => PERSIAN_DIGITS[parseInt(d)] || d).join("");
    } catch (e) {
        return String(num);
    }
}

export function toPersianDate(date) {
    try {
        const cacheKey = date.getTime();
        if (dateCache.has(cacheKey)) {
            return dateCache.get(cacheKey);
        }
        
        const result = new Intl.DateTimeFormat('fa-IR', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        }).format(date);
        
        dateCache.set(cacheKey, result);
        return result;
    } catch (e) {
        return date.toLocaleDateString('fa-IR');
    }
}

export function toPersianDateFull(date) {
    try {
        return new Intl.DateTimeFormat('fa-IR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            weekday: 'long'
        }).format(date);
    } catch (e) {
        return date.toLocaleDateString('fa-IR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            weekday: 'long'
        });
    }
}

export function toPersianTime(date) {
    try {
        return new Intl.DateTimeFormat('fa-IR', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        }).format(date);
    } catch (e) {
        return date.toLocaleTimeString('fa-IR');
    }
}

export function toPersianDateTime(date) {
    try {
        return new Intl.DateTimeFormat('fa-IR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }).format(date);
    } catch (e) {
        return date.toLocaleString('fa-IR');
    }
}

export function getPersianWeekday(date) {
    try {
        const weekdays = ['شنبه', 'یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنجشنبه', 'جمعه'];
        const dayIndex = date.getDay();
        const adjustedIndex = (dayIndex + 1) % 7;
        return weekdays[adjustedIndex];
    } catch (e) {
        return '';
    }
}

export function getPersianMonth(date) {
    try {
        return new Intl.DateTimeFormat('fa-IR', { month: 'long' }).format(date);
    } catch (e) {
        const months = ['فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور', 
                        'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'];
        return months[date.getMonth()];
    }
}

export function toJalaali(gy, gm, gd) {
    try {
        const date = new Date(gy, gm - 1, gd);
        const persian = new Intl.DateTimeFormat('fa-IR', {
            year: 'numeric',
            month: 'numeric',
            day: 'numeric'
        }).formatToParts(date);
        
        let jy = '', jm = '', jd = '';
        for (const part of persian) {
            if (part.type === 'year') jy = part.value;
            if (part.type === 'month') jm = part.value;
            if (part.type === 'day') jd = part.value;
        }
        
        return { jy: parseInt(jy), jm: parseInt(jm), jd: parseInt(jd) };
    } catch (e) {
        return { jy: gy, jm: gm, jd: gd };
    }
}

export function toPersianNumberWithCommas(num) {
    try {
        const parts = String(num).split('.');
        parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
        return toPersianNumber(parts.join('.'));
    } catch (e) {
        return toPersianNumber(num);
    }
}

export function toEnglishNumber(persianStr) {
    try {
        const map = { '۰': '0', '۱': '1', '۲': '2', '۳': '3', '۴': '4', '۵': '5', '۶': '6', '۷': '7', '۸': '8', '۹': '9' };
        return persianStr.replace(/[۰-۹]/g, d => map[d] || d);
    } catch (e) {
        return persianStr;
    }
}

export function isPersianDate(str) {
    return /^[۰-۹]{4}[\/\-][۰-۹]{2}[\/\-][۰-۹]{2}$/.test(str);
}

export function getTodayPersian() {
    const now = new Date();
    const weekday = getPersianWeekday(now);
    const date = toPersianDate(now);
    return `${weekday} ${date}`;
}

export function getTodayPersianFull() {
    const now = new Date();
    return toPersianDateFull(now);
}

export function clearDateCache() {
    dateCache.clear();
}