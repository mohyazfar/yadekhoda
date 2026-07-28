// ============================================
// stats-data.js - مدیریت داده‌های گزارش عملکرد (اصلاح‌شده)
// ============================================

import { getZekrList } from './zekr-manager.js';
import { getStorage, setStorage } from '../utils/storage.js';
import { toPersianDate, toJalaali } from '../utils/persian.js';

// ===== کلیدهای ذخیره‌سازی =====
const STORAGE_KEYS = {
    DAILY_LOGS: 'daily_logs',
    STREAK: 'streak',
    LAST_DATE: 'last_date',
    MONTHLY_TOTAL: 'monthly_total'
};

// ===== دریافت تاریخ شمسی امروز =====
export function getTodayKey() {
    const now = new Date();
    const persian = toPersianDate(now);
    return persian.replace(/\//g, '_');
}

// ===== دریافت تاریخ شمسی یک روز مشخص =====
export function getDateKey(date) {
    const persian = toPersianDate(date);
    return persian.replace(/\//g, '_');
}

// ===== دریافت نام روز هفته شمسی =====
export function getPersianWeekday(date) {
    const days = ['شنبه', 'یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنجشنبه', 'جمعه'];
    const dayIndex = date.getDay();
    const adjustedIndex = (dayIndex + 1) % 7;
    return days[adjustedIndex];
}

// ===== دریافت نام ماه شمسی =====
export function getPersianMonthName(date) {
    const months = ['فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور', 
                    'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'];
    const jalaali = toJalaali(date.getFullYear(), date.getMonth() + 1, date.getDate());
    return months[jalaali.jm - 1];
}

// ===== دریافت شروع هفته (شنبه) =====
export function getWeekStart(date) {
    const d = new Date(date);
    const day = d.getDay();
    const diff = (day === 6) ? 0 : (day + 1);
    d.setDate(d.getDate() - diff);
    d.setHours(0, 0, 0, 0);
    return d;
}

// ===== دریافت تمام روزهای یک هفته =====
export function getWeekDays(date) {
    const start = getWeekStart(date);
    const days = [];
    for (let i = 0; i < 7; i++) {
        const d = new Date(start);
        d.setDate(d.getDate() + i);
        days.push(d);
    }
    return days;
}

// ===== دریافت گزارش روزانه =====
export async function getDailyLog(dateKey) {
    const logs = await getStorage(STORAGE_KEYS.DAILY_LOGS, {});
    return logs[dateKey] || { total: 0, freeTotal: 0, zekrs: {} };
}

// ===== ذخیره گزارش روزانه =====
export async function saveDailyLog(dateKey, log) {
    const logs = await getStorage(STORAGE_KEYS.DAILY_LOGS, {});
    logs[dateKey] = log;
    await setStorage(STORAGE_KEYS.DAILY_LOGS, logs);
}

// ===== ثبت یک ذکر در گزارش روزانه =====
export async function logZekr(text, count = 1) {
    const todayKey = getTodayKey();
    const log = await getDailyLog(todayKey);
    
    if (!log.zekrs[text]) {
        log.zekrs[text] = 0;
    }
    log.zekrs[text] += count;
    log.total += count;
    
    await saveDailyLog(todayKey, log);
    await updateStreak();
    await updateMonthlyTotal();
}

// ===== ثبت ذکر آزاد =====
export async function logFreeZekr(count = 1) {
    const todayKey = getTodayKey();
    const log = await getDailyLog(todayKey);
    
    log.freeTotal = (log.freeTotal || 0) + count;
    log.total = (log.total || 0) + count;
    
    await saveDailyLog(todayKey, log);
    await updateStreak();
    await updateMonthlyTotal();
}

// ===== دریافت مجموع یک بازه =====
export async function getTotalForPeriod(startDate, endDate) {
    const logs = await getStorage(STORAGE_KEYS.DAILY_LOGS, {});
    let total = 0;
    const current = new Date(startDate);
    
    while (current <= endDate) {
        const key = getDateKey(current);
        if (logs[key]) {
            total += logs[key].total || 0;
        }
        current.setDate(current.getDate() + 1);
    }
    return total;
}

// ===== دریافت مجموع ذکر آزاد یک بازه =====
export async function getFreeTotalForPeriod(startDate, endDate) {
    const logs = await getStorage(STORAGE_KEYS.DAILY_LOGS, {});
    let total = 0;
    const current = new Date(startDate);
    
    while (current <= endDate) {
        const key = getDateKey(current);
        if (logs[key]) {
            total += logs[key].freeTotal || 0;
        }
        current.setDate(current.getDate() + 1);
    }
    return total;
}

// ===== دریافت داده‌های نمودار هفتگی =====
export async function getWeeklyData(date) {
    const weekDays = getWeekDays(date);
    const data = [];
    
    for (const d of weekDays) {
        const key = getDateKey(d);
        const log = await getDailyLog(key);
        data.push({
            date: d,
            label: getPersianWeekday(d).slice(0, 2),
            total: log.total || 0,
            freeTotal: log.freeTotal || 0,
            key: key
        });
    }
    return data;
}

// ===== دریافت سهم ذکرها از یک بازه =====
export async function getZekrShares(startDate, endDate) {
    const logs = await getStorage(STORAGE_KEYS.DAILY_LOGS, {});
    const shares = {};
    const zekrList = getZekrList();
    const activeZekrs = new Set(zekrList.map(z => z.text));
    
    const current = new Date(startDate);
    while (current <= endDate) {
        const key = getDateKey(current);
        if (logs[key]) {
            for (const [text, count] of Object.entries(logs[key].zekrs || {})) {
                if (!shares[text]) {
                    shares[text] = { count: 0, deleted: !activeZekrs.has(text) };
                }
                shares[text].count += count;
            }
        }
        current.setDate(current.getDate() + 1);
    }
    return shares;
}

// ===== به‌روزرسانی روزهای پیاپی =====
async function updateStreak() {
    const todayKey = getTodayKey();
    const logs = await getStorage(STORAGE_KEYS.DAILY_LOGS, {});
    let streak = 0;
    const d = new Date();
    
    while (true) {
        const key = getDateKey(d);
        if (logs[key] && logs[key].total > 0) {
            streak++;
            d.setDate(d.getDate() - 1);
        } else {
            break;
        }
    }
    
    await setStorage(STORAGE_KEYS.STREAK, streak);
    await setStorage(STORAGE_KEYS.LAST_DATE, todayKey);
}

// ===== دریافت روزهای پیاپی =====
export async function getStreak() {
    return await getStorage(STORAGE_KEYS.STREAK, 0);
}

// ===== به‌روزرسانی مجموع ماهانه =====
async function updateMonthlyTotal() {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const total = await getTotalForPeriod(startOfMonth, now);
    const monthKey = `${now.getFullYear()}_${String(now.getMonth() + 1).padStart(2, '0')}`;
    await setStorage(STORAGE_KEYS.MONTHLY_TOTAL + '_' + monthKey, total);
}

// ===== دریافت مجموع ماهانه =====
export async function getMonthlyTotal() {
    const now = new Date();
    const monthKey = `${now.getFullYear()}_${String(now.getMonth() + 1).padStart(2, '0')}`;
    return await getStorage(STORAGE_KEYS.MONTHLY_TOTAL + '_' + monthKey, 0);
}

// ===== حذف گزارش بر اساس بازه =====
export async function deleteLogs(startDate, endDate) {
    const logs = await getStorage(STORAGE_KEYS.DAILY_LOGS, {});
    const current = new Date(startDate);
    let deleted = 0;
    
    while (current <= endDate) {
        const key = getDateKey(current);
        if (logs[key]) {
            delete logs[key];
            deleted++;
        }
        current.setDate(current.getDate() + 1);
    }
    
    await setStorage(STORAGE_KEYS.DAILY_LOGS, logs);
    return deleted;
}

// ===== دریافت تاریخ شمسی امروز به صورت نمایشی =====
export function getTodayPersian() {
    const now = new Date();
    const weekday = getPersianWeekday(now);
    const date = toPersianDate(now);
    return `${weekday} ${date}`;
}

// ===== دریافت درصد پیشرفت امروز =====
export async function getTodayProgress(target = 100) {
    const todayKey = getTodayKey();
    const log = await getDailyLog(todayKey);
    const total = log.total || 0;
    return Math.min((total / target) * 100, 100);
}

// ===== دریافت بهترین روز =====
export async function getBestDay() {
    const logs = await getStorage(STORAGE_KEYS.DAILY_LOGS, {});
    let bestDay = { key: null, total: 0, date: null };
    
    for (const [key, log] of Object.entries(logs)) {
        if (log.total > bestDay.total) {
            const parts = key.split('_');
            const date = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
            bestDay = { key, total: log.total, date };
        }
    }
    return bestDay;
}

// ===== دریافت مقایسه هفته جاری با هفته قبل =====
export async function getWeekComparison() {
    const now = new Date();
    const thisWeekStart = getWeekStart(now);
    const lastWeekStart = new Date(thisWeekStart);
    lastWeekStart.setDate(lastWeekStart.getDate() - 7);
    const lastWeekEnd = new Date(thisWeekStart);
    lastWeekEnd.setDate(lastWeekEnd.getDate() - 1);
    
    const thisWeekTotal = await getTotalForPeriod(thisWeekStart, now);
    const lastWeekTotal = await getTotalForPeriod(lastWeekStart, lastWeekEnd);
    
    if (lastWeekTotal === 0) return { percent: 100, direction: 'up', text: 'هفته اول' };
    
    const percent = Math.round(((thisWeekTotal - lastWeekTotal) / lastWeekTotal) * 100);
    return {
        percent: Math.abs(percent),
        direction: percent >= 0 ? 'up' : 'down',
        text: percent >= 0 ? `+${percent}% بیشتر` : `${Math.abs(percent)}% کمتر`
    };
}