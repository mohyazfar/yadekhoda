// ============================================
// ui-utils.js - توابع مدیریت UI
// ============================================

import { DOM } from './dom-elements.js';
import { showToast as toastShowToast } from '../utils/toast.js';
import { restoreOriginalTarget, resetHeaderToDaily, exitFreeMode, isFreeMode, setCurrentZekr } from './counter-manager.js';
import { resetZekrModes } from './zekr-manager.js';
import { WEEK_ZEKR } from './config.js';
import { ICONS } from '../icons.js';

const floatingBackBtn = document.getElementById('floatingBackBtn');

export { toastShowToast as showToast };

export function showPage(pageId) {
    const goalMsg = document.getElementById('goalReachedMsg');
    if (goalMsg) {
        goalMsg.style.display = 'none';
        goalMsg.classList.add('hidden');
    }
    
    const activePage = document.querySelector('.page.active');
    
    if (activePage && activePage.id === 'pageCounter' && pageId !== 'pageCounter') {
        if (isFreeMode()) {
            exitFreeMode();
            const day = new Date().getDay();
            const info = WEEK_ZEKR[day];
            if (info) {
                setCurrentZekr({ id: null, text: info.text, meaning: info.meaning, target: 100, source: "daily" });
            }
        }
        restoreOriginalTarget();
    }
    
    if (activePage && activePage.id === 'pageZekr' && pageId !== 'pageZekr') {
        import('./zekr-manager.js').then(module => {
            module.favoriteFilterActive = false;
            module.selectModeActive = false;
            module.selectedZekrIds.clear();
            
            const filterBtn = document.getElementById('zekrFavoriteFilterBtn');
            if (filterBtn) {
                filterBtn.innerHTML = ICONS.heartEmpty;
                filterBtn.style.fill = 'none';
                filterBtn.style.stroke = 'var(--text-primary)';
                filterBtn.classList.remove('active');
            }
            
            const selectBtn = document.getElementById('zekrSelectModeBtn');
            if (selectBtn) {
                selectBtn.classList.remove('active');
            }
            
            const footer = document.getElementById('zekrSelectionFooter');
            if (footer) footer.classList.remove('show');
            
            const addBtn = document.getElementById('zekrAddBtn');
            if (addBtn) addBtn.style.display = 'flex';
            
            module.updateHeaderCountText();
            module.loadZekrList();
        }).catch(() => {});
    }
    
    document.querySelectorAll(".page").forEach(p => p.classList.remove("active"));
    const page = document.getElementById(pageId);
    if (page) page.classList.add("active");
    
    if (pageId === 'pageHome') {
        resetHeaderToDaily();
    }
    
    updateHeaderVisibility();
    updateFloatingBackButton(pageId);
}

export function hideAllPages() {
    const goalMsg = document.getElementById('goalReachedMsg');
    if (goalMsg) {
        goalMsg.style.display = 'none';
        goalMsg.classList.add('hidden');
    }
    
    const activePage = document.querySelector('.page.active');
    
    if (activePage && activePage.id === 'pageCounter') {
        if (isFreeMode()) {
            exitFreeMode();
            const day = new Date().getDay();
            const info = WEEK_ZEKR[day];
            if (info) {
                setCurrentZekr({ id: null, text: info.text, meaning: info.meaning, target: 100, source: "daily" });
            }
        }
        restoreOriginalTarget();
    }
    
    if (activePage && activePage.id === 'pageZekr') {
        resetZekrModes();
        const footer = document.getElementById('zekrSelectionFooter');
        if (footer) footer.classList.remove('show');
    }
    
    document.querySelectorAll(".page").forEach(p => p.classList.remove("active"));
    updateHeaderVisibility();
    updateFloatingBackButton(null);
}

function updateHeaderVisibility() {
    const header = document.getElementById('mainHeader');
    if (!header) return;
    const activePage = document.querySelector('.page.active');
    if (activePage && activePage.id === 'pageHome') {
        header.style.display = 'flex';
    } else {
        header.style.display = 'none';
    }
}

export function updateFloatingBackButton(pageId) {
    if (!floatingBackBtn) return;
    
    if (pageId === 'pageHome') {
        floatingBackBtn.classList.remove('show');
        floatingBackBtn.style.display = 'none';
    } else {
        floatingBackBtn.style.display = 'flex';
        setTimeout(() => {
            floatingBackBtn.classList.add('show');
        }, 50);
    }
}

export function setupFloatingBackButton() {
    if (!floatingBackBtn) return;
    
    floatingBackBtn.addEventListener('click', function() {
        showPage('pageHome');
    });
}

export function setupHomeButtons(callbacks) {
    DOM.home.homeBtns.forEach(btn => {
        btn.addEventListener("click", function() {
            const page = this.dataset.page;
            if (callbacks[page]) {
                callbacks[page]();
                setTimeout(() => {
                    updateHeaderVisibility();
                    updateFloatingBackButton(document.querySelector('.page.active')?.id);
                }, 50);
            }
        });
    });
}

// ===== تابع خالی برای جلوگیری از خطا =====
export function updateFooterVisibility() {
    // فوتر حذف شده، کاری نمیکنه
    return;
}