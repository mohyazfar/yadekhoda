// ============================================
// stats.js - صفحه گزارش عملکرد + اسلایدر (نسخه تک اسلاید)
// ============================================

import { 
    getTodayKey, getTodayPersian, getPersianWeekday,
    getWeeklyData, getZekrShares, getStreak,
    getMonthlyTotal, getTotalForPeriod, getFreeTotalForPeriod,
    deleteLogs, getWeekStart, getDateKey,
    getTodayProgress, getBestDay, getWeekComparison,
    getDailyLog
} from './stats-data.js';
import { getZekrList } from './zekr-manager.js';
import { showToast, showPage } from './ui-utils.js';
import { toPersianNumber, toPersianDate } from '../utils/persian.js';

let currentPeriod = 'week';
let statsData = null;
let sliderInterval = null;
let currentSlide = 0;
let slides = [];
let cachedSlides = null;
let statsCache = null;
let lastStatsUpdate = 0;
const CACHE_DURATION = 30000;

export async function initStats() {
    const now = Date.now();
    if (statsCache && (now - lastStatsUpdate) < CACHE_DURATION) {
        statsData = statsCache;
        renderStats();
        return;
    }
    
    await loadStats(currentPeriod);
}

async function loadStats(period) {
    currentPeriod = period;
    const now = new Date();
    let startDate, endDate = now;
    let label = '';
    
    switch (period) {
        case 'today':
            startDate = new Date(now);
            startDate.setHours(0, 0, 0, 0);
            label = 'امروز';
            break;
        case 'week':
            startDate = getWeekStart(now);
            label = 'این هفته';
            break;
        case 'month':
            startDate = new Date(now.getFullYear(), now.getMonth(), 1);
            label = 'این ماه';
            break;
        case '3months':
            startDate = new Date(now);
            startDate.setMonth(startDate.getMonth() - 3);
            label = '۳ ماه اخیر';
            break;
        default:
            startDate = getWeekStart(now);
            label = 'این هفته';
    }
    
    statsData = {
        period: period,
        label: label,
        startDate: startDate,
        endDate: endDate,
        total: await getTotalForPeriod(startDate, endDate),
        freeTotal: await getFreeTotalForPeriod(startDate, endDate),
        monthlyTotal: await getMonthlyTotal(),
        streak: await getStreak(),
        weeklyData: await getWeeklyData(now),
        shares: await getZekrShares(startDate, endDate)
    };
    
    statsCache = statsData;
    lastStatsUpdate = Date.now();
    
    renderStats();
    await updateStatsSummary();
}

function renderStats() {
    if (!statsData) return;
    
    const headerTitle = document.getElementById('statsHeaderTitle');
    if (headerTitle) {
        headerTitle.textContent = '📊 گزارش عملکرد';
    }
    const headerDate = document.getElementById('statsHeaderDate');
    if (headerDate) {
        headerDate.textContent = getTodayPersian();
    }
    
    renderTodayStats();
    renderBarChart();
    renderHorizontalBars();
}

async function renderTodayStats() {
    const todayTotal = await getTotalForPeriod(
        new Date(new Date().setHours(0,0,0,0)), 
        new Date()
    );
    const todayFree = await getFreeTotalForPeriod(
        new Date(new Date().setHours(0,0,0,0)), 
        new Date()
    );
    const todayEl = document.getElementById('statsCardToday');
    if (todayEl) todayEl.textContent = toPersianNumber(todayTotal);
    
    const weekEl = document.getElementById('statsCardWeek');
    if (weekEl) weekEl.textContent = toPersianNumber(statsData.total);
    
    const monthEl = document.getElementById('statsCardMonth');
    if (monthEl) monthEl.textContent = toPersianNumber(statsData.monthlyTotal);
    
    const streakEl = document.getElementById('statsCardStreak');
    if (streakEl) streakEl.textContent = toPersianNumber(statsData.streak);
    
    const freeEl = document.getElementById('statsCardFree');
    if (freeEl) freeEl.textContent = toPersianNumber(todayFree);
}

function renderBarChart() {
    const container = document.getElementById('statsBarChart');
    if (!container) return;
    
    const data = statsData.weeklyData;
    const maxTotal = Math.max(...data.map(d => d.total), 1);
    
    const fragment = document.createDocumentFragment();
    
    for (const item of data) {
        const heightPercent = Math.max((item.total / maxTotal) * 100, 0);
        const displayTotal = toPersianNumber(item.total);
        
        const wrapper = document.createElement('div');
        wrapper.className = 'stats-bar-wrapper';
        
        const valueSpan = document.createElement('span');
        valueSpan.className = 'stats-bar-value';
        valueSpan.textContent = displayTotal;
        wrapper.appendChild(valueSpan);
        
        const bar = document.createElement('div');
        bar.className = 'stats-bar';
        bar.style.height = Math.max(heightPercent, 4) + '%';
        wrapper.appendChild(bar);
        
        const labelSpan = document.createElement('span');
        labelSpan.className = 'stats-bar-label';
        labelSpan.textContent = item.label;
        wrapper.appendChild(labelSpan);
        
        fragment.appendChild(wrapper);
    }
    
    container.innerHTML = '';
    container.appendChild(fragment);
}

function renderHorizontalBars() {
    const container = document.getElementById('statsHorizontalBars');
    if (!container) return;
    
    const shares = statsData.shares;
    const entries = Object.entries(shares);
    
    if (entries.length === 0) {
        container.innerHTML = `
            <div class="stats-empty">
                <div class="stats-empty-icon">📭</div>
                <div class="stats-empty-text">هنوز داده‌ای ثبت نشده</div>
                <div class="stats-empty-sub">با گفتن ذکرها، آمار شما ثبت می‌شود</div>
            </div>
        `;
        return;
    }
    
    entries.sort((a, b) => b[1].count - a[1].count);
    const maxCount = Math.max(...entries.map(e => e[1].count), 1);
    
    const fragment = document.createDocumentFragment();
    
    for (const [text, data] of entries) {
        const percent = Math.round((data.count / maxCount) * 100);
        const displayCount = toPersianNumber(data.count);
        const isDeleted = data.deleted;
        
        const wrapper = document.createElement('div');
        wrapper.className = 'stats-hbar';
        
        const label = document.createElement('span');
        label.className = 'stats-hbar-label';
        label.textContent = text;
        wrapper.appendChild(label);
        
        const track = document.createElement('div');
        track.className = 'stats-hbar-track';
        
        const fill = document.createElement('div');
        fill.className = 'stats-hbar-fill' + (isDeleted ? ' deleted' : '');
        fill.style.width = Math.max(percent, 4) + '%';
        track.appendChild(fill);
        wrapper.appendChild(track);
        
        const percentSpan = document.createElement('span');
        percentSpan.className = 'stats-hbar-percent';
        percentSpan.textContent = displayCount;
        wrapper.appendChild(percentSpan);
        
        if (isDeleted) {
            const status = document.createElement('span');
            status.className = 'stats-hbar-status';
            status.textContent = '🚫 حذف شده';
            wrapper.appendChild(status);
        }
        
        fragment.appendChild(wrapper);
    }
    
    container.innerHTML = '';
    container.appendChild(fragment);
}

function setupPeriodButtons() {
    const buttons = document.querySelectorAll('.stats-period-btn');
    buttons.forEach(btn => {
        btn.addEventListener('click', function() {
            buttons.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            loadStats(this.dataset.period);
            updateDeleteButton();
        });
    });
}

function setupDeleteButton() {
    const deleteBtn = document.getElementById('statsDeleteBtn');
    if (deleteBtn) {
        deleteBtn.addEventListener('click', async function() {
            if (!statsData) return;
            const start = statsData.startDate;
            const end = statsData.endDate;
            const count = await deleteLogs(start, end);
            if (count > 0) {
                showToast(`🗑️ ${count} روز گزارش حذف شد`);
                statsCache = null;
                await loadStats(currentPeriod);
            } else {
                showToast('⚠️ هیچ گزارشی در این بازه وجود ندارد');
            }
        });
    }
}

function updateDeleteButton() {
    const deleteBtn = document.getElementById('statsDeleteBtn');
    if (deleteBtn && statsData) {
        const start = toPersianDate(statsData.startDate);
        const end = toPersianDate(statsData.endDate);
        deleteBtn.textContent = `🗑️ حذف گزارش‌های ${start} تا ${end}`;
    }
}

export async function updateStatsSummary() {
    const todayTotal = await getTotalForPeriod(
        new Date(new Date().setHours(0,0,0,0)), 
        new Date()
    );
    const now = new Date();
    const weekStart = getWeekStart(now);
    const weekTotal = await getTotalForPeriod(weekStart, now);
    const streak = await getStreak();

    const todayEl = document.getElementById('summaryToday');
    const weekEl = document.getElementById('summaryWeek');
    const streakEl = document.getElementById('summaryStreak');

    if (todayEl) todayEl.textContent = toPersianNumber(todayTotal);
    if (weekEl) weekEl.textContent = toPersianNumber(weekTotal);
    if (streakEl) streakEl.textContent = toPersianNumber(streak);
}

export function showStatsPage() {
    showPage('pageStats');
    setTimeout(() => {
        initStats();
    }, 50);
}

// ============================================
// ===== توابع اسلایدر (فقط یک اسلاید) =====
// ============================================

export async function generateSlides() {
    if (cachedSlides) {
        return cachedSlides;
    }
    
    const now = new Date();
    const todayKey = getTodayKey();
    const todayLog = await getDailyLog(todayKey);
    const todayTotal = todayLog.total || 0;
    const progress = await getTodayProgress(100);
    
    const slidesData = [];
    
    // ===== فقط اسلاید امروز =====
    slidesData.push({
        icon: '📈',
        title: 'امروز',
        text: `${toPersianNumber(todayTotal)} ذکر`,
        sub: `${Math.round(progress)}% از هدف روزانه (۱۰۰)`,
        progress: progress / 100,
        color: 'var(--primary-color)'
    });
    
    cachedSlides = slidesData;
    return slidesData;
}

export async function initSlider() {
    slides = await generateSlides();
    currentSlide = 0;
    
    const track = document.getElementById('sliderTrack');
    const dots = document.getElementById('sliderDots');
    
    if (!track || !dots) return;
    
    // ساخت اسلایدها با DocumentFragment
    const fragment = document.createDocumentFragment();
    slides.forEach((slide, index) => {
        const slideDiv = document.createElement('div');
        slideDiv.className = 'slider-slide';
        slideDiv.dataset.index = index;
        
        let progressHtml = '';
        if (slide.progress !== undefined) {
            progressHtml = `
                <div class="slide-progress">
                    <div class="slide-progress-bar" style="width: ${slide.progress * 100}%; background: ${slide.color};"></div>
                </div>
            `;
        }
        
        slideDiv.innerHTML = `
            <div class="slide-icon">${slide.icon}</div>
            <div class="slide-title">${slide.title}</div>
            <div class="slide-text">${slide.text}</div>
            <div class="slide-sub">${slide.sub}</div>
            ${progressHtml}
        `;
        
        fragment.appendChild(slideDiv);
    });
    
    track.innerHTML = '';
    track.appendChild(fragment);
    
    // ساخت نقاط
    const dotsFragment = document.createDocumentFragment();
    slides.forEach((_, index) => {
        const dot = document.createElement('button');
        dot.className = 'slider-dot' + (index === 0 ? ' active' : '');
        dot.dataset.index = index;
        dotsFragment.appendChild(dot);
    });
    
    dots.innerHTML = '';
    dots.appendChild(dotsFragment);
    
    // رویداد کلیک روی نقاط
    dots.querySelectorAll('.slider-dot').forEach(dot => {
        dot.addEventListener('click', function(e) {
            e.stopPropagation();
            const index = parseInt(this.dataset.index);
            goToSlide(index);
            resetSliderTimer();
        });
    });
    
    // رویداد کلیک روی کادر برای رفتن به صفحه عملکرد
    const box = document.getElementById('statsSummaryBox');
    if (box) {
        box.addEventListener('click', function(e) {
            if (e.target.closest('.slider-dot')) return;
            showStatsPage();
        });
    }
    
    startSliderTimer();
}

export function goToSlide(index) {
    const track = document.getElementById('sliderTrack');
    const dots = document.querySelectorAll('.slider-dot');
    
    if (!track || !dots) return;
    
    currentSlide = Math.max(0, Math.min(index, slides.length - 1));
    
    track.style.transform = `translateX(-${currentSlide * 100}%)`;
    
    dots.forEach((dot, i) => {
        dot.classList.toggle('active', i === currentSlide);
    });
}

export function startSliderTimer() {
    stopSliderTimer();
    sliderInterval = setInterval(() => {
        const next = (currentSlide + 1) % slides.length;
        goToSlide(next);
    }, 7000);
}

export function stopSliderTimer() {
    if (sliderInterval) {
        clearInterval(sliderInterval);
        sliderInterval = null;
    }
}

export function resetSliderTimer() {
    stopSliderTimer();
    startSliderTimer();
}