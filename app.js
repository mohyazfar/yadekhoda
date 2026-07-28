// ============================================
// app.js - فایل اصلی برنامه (نسخه کامل نهایی)
// ============================================

import { CONFIG, WEEK_ZEKR } from './modules/config.js';
import { DOM } from './modules/dom-elements.js';
import { ICONS, setHomeIcons, setFingerprintIcon, setTargetIcon, setStatsIcon, setHeaderIcons } from './icons.js';
import {
    initCounter, loadDailyZekr, loadSelectedZekr, setCurrentZekr,
    getCounter, getTarget, getCurrentZekr, enterFreeMode, isFreeMode
} from './modules/counter-manager.js';
import { 
    initZekrList, getZekrList, getZekrById, addZekr, removeZekr, 
    updateZekr, loadZekrList, restoreDefaultZekrs,
    toggleFavoriteFilter, toggleSelectMode, clearSelection,
    getSelectedZekrs, deleteSelectedZekrs, shareSelectedZekrs,
    toggleSelectAll, resetZekrModes, updateHeaderCountText,
    updateHeaderButtonsColor
} from './modules/zekr-manager.js';
import { initVibration, getVibrateEnabled, getVibrationLevel, toggleVibration } from './modules/vibration.js';
import { initTheme, applyMode, applyColorTheme, getCurrentMode } from './modules/theme.js';
import { startClock, updateHeader } from './modules/date-time.js';
import { initBanner } from './modules/banner.js';
import { showPage, showToast, setupHomeButtons, setupFloatingBackButton } from './modules/ui-utils.js';
import { SettingsUI } from './modules/settings-ui.js';
import { initDialog, confirmDialog } from './utils/dialog.js';
import { initToast } from './utils/toast.js';
import { initCsvImport } from './modules/csv-import.js';
import { showStatsPage, updateStatsSummary, initSlider } from './modules/stats.js';
import { getStorage, setStorage, removeStorage, initStorage } from './utils/storage.js';
import { 
    initRoutines, showRoutinesPage, showRoutineBuilder,
    loadRoutinesList, getRoutines, startRoutine
} from './modules/routines-manager.js';
import { 
    initReminders, showRemindersPage, loadRemindersList,
    getReminders, showAddReminderDialog, stopReminderChecker
} from './modules/reminders-manager.js';

let settingsUIInstance = null;
let isAppInitialized = false;
let editingZekrId = null;
let previewData = null;
const intervals = [];

function cleanup() {
    intervals.forEach(id => clearInterval(id));
    intervals.length = 0;
    stopReminderChecker();
}

async function initializeModules() {
    const modules = [
        { name: 'storage', fn: initStorage },
        { name: 'dialog', fn: initDialog },
        { name: 'toast', fn: initToast },
        { name: 'banner', fn: initBanner },
        { name: 'zekrList', fn: initZekrList },
        { name: 'counter', fn: initCounter },
        { name: 'vibration', fn: initVibration },
        { name: 'theme', fn: initTheme },
        { name: 'csvImport', fn: initCsvImport },
        { name: 'routines', fn: initRoutines },
        { name: 'reminders', fn: initReminders }
    ];

    for (const item of modules) {
        try {
            console.log(`📦 مقداردهی ${item.name}...`);
            await item.fn();
            console.log(`✅ ${item.name} با موفقیت مقداردهی شد`);
        } catch (e) {
            console.error(`❌ خطا در مقداردهی ${item.name}:`, e);
        }
    }
}

function setupKeyboardScroll() {
    const inputs = document.querySelectorAll('input, textarea, select');
    inputs.forEach(input => {
        input.addEventListener('focus', function() {
            setTimeout(() => {
                const parentPage = this.closest('.page');
                if (parentPage) {
                    const footer = parentPage.querySelector('.routine-builder-footer, .routine-setup-footer, .counter-bottom, .zekr-selection-footer');
                    if (footer) {
                        footer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                    }
                }
                this.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, 350);
        });
    });
}

function setupUI() {
    try {
        setupHomeButtons({
            counter: () => {
                enterFreeMode();
                showPage('pageCounter');
            },
            zekrlist: () => {
                showPage('pageZekr');
                loadZekrList();
            },
            routines: () => {
                showRoutinesPage();
            },
            reminders: () => {
                showRemindersPage();
            },
            settings: () => {
                showPage('pageSettings');
                if (!window.__settingsUI) {
                    window.__settingsUI = new SettingsUI();
                }
                setupResetButtons();
            },
            about: () => {
                showPage('pageAbout');
            },
            share: handleShare
        });
    } catch (e) {
        console.error('❌ خطا در تنظیم UI:', e);
    }
}

function setupIcons() {
    try {
        setHomeIcons();
        setFingerprintIcon();
        setTargetIcon();
        setStatsIcon();
        setHeaderIcons();
    } catch (e) {
        console.error('❌ خطا در تنظیم آیکون‌ها:', e);
    }
}

function setupAboutPageStars() {
    try {
        const starLeft = document.getElementById('starLeft');
        const starRight = document.getElementById('starRight');
        if (starLeft) {
            starLeft.innerHTML = ICONS.star;
            starLeft.style.width = 'clamp(20px, 3vw, 32px)';
            starLeft.style.height = 'clamp(20px, 3vw, 32px)';
        }
        if (starRight) {
            starRight.innerHTML = ICONS.star;
            starRight.style.width = 'clamp(20px, 3vw, 32px)';
            starRight.style.height = 'clamp(20px, 3vw, 32px)';
        }
    } catch (e) {
        console.error('❌ خطا در تنظیم ستاره‌ها:', e);
    }
}

async function loadInitialData() {
    try {
        const day = new Date().getDay();
        const info = WEEK_ZEKR[day];
        if (info) {
            setCurrentZekr({ id: null, text: info.text, meaning: info.meaning, target: 100, source: "daily" });
            console.log(`📿 ذکر روز بارگذاری شد: ${info.text}`);
        }
    } catch (e) {
        console.error('❌ خطا در بارگذاری ذکر روز:', e);
    }

    try {
        await updateStatsSummary();
    } catch (e) {
        console.error('❌ خطا در به‌روزرسانی خلاصه عملکرد:', e);
    }

    try {
        setTimeout(() => {
            initSlider();
        }, 500);
    } catch (e) {
        console.error('❌ خطا در راه‌اندازی اسلایدر:', e);
    }

    try {
        startClock();
    } catch (e) {
        console.error('❌ خطا در راه‌اندازی ساعت:', e);
    }
}

function setupSpecialButtons() {
    try {
        if (DOM.buttons.support) {
            DOM.buttons.support.addEventListener('click', function() { 
                window.open('https://ble.ir/mohyazfar', '_blank'); 
            });
        }

        if (DOM.forms.addZekr.previewBtn) {
            DOM.forms.addZekr.previewBtn.addEventListener('click', handlePreview);
        }

        if (DOM.forms.preview.confirmBtn) {
            DOM.forms.preview.confirmBtn.addEventListener('click', handleConfirmPreview);
        }

        if (DOM.forms.preview.editBtn) {
            DOM.forms.preview.editBtn.addEventListener('click', function() { 
                showPage('pageAddZekr'); 
            });
        }

        if (DOM.forms.editZekr.updateBtn) {
            DOM.forms.editZekr.updateBtn.addEventListener('click', handleUpdateZekr);
        }

        if (DOM.forms.addZekr.text) {
            DOM.forms.addZekr.text.addEventListener('input', function() { 
                this.classList.remove('error'); 
            });
        }
        if (DOM.forms.addZekr.target) {
            DOM.forms.addZekr.target.addEventListener('input', function() { 
                this.classList.remove('error'); 
            });
        }
        if (DOM.forms.editZekr.text) {
            DOM.forms.editZekr.text.addEventListener('input', function() { 
                this.classList.remove('error'); 
            });
        }
        if (DOM.forms.editZekr.target) {
            DOM.forms.editZekr.target.addEventListener('input', function() { 
                this.classList.remove('error'); 
            });
        }
    } catch (e) {
        console.error('❌ خطا در تنظیم دکمه‌های ویژه:', e);
    }
}

function setupEvents() {
    try {
        setupFloatingBackButton();
        setupHeaderClick();
        setupStatsSummaryClick();
        setupZekrHeaderButtons();
        setupRoutinesEvents();
        setupRemindersEvents();
        setupVibrateButton();
        setupThemeToggleIcon();
    } catch (e) {
        console.error('❌ خطا در تنظیم رویدادها:', e);
    }
}

function setupRoutinesEvents() {
    const routinesAddBtn = document.getElementById('routinesAddBtn');
    if (routinesAddBtn) {
        routinesAddBtn.addEventListener('click', function() {
            showRoutineBuilder();
        });
    }

    const builderBackBtn = document.getElementById('routineBuilderBackBtn');
    if (builderBackBtn) {
        builderBackBtn.addEventListener('click', function() {
            showRoutinesPage();
        });
    }

    const setupBackBtn = document.getElementById('routineSetupBackBtn');
    if (setupBackBtn) {
        setupBackBtn.addEventListener('click', function() {
            showRoutinesPage();
        });
    }
}

function setupRemindersEvents() {
    const addBtn = document.getElementById('remindersAddBtn');
    if (addBtn) {
        addBtn.addEventListener('click', function() {
            showAddReminderDialog();
        });
    }
}

function setupHeaderClick() {
    const headerBox = document.getElementById('headerZekrBox');
    if (headerBox) {
        headerBox.addEventListener('click', function() {
            loadDailyZekr(WEEK_ZEKR);
        });
    }
}

function setupStatsSummaryClick() {
    const box = document.getElementById('statsSummaryBox');
    if (box) {
        box.addEventListener('click', function() {
            showStatsPage();
        });
    }
}

function setupThemeToggleIcon() {
    const themeToggleBtn = document.getElementById('themeToggleBtn');
    if (!themeToggleBtn) return;

    const isDark = document.body.classList.contains('dark');
    
    if (isDark) {
        themeToggleBtn.innerHTML = ICONS.moonStars;
        themeToggleBtn.style.color = '#ffffff';
    } else {
        themeToggleBtn.innerHTML = ICONS.sun;
        themeToggleBtn.style.color = '#000000';
    }

    const newBtn = themeToggleBtn.cloneNode(true);
    themeToggleBtn.parentNode.replaceChild(newBtn, themeToggleBtn);
    const btn = document.getElementById('themeToggleBtn');
    if (!btn) return;

    btn.addEventListener('click', function() {
        this.classList.add('rotate-animate');
        
        const isDarkNow = document.body.classList.contains('dark');
        let newMode;
        
        if (isDarkNow) {
            this.innerHTML = ICONS.sun;
            this.style.color = '#000000';
            newMode = 'light';
        } else {
            this.innerHTML = ICONS.moonStars;
            this.style.color = '#ffffff';
            newMode = 'dark';
        }
        
        applyMode(newMode);
        
        setTimeout(() => {
            this.classList.remove('rotate-animate');
        }, 450);
        
        if (window.__settingsUI) {
            window.__settingsUI.loadSavedSettings();
        }
    });
}

function setupVibrateButton() {
    const vibrateBtn = document.getElementById('vibrateBtn');
    if (vibrateBtn) {
        vibrateBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            showPage('pageSettings');
            if (!window.__settingsUI) {
                window.__settingsUI = new SettingsUI();
            }
            setupResetButtons();
        });
    }
}

function setupZekrHeaderButtons() {
    const filterBtn = document.getElementById('zekrFavoriteFilterBtn');
    if (filterBtn) {
        filterBtn.addEventListener('click', function() {
            toggleFavoriteFilter();
        });
    }

    const selectBtn = document.getElementById('zekrSelectModeBtn');
    if (selectBtn) {
        selectBtn.addEventListener('click', function() {
            toggleSelectMode();
        });
    }

    const addBtn = document.getElementById('zekrAddBtn');
    if (addBtn) {
        addBtn.addEventListener('click', function() {
            showPage('pageAddZekr');
            DOM.forms.addZekr.text.value = '';
            DOM.forms.addZekr.meaning.value = '';
            DOM.forms.addZekr.target.value = '';
            DOM.forms.addZekr.text.classList.remove('error');
            DOM.forms.addZekr.target.classList.remove('error');
            previewData = null;
        });
    }

    const selectAllBtn = document.getElementById('zekrSelectionSelectAll');
    if (selectAllBtn) {
        selectAllBtn.addEventListener('click', function() {
            toggleSelectAll();
        });
    }

    const shareBtn = document.getElementById('zekrSelectionShare');
    if (shareBtn) {
        shareBtn.addEventListener('click', function() {
            shareSelectedZekrs();
        });
    }

    const deleteBtn = document.getElementById('zekrSelectionDelete');
    if (deleteBtn) {
        deleteBtn.addEventListener('click', function() {
            deleteSelectedZekrs(() => {
                loadZekrList();
                const selected = getSelectedZekrs();
                if (selected.length === 0) {
                    clearSelection();
                }
            });
        });
    }
}

function handleShare() {
    const APP_URL = 'https://your-app-url.com';
    const APP_NAME = CONFIG.APP_NAME;
    const shareText = `📿 ${APP_NAME} - بهترین همراه برای اهل ذکر`;

    if (navigator.share) {
        navigator.share({ 
            title: APP_NAME, 
            text: shareText,
            url: APP_URL
        }).catch(() => {});
    } else {
        if (navigator.clipboard) {
            navigator.clipboard.writeText(shareText + '\n' + APP_URL)
                .then(() => showToast("✅ لینک برنامه کپی شد"))
                .catch(() => showToast("📋 لینک: " + APP_URL));
        } else {
            showToast("📋 لینک: " + APP_URL);
        }
    }
}

async function setupResetButtons() {
    const resetZekrsBtn = document.getElementById('resetZekrsBtn');
    if (resetZekrsBtn) {
        resetZekrsBtn.addEventListener('click', async function() {
            const result = await confirmDialog(
                'آیا از حذف همه ذکرها و منتخب‌ها مطمئن هستید؟\n(تنظیمات و آمار باقی می‌مانند)', 
                'حذف ذکرها', 
                '🗑️'
            );
            if (result) {
                const keys = ['zekr_zekrList', 'zekr_favoriteIds'];
                for (let i = 0; i < localStorage.length; i++) {
                    const key = localStorage.key(i);
                    if (key && key.startsWith('zekr_zekrCount_')) {
                        keys.push(key);
                    }
                }
                for (const key of keys) {
                    await removeStorage(key.replace('zekr_', ''));
                }
                initZekrList();
                loadZekrList();
                showToast('✅ همه ذکرها و منتخب‌ها حذف شدند');
            }
        });
    }

    const resetSettingsBtn = document.getElementById('resetSettingsBtn');
    if (resetSettingsBtn) {
        resetSettingsBtn.addEventListener('click', async function() {
            const result = await confirmDialog(
                'آیا از حذف تنظیمات و آمار مطمئن هستید؟\n(ذکرها باقی می‌مانند)', 
                'حذف تنظیمات و آمار', 
                '⚙️'
            );
            if (result) {
                const keys = [
                    'counter', 'totalCount', 'themeMode', 
                    'colorTheme', 'vibrationPattern', 'vibrate',
                    'daily_logs', 'streak', 'last_date'
                ];
                for (let i = 0; i < localStorage.length; i++) {
                    const key = localStorage.key(i);
                    if (key && key.startsWith('zekr_monthly_total_')) {
                        keys.push(key);
                    }
                }
                for (const key of keys) {
                    await removeStorage(key.replace('zekr_', ''));
                }
                initCounter();
                initTheme();
                initVibration();
                await updateStatsSummary();
                showToast('✅ تنظیمات و آمار حذف شدند');
            }
        });
    }

    const resetAllBtn = document.getElementById('resetAllBtn');
    if (resetAllBtn) {
        resetAllBtn.addEventListener('click', async function() {
            const result = await confirmDialog(
                '⚠️ آیا از حذف همه داده‌ها مطمئن هستید؟\n(این عمل غیرقابل بازگشت است!)', 
                'حذف همه چیز', 
                '🔥'
            );
            if (result) {
                const keys = [];
                for (let i = 0; i < localStorage.length; i++) {
                    const key = localStorage.key(i);
                    if (key && key.startsWith('zekr_')) {
                        keys.push(key);
                    }
                }
                for (const key of keys) {
                    await removeStorage(key.replace('zekr_', ''));
                }
                initZekrList();
                initCounter();
                initTheme();
                initVibration();
                loadZekrList();
                await updateStatsSummary();
                showToast('✅ همه داده‌ها حذف شدند');
            }
        });
    }
}

function handlePreview() {
    const text = DOM.forms.addZekr.text.value.trim();
    const meaning = DOM.forms.addZekr.meaning.value.trim();
    const target = DOM.forms.addZekr.target.value.trim();
    
    let isValid = true;
    DOM.forms.addZekr.text.classList.remove('error');
    DOM.forms.addZekr.target.classList.remove('error');
    
    if (!text) { 
        DOM.forms.addZekr.text.classList.add('error'); 
        isValid = false; 
    }
    if (!target || parseInt(target) < 1) { 
        DOM.forms.addZekr.target.classList.add('error'); 
        isValid = false; 
    }
    
    if (!isValid) { 
        showToast("⚠️ لطفاً کادرهای اجباری را پر کنید"); 
        return; 
    }
    
    previewData = { text, meaning, target: parseInt(target) };
    DOM.forms.preview.text.textContent = text;
    DOM.forms.preview.meaning.textContent = meaning || "—";
    DOM.forms.preview.target.textContent = target;
    showPage('pagePreview');
}

function handleConfirmPreview() {
    if (previewData) {
        const newId = addZekr(previewData.text, previewData.meaning, previewData.target);
        if (newId) {
            previewData = null;
            showPage('pageZekr');
            loadZekrList();
        }
    } else { 
        showToast("⚠️ خطا در ذخیره‌سازی"); 
    }
}

function handleUpdateZekr() {
    const text = DOM.forms.editZekr.text.value.trim();
    const meaning = DOM.forms.editZekr.meaning.value.trim();
    const target = DOM.forms.editZekr.target.value.trim();
    
    let isValid = true;
    DOM.forms.editZekr.text.classList.remove('error');
    DOM.forms.editZekr.target.classList.remove('error');
    
    if (!text) { 
        DOM.forms.editZekr.text.classList.add('error'); 
        isValid = false; 
    }
    if (!target || parseInt(target) < 1) { 
        DOM.forms.editZekr.target.classList.add('error'); 
        isValid = false; 
    }
    
    if (!isValid) { 
        showToast("⚠️ لطفاً کادرهای اجباری را پر کنید"); 
        return; 
    }
    
    if (typeof updateZekr === 'function' && editingZekrId) {
        const result = updateZekr(editingZekrId, text, meaning, parseInt(target));
        if (result) {
            showToast("✅ ذکر با موفقیت ویرایش شد");
            editingZekrId = null;
            showPage('pageZekr');
            loadZekrList();
        } else { 
            showToast("⚠️ خطا در ویرایش ذکر"); 
        }
    } else { 
        showToast("⚠️ خطا در ویرایش ذکر"); 
    }
}

async function initApp() {
    try {
        console.log('🚀 شروع راه‌اندازی برنامه...');

        const requiredElements = [
            'pageHome', 'pageCounter', 'pageZekr',
            'pageSettings', 'pageAbout', 'pageStats', 'toast', 'mainHeader'
        ];

        const missingElements = requiredElements.filter(id => !document.getElementById(id));
        if (missingElements.length > 0) {
            console.error('❌ المان‌های زیر در DOM پیدا نشدند:', missingElements);
            showToast('⚠️ خطا در بارگذاری برنامه');
            return;
        }

        await initializeModules();
        setupUI();
        setupKeyboardScroll();
        showPage('pageHome');
        setupEvents();
        setupIcons();
        setupAboutPageStars();
        await loadInitialData();
        setupSpecialButtons();

        setTimeout(() => {
            updateHeaderButtonsColor();
        }, 200);

        isAppInitialized = true;
        console.log('✅ برنامه با موفقیت راه‌اندازی شد! 🎉');

    } catch (e) {
        console.error('❌ خطای کلی در راه‌اندازی برنامه:', e);
        showToast('⚠️ خطا در راه‌اندازی برنامه');
    }
}

document.addEventListener('DOMContentLoaded', function() {
    console.log('📄 DOM آماده است، راه‌اندازی برنامه...');
    setTimeout(initApp, 300);
    
    setTimeout(function() {
        if (!isAppInitialized) {
            console.warn('⚠️ برنامه بعد از ۳ ثانیه راه‌اندازی نشد، تلاش مجدد...');
            initApp();
        }
    }, 3000);
});

window.addEventListener('beforeunload', function() {
    cleanup();
});

window.showPage = showPage;
window.showToast = showToast;
window.loadZekrList = loadZekrList;
window.loadSelectedZekr = loadSelectedZekr;
window.loadDailyZekr = () => loadDailyZekr(WEEK_ZEKR);
window.getZekrList = getZekrList;
window.getZekrById = getZekrById;
window.addZekr = addZekr;
window.removeZekr = removeZekr;
window.updateZekr = updateZekr;
window.setCurrentZekr = setCurrentZekr;
window.showStatsPage = showStatsPage;
window.applyMode = applyMode;
window.applyColorTheme = applyColorTheme;
window.updateStatsSummary = updateStatsSummary;
window.isFreeMode = isFreeMode;
window.toggleFavoriteFilter = toggleFavoriteFilter;
window.toggleSelectMode = toggleSelectMode;
window.clearSelection = clearSelection;
window.updateHeaderCountText = updateHeaderCountText;
window.updateHeaderButtonsColor = updateHeaderButtonsColor;
window.showRoutinesPage = showRoutinesPage;
window.showRoutineBuilder = showRoutineBuilder;
window.loadRoutinesList = loadRoutinesList;
window.getRoutines = getRoutines;
window.startRoutine = startRoutine;
window.showRemindersPage = showRemindersPage;
window.loadRemindersList = loadRemindersList;
window.getReminders = getReminders;
window.showAddReminderDialog = showAddReminderDialog;

export { 
    initApp, 
    editingZekrId, 
    previewData,
    cleanup,
    setupResetButtons,
    setupHeaderClick,
    setupStatsSummaryClick,
    setupZekrHeaderButtons,
    setupRoutinesEvents,
    setupRemindersEvents,
    handleShare,
    setupSpecialButtons,
    setupThemeToggleIcon,
    setupVibrateButton,
    handlePreview,
    handleConfirmPreview,
    handleUpdateZekr
};