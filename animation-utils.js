// ============================================
// animation-utils.js - توابع انیمیشن (نسخه اصلاح‌شده)
// ============================================

import { toPersianNumber } from '../utils/persian.js';

let animationInterval = null;

/**
 * انیمیشن ریست شمارنده (شمارش معکوس سریع)
 */
export function animateCounterReset(startValue, duration = 500, onUpdate, onComplete) {
    stopAnimation();
    
    if (startValue <= 0) {
        // ===== 🔧 اصلاح: صدا زدن onUpdate با مقدار 0 =====
        if (onUpdate) {
            onUpdate(0);
        }
        if (onComplete) {
            onComplete();
        }
        return;
    }
    
    const startTime = performance.now();
    const startValueNum = startValue;
    
    animationInterval = requestAnimationFrame(function animate(timestamp) {
        const elapsed = timestamp - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const currentValue = Math.round(startValueNum * (1 - progress));
        
        if (onUpdate) {
            onUpdate(currentValue);
        }
        
        if (progress < 1) {
            animationInterval = requestAnimationFrame(animate);
        } else {
            if (onUpdate) {
                onUpdate(0);
            }
            if (onComplete) {
                onComplete();
            }
            animationInterval = null;
        }
    });
}

export function stopAnimation() {
    if (animationInterval) {
        cancelAnimationFrame(animationInterval);
        animationInterval = null;
    }
}

/**
 * انیمیشن کامل ریست (نوار پیشرفت + عدد)
 */
export function animateFullReset(elements, startValue, duration = 500, onComplete) {
    const { progressBar, numberElement } = elements;
    
    stopAnimation();
    
    if (!progressBar || !numberElement) {
        if (onComplete) {
            onComplete();
        }
        return;
    }
    
    // نوار پیشرفت با transition - خالی شدن (۰.۵ ثانیه)
    progressBar.style.transition = `width ${duration}ms ease-in`;
    progressBar.style.width = '0%';
    
    // عدد با انیمیشن شمارش معکوس
    animateCounterReset(startValue, duration, (value) => {
        numberElement.textContent = toPersianNumber(value);
    }, onComplete);
}

/**
 * انیمیشن محو شدن المان
 */
export function fadeOut(element, duration = 300) {
    return new Promise((resolve) => {
        if (!element) {
            resolve();
            return;
        }
        element.style.transition = `opacity ${duration}ms ease`;
        element.style.opacity = '0';
        setTimeout(() => {
            element.style.display = 'none';
            resolve();
        }, duration);
    });
}

/**
 * انیمیشن ظاهر شدن المان
 */
export function fadeIn(element, duration = 300) {
    return new Promise((resolve) => {
        if (!element) {
            resolve();
            return;
        }
        element.style.display = '';
        element.style.opacity = '0';
        requestAnimationFrame(() => {
            element.style.transition = `opacity ${duration}ms ease`;
            element.style.opacity = '1';
        });
        setTimeout(() => {
            resolve();
        }, duration);
    });
}

/**
 * انیمیشن جهش (bounce)
 */
export function bounce(element, duration = 400) {
    return new Promise((resolve) => {
        if (!element) {
            resolve();
            return;
        }
        element.style.transition = `transform ${duration}ms cubic-bezier(0.34, 1.56, 0.64, 1)`;
        element.style.transform = 'scale(1.2)';
        setTimeout(() => {
            element.style.transform = 'scale(1)';
        }, 150);
        setTimeout(() => {
            resolve();
        }, duration);
    });
}

/**
 * انیمیشن چرخش
 */
export function rotate(element, duration = 500) {
    return new Promise((resolve) => {
        if (!element) {
            resolve();
            return;
        }
        element.style.transition = `transform ${duration}ms ease`;
        element.style.transform = 'rotate(360deg)';
        setTimeout(() => {
            element.style.transform = 'rotate(0deg)';
            resolve();
        }, duration);
    });
}

/**
 * انیمیشن شمارش عدد
 */
export function animateNumber(element, start, end, duration = 500) {
    return new Promise((resolve) => {
        if (!element) {
            resolve();
            return;
        }
        
        const startTime = performance.now();
        const diff = end - start;
        
        requestAnimationFrame(function animate(timestamp) {
            const elapsed = timestamp - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const current = Math.round(start + (diff * progress));
            
            element.textContent = toPersianNumber(current);
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                element.textContent = toPersianNumber(end);
                resolve();
            }
        });
    });
}