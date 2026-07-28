// ============================================
// zekr-manager.js - مدیریت ذکرها (نسخه اصلاح‌شده)
// ============================================

import { DOM } from './dom-elements.js';
import { CONFIG, WEEK_ZEKR } from './config.js';
import { getStorage, setStorage, removeStorage } from '../utils/storage.js';
import { showToast, showPage } from './ui-utils.js';
import { loadSelectedZekr } from './counter-manager.js';
import { confirmDialog, promptNumberDialog, showDialog } from '../utils/dialog.js';
import { ICONS } from '../icons.js';
import { toPersianNumber } from '../utils/persian.js';

let zekrList = [];
let favoriteFilterActive = false;
let selectModeActive = false;
let selectedZekrIds = new Set();
let cachedFavoriteIds = [];
let isFavoriteCacheValid = false;

const DEFAULT_ZEKRS = [
    { id: 1, text: "سُبْحَانَ اللَّهِ", meaning: "پاک و منزّه است خداوند", target: 33, isDefault: false },
    { id: 2, text: "الْحَمْدُ لِلَّهِ", meaning: "ستایش مخصوص خداوند است", target: 33, isDefault: false },
    { id: 3, text: "لَا إِلٰهَ إِلَّا اللَّهُ", meaning: "هیچ معبودی جز خداوند نیست", target: 33, isDefault: false },
    { id: 4, text: "اللَّهُ أَكْبَرُ", meaning: "خداوند بزرگتر است", target: 34, isDefault: false },
    { id: 5, text: "أَسْتَغْفِرُ اللَّهَ", meaning: "از خداوند آمرزش می‌خواهم", target: 70, isDefault: false },
    { id: 6, text: "سُبْحَانَ اللَّهِ وَبِحَمْدِهِ", meaning: "پاک و منزّه است خداوند و ستایش مخصوص اوست", target: 100, isDefault: false },
    { id: 7, text: "لَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِاللَّهِ", meaning: "هیچ نیرو و قدرتی جز از جانب خداوند نیست", target: 50, isDefault: false }
];

function getDefaultIds() { return zekrList.filter(item => item.isDefault).map(item => item.id); }

async function loadFavoriteIds() {
    if (isFavoriteCacheValid) {
        return cachedFavoriteIds;
    }
    cachedFavoriteIds = await getStorage(CONFIG.STORAGE_KEYS.FAVORITE_IDS, []);
    isFavoriteCacheValid = true;
    return cachedFavoriteIds;
}

async function invalidateFavoriteCache() {
    isFavoriteCacheValid = false;
}

async function saveFavoriteIds(ids) {
    cachedFavoriteIds = ids;
    isFavoriteCacheValid = true;
    await setStorage(CONFIG.STORAGE_KEYS.FAVORITE_IDS, ids);
}

export function updateHeaderButtonsColor() {
    const filterBtn = document.getElementById('zekrFavoriteFilterBtn');
    const selectBtn = document.getElementById('zekrSelectModeBtn');
    const isDark = document.body.classList.contains('dark');
    const strokeColor = isDark ? '#ffffff' : '#000000';
    
    if (filterBtn && !filterBtn.classList.contains('active')) {
        filterBtn.style.stroke = strokeColor;
        filterBtn.style.color = strokeColor;
        filterBtn.style.fill = 'none';
    }
    
    if (selectBtn && !selectBtn.classList.contains('active')) {
        selectBtn.style.stroke = strokeColor;
        selectBtn.style.color = strokeColor;
    }
}

export async function initZekrList() {
    const saved = await getStorage(CONFIG.STORAGE_KEYS.ZEKR_LIST);
    if (saved && saved.length > 0) {
        zekrList = saved;
    } else {
        zekrList = JSON.parse(JSON.stringify(DEFAULT_ZEKRS));
        await saveZekrList();
    }
    
    selectedZekrIds = new Set();
    favoriteFilterActive = false;
    selectModeActive = false;
    await invalidateFavoriteCache();
    
    setTimeout(() => {
        const filterBtn = document.getElementById('zekrFavoriteFilterBtn');
        if (filterBtn) {
            filterBtn.innerHTML = ICONS.heartEmpty;
            filterBtn.style.fill = 'none';
            const isDark = document.body.classList.contains('dark');
            const strokeColor = isDark ? '#ffffff' : '#000000';
            filterBtn.style.stroke = strokeColor;
            filterBtn.style.color = strokeColor;
            filterBtn.classList.remove('active');
        }
        
        const selectBtn = document.getElementById('zekrSelectModeBtn');
        if (selectBtn) {
            selectBtn.classList.remove('active');
            selectBtn.innerHTML = ICONS.selectCheckboxEmpty;
            const isDark = document.body.classList.contains('dark');
            const strokeColor = isDark ? '#ffffff' : '#000000';
            selectBtn.style.stroke = strokeColor;
            selectBtn.style.color = strokeColor;
        }
        
        const footer = document.getElementById('zekrSelectionFooter');
        if (footer) {
            footer.classList.remove('show');
        }
        
        const addBtn = document.getElementById('zekrAddBtn');
        if (addBtn) {
            addBtn.style.display = 'flex';
        }
        
        updateHeaderCountText();
        loadZekrList();
    }, 100);
    
    return zekrList;
}

async function saveZekrList() { 
    await setStorage(CONFIG.STORAGE_KEYS.ZEKR_LIST, zekrList); 
}

export function getZekrList() { return zekrList; }

export function getZekrById(id) { return zekrList.find(item => item.id === id); }

export async function addZekr(text, meaning, target) {
    const newId = Math.max(0, ...zekrList.map(i => i.id)) + 1;
    const newItem = { id: newId, text: text, meaning: meaning || "", target: parseInt(target) || 100, isDefault: false };
    zekrList.push(newItem);
    await saveZekrList();
    showToast("ذکر جدید اضافه شد");
    return newId;
}

export async function removeZekr(id) {
    zekrList = zekrList.filter(i => i.id !== id);
    await saveZekrList();
    return true;
}

export async function updateZekr(id, text, meaning, target) {
    const item = getZekrById(id);
    if (!item) return false;
    item.text = text;
    item.meaning = meaning || "";
    item.target = parseInt(target) || 100;
    await saveZekrList();
    return true;
}

export async function restoreDefaultZekrs() {
    const defaultIds = DEFAULT_ZEKRS.map(d => d.id);
    zekrList = zekrList.filter(item => !defaultIds.includes(item.id));
    const newDefaults = JSON.parse(JSON.stringify(DEFAULT_ZEKRS));
    zekrList = [...newDefaults, ...zekrList];
    await saveZekrList();
    showToast("✅ ذکرهای پیش‌فرض برگشت داده شدند");
}

async function isFavorite(id) {
    const favorites = await loadFavoriteIds();
    return favorites.includes(id);
}

export async function updateHeaderCountText() {
    const textEl = document.getElementById('zekrHeaderCountText');
    const numberEl = document.getElementById('zekrHeaderCountNumber');
    
    if (!textEl || !numberEl) return;
    
    if (favoriteFilterActive) {
        const favIds = await loadFavoriteIds();
        const favCount = zekrList.filter(item => favIds.includes(item.id)).length;
        textEl.innerHTML = `تعداد منتخب : <span class="count-number">${toPersianNumber(favCount)}</span>`;
    } else {
        textEl.innerHTML = `تعداد کل ذکرها : <span class="count-number">${toPersianNumber(zekrList.length)}</span>`;
    }
}

function updateFooterButtons() {
    const count = selectedZekrIds.size;
    const countEl = document.getElementById('selectedCount');
    const shareBtn = document.getElementById('zekrSelectionShare');
    const deleteBtn = document.getElementById('zekrSelectionDelete');
    
    if (countEl) {
        countEl.textContent = toPersianNumber(count);
    }
    
    if (shareBtn) {
        if (count > 0) {
            shareBtn.classList.add('active');
        } else {
            shareBtn.classList.remove('active');
        }
    }
    
    if (deleteBtn) {
        if (count > 0) {
            deleteBtn.classList.add('active');
        } else {
            deleteBtn.classList.remove('active');
        }
    }
}

export async function toggleFavoriteFilter() {
    favoriteFilterActive = !favoriteFilterActive;
    
    const btn = document.getElementById('zekrFavoriteFilterBtn');
    if (btn) {
        btn.classList.remove('flip-icon-3d');
        void btn.offsetWidth;
        btn.classList.add('flip-icon-3d');
        
        if (favoriteFilterActive) {
            btn.innerHTML = ICONS.heartFilled;
            btn.style.fill = '#ffffff';
            btn.style.stroke = '#ffffff';
            btn.style.color = '#ffffff';
            btn.classList.add('active');
        } else {
            btn.innerHTML = ICONS.heartEmpty;
            btn.style.fill = 'none';
            const isDark = document.body.classList.contains('dark');
            const strokeColor = isDark ? '#ffffff' : '#000000';
            btn.style.stroke = strokeColor;
            btn.style.color = strokeColor;
            btn.classList.remove('active');
        }
        
        setTimeout(() => {
            btn.classList.remove('flip-icon-3d');
        }, 450);
    }
    
    if (!favoriteFilterActive) {
        selectedZekrIds.clear();
        const footer = document.getElementById('zekrSelectionFooter');
        if (footer) footer.classList.remove('show');
        const selectBtn = document.getElementById('zekrSelectModeBtn');
        if (selectBtn) {
            selectBtn.classList.remove('active');
            selectBtn.innerHTML = ICONS.selectCheckboxEmpty;
            const isDark = document.body.classList.contains('dark');
            const strokeColor = isDark ? '#ffffff' : '#000000';
            selectBtn.style.stroke = strokeColor;
            selectBtn.style.color = strokeColor;
        }
        const addBtn = document.getElementById('zekrAddBtn');
        if (addBtn) addBtn.style.display = 'flex';
        selectModeActive = false;
        updateFooterButtons();
    }
    
    await updateHeaderCountText();
    loadZekrList();
    
    return favoriteFilterActive;
}

export async function toggleSelectMode() {
    selectModeActive = !selectModeActive;
    const footer = document.getElementById('zekrSelectionFooter');
    const btn = document.getElementById('zekrSelectModeBtn');
    const addBtn = document.getElementById('zekrAddBtn');
    const filterBtn = document.getElementById('zekrFavoriteFilterBtn');
    
    if (selectModeActive) {
        if (btn) {
            btn.classList.remove('flip-icon-3d');
            void btn.offsetWidth;
            btn.classList.add('flip-icon-3d');
            
            btn.classList.add('active');
            btn.innerHTML = ICONS.selectCheckboxChecked;
            btn.style.stroke = '#ffffff';
            btn.style.color = '#ffffff';
            
            setTimeout(() => {
                btn.classList.remove('flip-icon-3d');
            }, 450);
        }
        if (addBtn) addBtn.style.display = 'none';
        
        if (favoriteFilterActive && filterBtn) {
            favoriteFilterActive = false;
            filterBtn.innerHTML = ICONS.heartEmpty;
            filterBtn.style.fill = 'none';
            const isDark = document.body.classList.contains('dark');
            const strokeColor = isDark ? '#ffffff' : '#000000';
            filterBtn.style.stroke = strokeColor;
            filterBtn.style.color = strokeColor;
            filterBtn.classList.remove('active');
            await updateHeaderCountText();
        }
        
        selectedZekrIds.clear();
        if (footer) {
            footer.classList.add('show');
        }
        updateSelectAllButton();
        updateFooterButtons();
    } else {
        if (footer) {
            footer.classList.remove('show');
        }
        if (btn) {
            btn.classList.remove('flip-icon-3d');
            void btn.offsetWidth;
            btn.classList.add('flip-icon-3d');
            
            btn.classList.remove('active');
            btn.innerHTML = ICONS.selectCheckboxEmpty;
            const isDark = document.body.classList.contains('dark');
            const strokeColor = isDark ? '#ffffff' : '#000000';
            btn.style.stroke = strokeColor;
            btn.style.color = strokeColor;
            
            setTimeout(() => {
                btn.classList.remove('flip-icon-3d');
            }, 450);
        }
        if (addBtn) addBtn.style.display = 'flex';
        selectedZekrIds.clear();
        updateFooterButtons();
    }
    loadZekrList();
    return selectModeActive;
}

export function clearSelection() {
    selectedZekrIds.clear();
    selectModeActive = false;
    const footer = document.getElementById('zekrSelectionFooter');
    const btn = document.getElementById('zekrSelectModeBtn');
    const filterBtn = document.getElementById('zekrFavoriteFilterBtn');
    const addBtn = document.getElementById('zekrAddBtn');
    if (footer) footer.classList.remove('show');
    if (btn) {
        btn.classList.remove('active');
        btn.innerHTML = ICONS.selectCheckboxEmpty;
        const isDark = document.body.classList.contains('dark');
        const strokeColor = isDark ? '#ffffff' : '#000000';
        btn.style.stroke = strokeColor;
        btn.style.color = strokeColor;
    }
    if (filterBtn) {
        filterBtn.innerHTML = ICONS.heartEmpty;
        filterBtn.style.fill = 'none';
        const isDark = document.body.classList.contains('dark');
        const strokeColor = isDark ? '#ffffff' : '#000000';
        filterBtn.style.stroke = strokeColor;
        filterBtn.style.color = strokeColor;
        filterBtn.classList.remove('active');
    }
    if (addBtn) addBtn.style.display = 'flex';
    favoriteFilterActive = false;
    updateFooterButtons();
    updateHeaderCountText();
    loadZekrList();
}

export function resetZekrModes() {
    selectModeActive = false;
    favoriteFilterActive = false;
    selectedZekrIds.clear();
    
    const footer = document.getElementById('zekrSelectionFooter');
    const selectBtn = document.getElementById('zekrSelectModeBtn');
    const filterBtn = document.getElementById('zekrFavoriteFilterBtn');
    const addBtn = document.getElementById('zekrAddBtn');
    
    if (footer) footer.classList.remove('show');
    if (selectBtn) {
        selectBtn.classList.remove('active');
        selectBtn.innerHTML = ICONS.selectCheckboxEmpty;
        const isDark = document.body.classList.contains('dark');
        const strokeColor = isDark ? '#ffffff' : '#000000';
        selectBtn.style.stroke = strokeColor;
        selectBtn.style.color = strokeColor;
    }
    if (filterBtn) {
        filterBtn.innerHTML = ICONS.heartEmpty;
        filterBtn.style.fill = 'none';
        const isDark = document.body.classList.contains('dark');
        const strokeColor = isDark ? '#ffffff' : '#000000';
        filterBtn.style.stroke = strokeColor;
        filterBtn.style.color = strokeColor;
        filterBtn.classList.remove('active');
    }
    if (addBtn) addBtn.style.display = 'flex';
    
    updateFooterButtons();
    updateHeaderCountText();
}

export function toggleSelectAll() {
    const list = getFilteredList();
    const allIds = list.map(item => item.id);
    const allSelected = allIds.every(id => selectedZekrIds.has(id));
    
    if (allSelected) {
        allIds.forEach(id => selectedZekrIds.delete(id));
    } else {
        allIds.forEach(id => selectedZekrIds.add(id));
    }
    
    updateSelectAllButton();
    updateFooterButtons();
    loadZekrList();
}

function updateSelectAllButton() {
    const btn = document.getElementById('zekrSelectionSelectAll');
    if (!btn) return;
    const list = getFilteredList();
    if (list.length === 0) return;
    const allIds = list.map(item => item.id);
    const allSelected = allIds.every(id => selectedZekrIds.has(id));
    btn.classList.toggle('active', allSelected);
}

function getFilteredList() {
    if (favoriteFilterActive) {
        return zekrList.filter(item => cachedFavoriteIds.includes(item.id));
    }
    return zekrList;
}

export function getSelectedZekrs() {
    return zekrList.filter(item => selectedZekrIds.has(item.id));
}

export function toggleZekrSelection(id) {
    if (selectedZekrIds.has(id)) {
        selectedZekrIds.delete(id);
    } else {
        selectedZekrIds.add(id);
    }
    updateSelectAllButton();
    updateFooterButtons();
    return selectedZekrIds.has(id);
}

function heartVibrate() {
    if (navigator.vibrate) {
        navigator.vibrate([30, 50, 30, 50, 30, 80]);
    }
}

export async function shareSelectedZekrs() {
    const selected = getSelectedZekrs();
    if (selected.length === 0) {
        showToast('هیچ ذکری انتخاب نشده');
        return;
    }
    showFormatDialog(selected);
}

export async function shareSingleZekr(id, event) {
    const item = getZekrById(id);
    if (!item) {
        showToast('ذکر پیدا نشد');
        return;
    }
    
    const text = `${item.text}\n${item.meaning || ''}\nتعداد: ${item.target || 0}`;
    
    const btn = event?.currentTarget;
    if (btn) {
        const existingToast = btn.querySelector('.share-toast');
        if (existingToast) {
            existingToast.remove();
        }
        
        const toast = document.createElement('div');
        toast.className = 'share-toast show';
        toast.textContent = '✅ کپی شد';
        btn.style.position = 'relative';
        btn.appendChild(toast);
        
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => {
                toast.remove();
            }, 400);
        }, 1500);
    }
    
    if (navigator.share) {
        try {
            await navigator.share({
                title: 'ذکر',
                text: text
            });
        } catch (e) {}
    } else {
        try {
            await navigator.clipboard.writeText(text);
        } catch (e) {
            showToast('❌ خطا در اشتراک‌گذاری');
        }
    }
}

function showFormatDialog(selected) {
    const dialog = document.getElementById('customDialog');
    const box = dialog?.querySelector('.dialog-box');
    if (!box) return;

    const icon = document.getElementById('dialogIcon');
    const title = document.getElementById('dialogTitle');
    const message = document.getElementById('dialogMessage');
    const buttons = document.querySelector('.dialog-buttons');

    if (icon) icon.textContent = '📤';
    if (title) title.textContent = 'انتخاب فرمت خروجی';
    if (message) {
        message.innerHTML = `
            <div style="display:flex; flex-direction:column; gap:10px; margin-top:10px; width:100%;">
                <button class="format-option-btn" data-format="text" style="padding:12px; border:2px solid var(--border-color-strong); border-radius:10px; background:var(--bg-input); color:var(--text-primary); font-size:16px; cursor:pointer; font-family:'Love',Tahoma,'Vazirmatn',sans-serif;">
                    📝 متن (TXT)
                </button>
                <button class="format-option-btn" data-format="csv" style="padding:12px; border:2px solid var(--border-color-strong); border-radius:10px; background:var(--bg-input); color:var(--text-primary); font-size:16px; cursor:pointer; font-family:'Love',Tahoma,'Vazirmatn',sans-serif;">
                    📊 CSV
                </button>
                <button class="format-option-btn" data-format="excel" style="padding:12px; border:2px solid var(--border-color-strong); border-radius:10px; background:var(--bg-input); color:var(--text-primary); font-size:16px; cursor:pointer; font-family:'Love',Tahoma,'Vazirmatn',sans-serif;">
                    📈 اکسل (XLSX)
                </button>
            </div>
        `;
    }

    if (buttons) buttons.style.display = 'none';
    dialog?.classList.add('show');

    document.querySelectorAll('.format-option-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const format = this.dataset.format;
            dialog?.classList.remove('show');
            generateAndDownload(selected, format);
        });
    });

    const overlay = dialog?.querySelector('.dialog-overlay');
    if (overlay) {
        overlay.addEventListener('click', function() {
            dialog?.classList.remove('show');
        });
    }
}

function generateAndDownload(selected, format) {
    let content = '';
    let filename = '';
    let mimeType = '';

    const headers = ['متن ذکر', 'ترجمه', 'تعداد'];
    const rows = selected.map(item => [item.text, item.meaning || '', item.target || 0]);

    switch (format) {
        case 'text':
            content = rows.map(row => row[0]).join('\n');
            filename = 'اذکار_منتخب.txt';
            mimeType = 'text/plain';
            break;
        case 'csv':
            content = [headers.join(',')];
            rows.forEach(row => {
                content.push(row.map(cell => `"${cell}"`).join(','));
            });
            content = content.join('\n');
            filename = 'اذکار_منتخب.csv';
            mimeType = 'text/csv';
            break;
        case 'excel':
            content = [headers.join('\t')];
            rows.forEach(row => {
                content.push(row.join('\t'));
            });
            content = content.join('\n');
            filename = 'اذکار_منتخب.xlsx';
            mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
            break;
    }

    const blob = new Blob(['\uFEFF' + content], { type: mimeType + ';charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    showToast(`✅ ${selected.length} ذکر با فرمت ${format.toUpperCase()} دانلود شد`);
}

export async function deleteSelectedZekrs(callback) {
    const selected = getSelectedZekrs();
    if (selected.length === 0) {
        showToast('هیچ ذکری انتخاب نشده');
        return;
    }

    const result = await confirmDialog(
        `آیا از حذف ${selected.length} ذکر انتخاب شده مطمئن هستید؟`,
        'حذف گروهی',
        '⚠️'
    );

    if (result) {
        const deletePromises = selected.map(async (item) => {
            if (await removeZekr(item.id)) {
                const favorites = await loadFavoriteIds();
                const newFavorites = favorites.filter(fid => fid !== item.id);
                await saveFavoriteIds(newFavorites);
                await removeStorage('zekrCount_' + item.id);
                return item.id;
            }
            return null;
        });
        
        const results = await Promise.all(deletePromises);
        const deletedCount = results.filter(id => id !== null).length;
        
        selectedZekrIds.clear();
        updateFooterButtons();
        await invalidateFavoriteCache();
        if (callback) callback();
        updateSelectAllButton();
        await updateHeaderCountText();
        showToast(`✅ ${deletedCount} ذکر حذف شد`);
    }
}

export async function loadZekrList() {
    if (!DOM.zekrListContainer) return;
    if (!zekrList || zekrList.length === 0) {
        DOM.zekrListContainer.innerHTML = '<div class="zekr-item" style="text-align:center;color:#94a3b8;">هیچ ذکری ثبت نشده است</div>';
        return;
    }

    const favIds = await loadFavoriteIds();
    let filteredList = zekrList;
    
    if (favoriteFilterActive) {
        filteredList = zekrList.filter(item => favIds.includes(item.id));
        if (filteredList.length === 0) {
            DOM.zekrListContainer.innerHTML = '<div class="zekr-item" style="text-align:center;color:#94a3b8;">هیچ ذکری در منتخب‌ها وجود ندارد</div>';
            return;
        }
    }

    const defaultIds = getDefaultIds();
    const primaryColor = getComputedStyle(document.documentElement)
        .getPropertyValue('--primary-color').trim();

    const dailyLogs = await getStorage('daily_logs', {});
    const allCounts = {};
    
    for (const [dateKey, log] of Object.entries(dailyLogs)) {
        if (log && log.zekrs) {
            for (const [text, count] of Object.entries(log.zekrs)) {
                if (!allCounts[text]) {
                    allCounts[text] = 0;
                }
                allCounts[text] += count;
            }
        }
    }

    const fragment = document.createDocumentFragment();
    const container = document.createElement('div');
    
    for (const item of filteredList) {
        const isDefault = defaultIds.includes(item.id);
        const isFav = favIds.includes(item.id);
        let count = allCounts[item.text] || 0;
        count = parseInt(count) || 0;
        const isSelected = selectedZekrIds.has(item.id);
        const checkboxIcon = isSelected ? ICONS.checkboxChecked : ICONS.checkboxEmpty;

        const itemDiv = document.createElement('div');
        itemDiv.className = `zekr-item ${isDefault ? 'is-default' : ''} ${selectModeActive ? 'select-mode' : ''}`;
        itemDiv.dataset.id = item.id;
        
        itemDiv.innerHTML = `
            <span class="zekr-item-checkbox-wrapper">
                <span class="zekr-item-checkbox ${isSelected ? 'checked' : ''}" data-id="${item.id}">
                    ${checkboxIcon}
                </span>
            </span>
            <div class="zekr-item-header">
                <div class="zekr-item-content" style="cursor:pointer;">
                    <div class="zekr-item-text">${item.text}</div>
                    <div class="zekr-item-meaning">${item.meaning || '—'}</div>
                </div>
            </div>
            <div class="zekr-item-divider"></div>
            <div class="zekr-item-footer">
                <div class="zekr-item-left">
                    <button class="zekr-item-btn edit" data-id="${item.id}" title="ویرایش">${ICONS.pencil}</button>
                    <button class="zekr-item-btn delete" data-id="${item.id}" title="حذف">${ICONS.trash}</button>
                    <button class="zekr-item-btn share" data-id="${item.id}" title="اشتراک" style="position:relative;">${ICONS.shareIcon}</button>
                    <button class="zekr-item-star ${isFav ? 'active' : ''}" data-id="${item.id}" title="${isFav ? 'حذف از منتخب' : 'افزودن به منتخب'}" style="fill:${isFav ? primaryColor : 'none'}; stroke:${primaryColor}; color:${primaryColor};">${isFav ? ICONS.heartFilled : ICONS.heart}</button>
                </div>
                <div class="zekr-item-right">
                    <span class="zekr-item-target" data-id="${item.id}">تعداد: <span class="target-number">${toPersianNumber(item.target || 0)}</span></span>
                    <span class="zekr-item-stat" data-id="${item.id}">آمار: <span class="stat-number">${toPersianNumber(count)}</span></span>
                </div>
            </div>
        `;
        
        fragment.appendChild(itemDiv);
    }
    
    DOM.zekrListContainer.innerHTML = '';
    DOM.zekrListContainer.appendChild(fragment);
    
    await updateHeaderCountText();
    setupZekrEvents();
}

function setupZekrEvents() {
    document.querySelectorAll('#zekrListContainer .zekr-item-content').forEach(el => {
        el.addEventListener('click', function() {
            if (selectModeActive) return;
            const id = parseInt(this.closest('.zekr-item').dataset.id);
            loadSelectedZekr(id, getZekrById);
        });
    });

    document.querySelectorAll('#zekrListContainer .zekr-item-star').forEach(btn => {
        btn.addEventListener('click', async function(e) {
            e.stopPropagation();
            if (selectModeActive) return;
            
            const id = parseInt(this.dataset.id);
            const favorites = await loadFavoriteIds();
            const index = favorites.indexOf(id);
            const isAdding = index === -1;
            
            heartVibrate();
            
            this.classList.remove('flip-heart-3d');
            void this.offsetWidth;
            this.classList.add('flip-heart-3d');
            
            const primaryColor = getComputedStyle(document.documentElement)
                .getPropertyValue('--primary-color').trim();
            
            if (isAdding) {
                favorites.push(id);
                this.innerHTML = ICONS.heartFilled;
                this.style.fill = primaryColor;
                this.style.stroke = primaryColor;
                this.style.color = primaryColor;
                this.classList.add('active');
            } else {
                favorites.splice(index, 1);
                this.innerHTML = ICONS.heart;
                this.style.fill = 'none';
                this.style.stroke = primaryColor;
                this.style.color = primaryColor;
                this.classList.remove('active');
            }
            
            setTimeout(() => {
                this.classList.remove('flip-heart-3d');
            }, 400);
            
            await saveFavoriteIds(favorites);
            await invalidateFavoriteCache();
            await updateHeaderCountText();
            
            setTimeout(() => {
                loadZekrList();
            }, 100);
        });
    });

    document.querySelectorAll('#zekrListContainer .zekr-item-btn.share').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.stopPropagation();
            if (selectModeActive) return;
            const id = parseInt(this.dataset.id);
            shareSingleZekr(id, e);
        });
    });

    document.querySelectorAll('#zekrListContainer .zekr-item-checkbox').forEach(el => {
        el.addEventListener('click', function(e) {
            e.stopPropagation();
            const id = parseInt(this.dataset.id);
            const isSelected = toggleZekrSelection(id);
            
            this.classList.remove('flip-3d');
            void this.offsetWidth;
            this.classList.add('flip-3d');
            
            const svg = this.querySelector('svg');
            if (svg) {
                svg.classList.remove('check-mark');
                void svg.offsetWidth;
                if (isSelected) {
                    svg.classList.add('check-mark');
                }
            }
            
            setTimeout(() => {
                loadZekrList();
            }, 500);
        });
    });

    document.querySelectorAll('#zekrListContainer .zekr-item.select-mode').forEach(el => {
        el.addEventListener('click', function(e) {
            if (e.target.closest('.zekr-item-btn') || e.target.closest('.zekr-item-star') || e.target.closest('.zekr-item-checkbox')) {
                return;
            }
            const id = parseInt(this.dataset.id);
            toggleZekrSelection(id);
            loadZekrList();
        });
    });

    document.querySelectorAll('#zekrListContainer .zekr-item-btn.delete').forEach(btn => {
        btn.addEventListener('click', async function(e) {
            e.stopPropagation();
            if (selectModeActive) return;
            const id = parseInt(this.dataset.id);
            const item = getZekrById(id);
            const result = await confirmDialog(`آیا از حذف "${item?.text || 'این ذکر'}" مطمئن هستید؟`, 'حذف ذکر');
            if (result) {
                if (await removeZekr(id)) {
                    const favorites = await loadFavoriteIds();
                    const newFavorites = favorites.filter(fid => fid !== id);
                    await saveFavoriteIds(newFavorites);
                    await invalidateFavoriteCache();
                    await removeStorage('zekrCount_' + id);
                    await updateHeaderCountText();
                    loadZekrList();
                }
            }
        });
    });

    document.querySelectorAll('#zekrListContainer .zekr-item-btn.edit').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.stopPropagation();
            if (selectModeActive) return;
            const id = parseInt(this.dataset.id);
            const item = getZekrById(id);
            if (item) {
                window.editingZekrId = id;
                DOM.forms.editZekr.text.value = item.text;
                DOM.forms.editZekr.meaning.value = item.meaning || '';
                DOM.forms.editZekr.target.value = item.target || '';
                showPage('pageEditZekr');
            } else {
                showToast('ذکر پیدا نشد');
            }
        });
    });

    document.querySelectorAll('#zekrListContainer .zekr-item-target').forEach(el => {
        el.addEventListener('click', async function() {
            if (selectModeActive) return;
            const id = parseInt(this.dataset.id);
            const item = getZekrById(id);
            if (item) {
                const newTarget = await promptNumberDialog(
                    'تعداد جدید را وارد کنید:',
                    'تغییر تعداد',
                    String(item.target || 100),
                    'عدد را وارد کنید'
                );
                if (newTarget !== null && !isNaN(newTarget) && parseInt(newTarget) > 0) {
                    if (await updateZekr(id, item.text, item.meaning, parseInt(newTarget))) {
                        loadZekrList();
                        showToast('تعداد به‌روزرسانی شد');
                    }
                } else if (newTarget !== null) {
                    showToast('لطفاً عدد معتبر وارد کنید');
                }
            }
        });
    });

    document.querySelectorAll('#zekrListContainer .zekr-item-stat').forEach(el => {
        el.addEventListener('click', async function() {
            if (selectModeActive) return;
            const id = parseInt(this.dataset.id);
            
            const dailyLogs = await getStorage('daily_logs', {});
            let count = 0;
            for (const [dateKey, log] of Object.entries(dailyLogs)) {
                if (log && log.zekrs) {
                    const item = getZekrById(id);
                    if (item && log.zekrs[item.text]) {
                        count += log.zekrs[item.text];
                    }
                }
            }
            count = parseInt(count) || 0;
            
            const result = await confirmDialog(
                `آیا از ریست آمار این ذکر (${toPersianNumber(count)} بار) مطمئن هستید؟`,
                'ریست آمار'
            );
            if (result) {
                const newLogs = {};
                for (const [dateKey, log] of Object.entries(dailyLogs)) {
                    const item = getZekrById(id);
                    if (item && log && log.zekrs && log.zekrs[item.text]) {
                        newLogs[dateKey] = {
                            total: log.total - log.zekrs[item.text],
                            freeTotal: log.freeTotal || 0,
                            zekrs: {}
                        };
                        for (const [text, cnt] of Object.entries(log.zekrs)) {
                            if (text !== item.text) {
                                newLogs[dateKey].zekrs[text] = cnt;
                            }
                        }
                    } else {
                        newLogs[dateKey] = log;
                    }
                }
                await setStorage('daily_logs', newLogs);
                loadZekrList();
                showToast('✅ آمار ریست شد');
            }
        });
    });
}