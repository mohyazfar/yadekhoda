// ============================================
// date-time.js - مدیریت تاریخ و زمان
// ============================================

import { DOM } from './dom-elements.js';
import { WEEK_NAMES } from './config.js';
import { toPersianDate } from '../utils/persian.js';

let clockInterval = null;
let dateInterval = null;

export function updateClock() {
    try {
        const now = new Date();
        DOM.footer.weekday.textContent = WEEK_NAMES[now.getDay()];
        DOM.footer.time.textContent = now.toLocaleTimeString("fa-IR", { 
            hour: "2-digit", 
            minute: "2-digit" 
        });
    } catch (e) {
        console.warn('خطا در بروزرسانی ساعت:', e);
    }
}

export function updateDate() {
    try {
        DOM.footer.dateShamsi.textContent = toPersianDate(new Date());
    } catch (e) {
        const now = new Date();
        DOM.footer.dateShamsi.textContent = now.toLocaleDateString('fa-IR');
        console.warn('خطا در تبدیل تاریخ شمسی:', e);
    }
}

export function updateHeader(zekrText, dayName, target, isGoalReached = false) {
    try {
        const headerContent = document.getElementById('headerZekrContent');
        const headerLabel = document.getElementById('headerLabel');
        const headerCount = document.getElementById('headerCount');
        const headerIconRight = document.getElementById('headerIconRight');
        const headerIconLeft = document.getElementById('headerIconLeft');
        
        if (headerContent) {
            headerContent.textContent = zekrText || 'يَا ذَا الْجَلَالِ وَالْإِكْرَامِ';
        }
        if (headerLabel) {
            headerLabel.textContent = 'ذکر امروز:';
        }
        if (headerCount) {
            headerCount.style.display = 'none';
        }
        
        // ===== ستاره‌های توپر یا توخالی =====
        const starSVG = isGoalReached ? 
            `<svg viewBox="0 0 24 24" fill="#ffffff" style="width:100%;height:100%;">
                <polygon points="12,2 15,9 22,9 16.5,14 18.5,21 12,16.5 5.5,21 7.5,14 2,9 9,9" />
            </svg>` : 
            `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="width:100%;height:100%;">
                <polygon points="12,2 15,9 22,9 16.5,14 18.5,21 12,16.5 5.5,21 7.5,14 2,9 9,9" />
            </svg>`;
        
        if (headerIconRight) {
            headerIconRight.innerHTML = starSVG;
            if (isGoalReached) {
                headerIconRight.classList.add('filled');
            } else {
                headerIconRight.classList.remove('filled');
            }
        }
        if (headerIconLeft) {
            headerIconLeft.innerHTML = starSVG;
            if (isGoalReached) {
                headerIconLeft.classList.add('filled');
            } else {
                headerIconLeft.classList.remove('filled');
            }
        }
    } catch (e) {
        console.warn('خطا در بروزرسانی هدر:', e);
    }
}

export function startClock() {
    try {
        updateClock();
        updateDate();
        
        clearInterval(clockInterval);
        clearInterval(dateInterval);
        
        clockInterval = setInterval(updateClock, 1000);
        dateInterval = setInterval(updateDate, 60000);
    } catch (e) {
        console.warn('خطا در راه‌اندازی ساعت:', e);
    }
}

export function stopClock() {
    clearInterval(clockInterval);
    clearInterval(dateInterval);
}