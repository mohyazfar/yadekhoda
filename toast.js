// ============================================
// toast.js - توابع یکپارچه نمایش پیام
// ============================================

let toastTimer = null;
let toastElement = null;
let isDev = false;

// بررسی حالت توسعه (توسعه، لوکال، فایل محلی)
try {
    const protocol = window.location.protocol;
    const hostname = window.location.hostname;
    
    // تشخیص حالت توسعه:
    // 1. پروتکل file: (فایل محلی)
    // 2. لوکال‌هاست
    // 3. 127.0.0.1
    isDev = protocol === 'file:' || 
            hostname === 'localhost' || 
            hostname === '127.0.0.1' ||
            hostname === '::1';
} catch (e) {
    isDev = false;
}

export function initToast() {
    toastElement = document.getElementById('toast');
    if (!toastElement && isDev) {
        console.warn('⚠️ عنصر Toast در DOM پیدا نشد! یک عنصر با id="toast" در HTML اضافه کنید.');
    }
    if (!toastElement) {
        // یه عنصر موقت بساز تا برنامه کلا از کار نیفته
        toastElement = document.createElement('div');
        toastElement.id = 'toast';
        toastElement.className = 'toast';
        document.body.appendChild(toastElement);
        if (isDev) {
            console.warn('⚠️ یک عنصر Toast موقت ساخته شد.');
        }
    }
}

export function showToast(message, duration = 2000) {
    if (!toastElement) {
        toastElement = document.getElementById('toast');
        if (!toastElement) {
            toastElement = document.createElement('div');
            toastElement.id = 'toast';
            toastElement.className = 'toast';
            document.body.appendChild(toastElement);
            if (isDev) {
                console.warn('⚠️ عنصر Toast پیدا نشد، یک عنصر موقت ساخته شد.');
            }
        }
    }
    
    if (!toastElement) return;
    
    toastElement.textContent = message;
    toastElement.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { 
        toastElement.classList.remove('show'); 
    }, duration);
}

export function hideToast() {
    if (toastElement) {
        toastElement.classList.remove('show');
    }
    clearTimeout(toastTimer);
}

export function setDevMode(enabled) {
    isDev = enabled;
}