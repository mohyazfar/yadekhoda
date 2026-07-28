// ============================================
// theme.js - مدیریت تم‌ها (نسخه پایدار)
// ============================================

import { CONFIG } from './config.js';
import { getStorage, setStorage } from '../utils/storage.js';
import { ICONS } from '../icons.js';

const COLOR_THEMES = [
    { name: "آبی آسمانی", color: "#38bdf8", rgb: "56,189,248" },
    { name: "قرمز آتشین", color: "#dc2626", rgb: "220,38,38" },
    { name: "نارنجی درخشان", color: "#f97316", rgb: "249,115,22" },
    { name: "طلایی", color: "#f59e0b", rgb: "245,158,11" },
    { name: "زرد لیمویی", color: "#eab308", rgb: "234,179,8" },
    { name: "سبز چمنی", color: "#22c55e", rgb: "34,197,94" },
    { name: "سبز زمردی", color: "#059669", rgb: "5,150,105" },
    { name: "سبز دریایی", color: "#0d9488", rgb: "13,148,136" },
    { name: "فیروزه‌ای", color: "#06b6d4", rgb: "6,182,212" },
    { name: "آبی سلطنتی", color: "#2563eb", rgb: "37,99,235" },
    { name: "آبی نیلی", color: "#1e40af", rgb: "30,64,175" },
    { name: "بنفش سلطنتی", color: "#7c3aed", rgb: "124,58,237" },
    { name: "بنفش یاسی", color: "#8b5cf6", rgb: "139,92,246" },
    { name: "ارغوانی", color: "#a855f7", rgb: "168,85,247" },
    { name: "صورتی ملکه", color: "#ec4899", rgb: "236,72,153" },
    { name: "صورتی کارمن", color: "#db2777", rgb: "219,39,119" },
    { name: "یاقوتی", color: "#e11d48", rgb: "225,29,72" },
    { name: "گیلاسی", color: "#be123c", rgb: "190,18,60" },
    { name: "مرجانی", color: "#fb7185", rgb: "251,113,133" },
    { name: "نارنجی پررنگ", color: "#ea580c", rgb: "234,88,12" },
    { name: "کهربایی", color: "#d97706", rgb: "217,119,6" },
    { name: "زیتونی", color: "#65a30d", rgb: "101,163,13" },
    { name: "سبز کاجی", color: "#15803d", rgb: "21,128,61" },
    { name: "سبز آبی", color: "#0f766e", rgb: "15,118,110" },
    { name: "آبی نفتی", color: "#0284c7", rgb: "2,132,199" },
    { name: "آبی دلفینی", color: "#0369a1", rgb: "3,105,161" },
    { name: "لاجوردی", color: "#1d4ed8", rgb: "29,78,216" },
    { name: "نیلی تیره", color: "#3730a3", rgb: "55,48,163" },
    { name: "بنفش تیره", color: "#6d28d9", rgb: "109,40,217" },
    { name: "ارغوانی تیره", color: "#86198f", rgb: "134,25,143" },
    { name: "شرابی", color: "#9d174d", rgb: "157,23,77" },
    { name: "زرشکی", color: "#b91c1c", rgb: "185,28,28" }
];

let currentThemeIndex = 0;
let currentMode = 'light';

export async function initTheme() {
    currentThemeIndex = await getStorage(CONFIG.STORAGE_KEYS.COLOR_THEME, 0);
    currentMode = await getStorage(CONFIG.STORAGE_KEYS.THEME_MODE, 'light');
    applyTheme();
}

export function getColorThemes() { return COLOR_THEMES; }
export function getCurrentTheme() { return COLOR_THEMES[currentThemeIndex]; }
export function getCurrentMode() { return currentMode; }

export function applyColorTheme(index) {
    const theme = COLOR_THEMES[index];
    if (!theme) return;
    
    currentThemeIndex = index;
    setStorage(CONFIG.STORAGE_KEYS.COLOR_THEME, index);
    
    const root = document.documentElement;
    const color = theme.color;
    const rgb = theme.rgb;
    
    root.style.setProperty('--primary-color', color);
    root.style.setProperty('--primary-rgb', rgb);
    root.style.setProperty('--primary-color-alpha', color + '33');
    root.style.setProperty('--primary-color-glow', color + '26');
    root.style.setProperty('--primary-color-glow-strong', color + '4D');
    root.style.setProperty('--border-color', color + '33');
    root.style.setProperty('--border-color-strong', color);
    
    document.body.setAttribute('data-theme', String(index));
    
    const isDark = document.body.classList.contains('dark');
    if (isDark) {
        root.style.setProperty('--bg-page', '#0a0f1a');
        root.style.setProperty('--bg-card', '#141c2b');
        root.style.setProperty('--bg-input', '#141c2b');
        root.style.setProperty('--bg-btn', '#141c2b');
        root.style.setProperty('--text-primary', '#e8edf5');
        root.style.setProperty('--text-secondary', '#94a3b8');
        root.style.setProperty('--text-muted', '#64748b');
        root.style.setProperty('--shadow-color', 'rgba(0,0,0,0.5)');
        root.style.setProperty('--shadow-glow', color + '0F');
    } else {
        root.style.setProperty('--bg-page', '#f8fafc');
        root.style.setProperty('--bg-card', '#ffffff');
        root.style.setProperty('--bg-input', '#f1f5f9');
        root.style.setProperty('--bg-btn', '#ffffff');
        root.style.setProperty('--text-primary', '#0f172a');
        root.style.setProperty('--text-secondary', '#475569');
        root.style.setProperty('--text-muted', '#94a3b8');
        root.style.setProperty('--shadow-color', 'rgba(0,0,0,0.06)');
        root.style.setProperty('--shadow-glow', color + '1F');
    }
    
    const metaThemeColor = document.getElementById('themeColorMeta');
    if (metaThemeColor) {
        metaThemeColor.content = isDark ? '#0a0f1a' : '#f8fafc';
    }
}

export function applyMode(mode) {
    currentMode = mode;
    setStorage(CONFIG.STORAGE_KEYS.THEME_MODE, mode);
    
    document.body.classList.remove('light', 'dark');
    let isDark = false;
    
    if (mode === 'auto') {
        isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    } else if (mode === 'dark') {
        isDark = true;
    }
    
    document.body.classList.add(isDark ? 'dark' : 'light');
    
    const metaThemeColor = document.getElementById('themeColorMeta');
    if (metaThemeColor) {
        metaThemeColor.content = isDark ? '#0a0f1a' : '#f8fafc';
    }
    
    applyColorTheme(currentThemeIndex);
    updateThemeToggleIcon();
    
    import('../modules/zekr-manager.js').then(module => {
        if (module.updateHeaderButtonsColor) {
            setTimeout(() => {
                module.updateHeaderButtonsColor();
            }, 50);
        }
    }).catch(() => {});
}

export function applyTheme() {
    applyMode(currentMode);
}

export function setupAutoTheme() {
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
        if (currentMode === 'auto') {
            applyMode('auto');
        }
    });
}

export function updateThemeToggleIcon() {
    const themeToggleBtn = document.getElementById('themeToggleBtn');
    if (!themeToggleBtn) return;

    const isDark = document.body.classList.contains('dark');
    
    if (isDark) {
        themeToggleBtn.innerHTML = ICONS.moonStars;
        themeToggleBtn.style.color = '#ffffff';
        themeToggleBtn.style.stroke = '#ffffff';
    } else {
        themeToggleBtn.innerHTML = ICONS.sun;
        themeToggleBtn.style.color = '#000000';
        themeToggleBtn.style.stroke = '#000000';
    }
}

export function getPrimaryColor() {
    return getComputedStyle(document.documentElement)
        .getPropertyValue('--primary-color').trim();
}

export function getPrimaryRgb() {
    return getComputedStyle(document.documentElement)
        .getPropertyValue('--primary-rgb').trim();
}

export function setThemeByIndex(index) {
    if (index >= 0 && index < COLOR_THEMES.length) {
        applyColorTheme(index);
        return true;
    }
    return false;
}

export function getCurrentThemeName() {
    return COLOR_THEMES[currentThemeIndex]?.name || 'آبی آسمانی';
}

export function getThemesList() {
    return COLOR_THEMES.map((theme, index) => ({
        id: index,
        name: theme.name,
        color: theme.color,
        rgb: theme.rgb
    }));
}