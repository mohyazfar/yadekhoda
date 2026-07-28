// ============================================
// csv-import.js - وارد کردن فایل (نسخه اصلاح‌شده)
// ============================================

import { getZekrList, addZekr, loadZekrList } from './zekr-manager.js';
import { showToast, showPage } from './ui-utils.js';

let selectedCsvFile = null;
let importedData = [];
let currentDataRows = [];

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export function initCsvImport() {
    const csvImportBtn = document.getElementById('csvImportBtn');
    const csvFileInput = document.getElementById('csvFileInput');
    const csvFileName = document.getElementById('csvFileName');

    if (csvImportBtn && csvFileInput) {
        csvImportBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            csvFileInput.removeAttribute('accept');
            csvFileInput.setAttribute('accept', '*/*');
            csvFileInput.removeAttribute('capture');
            csvFileInput.value = '';
            csvFileInput.click();
        });
    }

    if (csvFileInput) {
        csvFileInput.addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (file) {
                const fileSize = (file.size / 1024).toFixed(1);
                csvFileName.textContent = 'فایل: ' + file.name + ' (' + fileSize + ' KB)';
                
                if (file.size > MAX_FILE_SIZE) {
                    showToast('❌ حجم فایل نباید بیشتر از 5 مگابایت باشد');
                    csvFileInput.value = '';
                    csvFileName.textContent = 'هیچ فایلی انتخاب نشده';
                    return;
                }
                
                selectedCsvFile = file;
                handleCsvImport(selectedCsvFile);
            } else {
                selectedCsvFile = null;
                csvFileName.textContent = 'هیچ فایلی انتخاب نشده';
            }
        });
    }
}

function parseCSV(text) {
    if (text.charCodeAt(0) === 0xFEFF) {
        text = text.slice(1);
    }
    
    text = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    
    const lines = [];
    let currentLine = [];
    let currentField = '';
    let inQuotes = false;
    
    for (let i = 0; i < text.length; i++) {
        const char = text[i];
        
        if (char === '"') {
            inQuotes = !inQuotes;
        } else if ((char === ',' || char === '،' || char === ';') && !inQuotes) {
            currentLine.push(currentField.trim());
            currentField = '';
        } else if (char === '\n' && !inQuotes) {
            currentLine.push(currentField.trim());
            if (currentLine.some(f => f !== '')) {
                lines.push(currentLine);
            }
            currentLine = [];
            currentField = '';
        } else {
            currentField += char;
        }
    }
    
    if (currentField || currentLine.length > 0) {
        currentLine.push(currentField.trim());
        if (currentLine.some(f => f !== '')) {
            lines.push(currentLine);
        }
    }
    
    return lines;
}

function handleCsvImport(file) {
    const reader = new FileReader();
    
    reader.onload = function(e) {
        try {
            const text = e.target.result;
            
            if (!text || text.trim().length === 0) {
                showToast('❌ فایل خالی است');
                return;
            }
            
            const rawLines = parseCSV(text);
            
            if (rawLines.length < 1) {
                showToast('❌ فایل خالی است یا فرمت آن صحیح نیست');
                return;
            }
            
            let startIndex = 0;
            if (rawLines.length >= 1) {
                const headerLine = rawLines[0].map(f => f.toLowerCase());
                const isHeader = headerLine.some(h => 
                    h.includes('text') || h.includes('متن') || 
                    h.includes('meaning') || h.includes('ترجمه') ||
                    h.includes('target') || h.includes('تعداد') ||
                    h.includes('نام') || h.includes('ذکر') ||
                    h.includes('بسم') || h.includes('سبحان')
                );
                if (isHeader && rawLines.length > 1) {
                    startIndex = 1;
                }
            }
            
            importedData = [];
            let errorRows = 0;
            
            for (let i = startIndex; i < rawLines.length; i++) {
                const parts = rawLines[i];
                if (parts.length < 1) {
                    errorRows++;
                    continue;
                }
                
                let text = parts[0] ? parts[0].replace(/^["']|["']$/g, '').trim() : '';
                let meaning = parts.length > 1 ? parts[1].replace(/^["']|["']$/g, '').trim() : '';
                let target = 100;
                
                if (parts.length > 2) {
                    const targetStr = parts[2].replace(/^["']|["']$/g, '').trim();
                    target = parseInt(targetStr) || 100;
                }
                
                if (!meaning && parts.length > 1 && isNaN(parts[1])) {
                    meaning = parts[1].replace(/^["']|["']$/g, '').trim();
                }
                
                if (text) {
                    importedData.push({ text, meaning, target });
                } else {
                    errorRows++;
                }
            }
            
            if (importedData.length === 0) {
                showToast('❌ هیچ داده معتبری در فایل پیدا نشد');
                return;
            }
            
            currentDataRows = importedData.slice(1);
            
            if (currentDataRows.length === 0) {
                showToast('⚠️ فقط عنوان ستون‌ها موجود است');
                return;
            }
            
            showCsvPreviewPage();
            showToast('✅ ' + currentDataRows.length + ' ردیف از فایل بارگذاری شد' + (errorRows > 0 ? ' (' + errorRows + ' خطا)' : ''));
            
        } catch (err) {
            console.error('خطا در پردازش فایل:', err);
            showToast('❌ خطا در پردازش فایل: ' + err.message);
        }
    };
    
    reader.onerror = function() {
        showToast('❌ خطا در خواندن فایل');
    };
    
    reader.readAsText(file, 'UTF-8');
}

function createCsvPreviewPage() {
    const existingPage = document.getElementById('pageCsvPreview');
    if (existingPage) {
        existingPage.remove();
    }
    
    const page = document.createElement('div');
    page.id = 'pageCsvPreview';
    page.className = 'page';
    Object.assign(page.style, {
        display: 'none',
        flexDirection: 'column',
        height: '100%',
        width: '100%',
        background: 'var(--bg-page, #f8fafc)',
        position: 'fixed',
        top: '0',
        left: '0',
        zIndex: '999'
    });
    document.body.appendChild(page);
    
    // ===== هدر =====
    const header = document.createElement('div');
    Object.assign(header.style, {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 16px',
        borderBottom: '2px solid var(--border-color-strong)',
        background: 'var(--bg-card)',
        flexShrink: '0',
        direction: 'rtl'
    });
    header.innerHTML = `
        <span style="font-size: 18px; font-weight: 700; color: var(--text-primary);">📋 پیش‌نمایش داده‌ها</span>
        <span style="font-size: 14px; color: var(--text-muted);">${currentDataRows.length} ردیف</span>
    `;
    page.appendChild(header);
    
    // ===== جدول =====
    const tableContainer = document.createElement('div');
    Object.assign(tableContainer.style, {
        flex: '1',
        overflowY: 'auto',
        padding: '12px 16px',
        direction: 'rtl'
    });
    
    const tableWrapper = document.createElement('div');
    Object.assign(tableWrapper.style, {
        border: '2px solid var(--border-color-strong)',
        borderRadius: '14px',
        overflow: 'hidden',
        background: 'var(--bg-card)',
        boxShadow: '0 2px 12px var(--shadow-color)'
    });
    
    const table = document.createElement('table');
    Object.assign(table.style, {
        width: '100%',
        borderCollapse: 'collapse',
        direction: 'rtl',
        fontSize: '14px'
    });
    
    // ===== هدر جدول =====
    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');
    Object.assign(headerRow.style, {
        borderBottom: '2px solid var(--border-color-strong)',
        background: 'var(--bg-input)'
    });
    
    const headers = ['#', 'متن ذکر', 'ترجمه', 'تعداد', 'حذف'];
    const headerStyles = [
        'padding: 10px 12px; text-align: center; font-size: 11px; color: var(--text-muted);',
        'padding: 10px 12px; text-align: right; font-size: 11px; color: var(--text-muted);',
        'padding: 10px 12px; text-align: right; font-size: 11px; color: var(--text-muted);',
        'padding: 10px 12px; text-align: center; font-size: 11px; color: var(--text-muted);',
        'padding: 10px 12px; text-align: center; font-size: 11px; color: var(--text-muted);'
    ];
    
    headers.forEach((text, index) => {
        const th = document.createElement('th');
        th.textContent = text;
        th.style.cssText = headerStyles[index];
        headerRow.appendChild(th);
    });
    thead.appendChild(headerRow);
    table.appendChild(thead);
    
    // ===== بدنه جدول =====
    const tbody = document.createElement('tbody');
    
    currentDataRows.forEach((item, index) => {
        const row = document.createElement('tr');
        Object.assign(row.style, {
            borderBottom: '1px solid var(--border-color-strong)'
        });
        
        // شماره ردیف
        const tdNum = document.createElement('td');
        tdNum.textContent = String(index + 1);
        tdNum.style.cssText = 'padding: 8px 10px; text-align: center; font-size: 13px; color: var(--text-muted); font-weight: 600; background: var(--bg-input);';
        row.appendChild(tdNum);
        
        // متن ذکر
        const tdText = document.createElement('td');
        tdText.textContent = item.text;
        tdText.style.cssText = 'padding: 8px 10px; text-align: right; font-size: 15px; color: var(--text-primary); font-family: "Quran","Love",sans-serif;';
        row.appendChild(tdText);
        
        // ترجمه
        const tdMeaning = document.createElement('td');
        tdMeaning.textContent = item.meaning || '—';
        tdMeaning.style.cssText = 'padding: 8px 10px; text-align: right; font-size: 13px; color: var(--text-secondary);';
        row.appendChild(tdMeaning);
        
        // تعداد
        const tdTarget = document.createElement('td');
        tdTarget.textContent = String(item.target);
        tdTarget.style.cssText = 'padding: 8px 10px; text-align: center; font-size: 14px; color: var(--primary-color); font-weight: 700;';
        row.appendChild(tdTarget);
        
        // دکمه حذف
        const tdDelete = document.createElement('td');
        tdDelete.style.cssText = 'padding: 8px 10px; text-align: center;';
        
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'delete-row-btn';
        deleteBtn.dataset.index = String(index);
        deleteBtn.style.cssText = 'background: none; border: none; cursor: pointer; padding: 4px; color: var(--primary-color);';
        deleteBtn.innerHTML = `
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" style="width: 20px; height: 20px;">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
        `;
        tdDelete.appendChild(deleteBtn);
        row.appendChild(tdDelete);
        
        tbody.appendChild(row);
    });
    
    table.appendChild(tbody);
    tableWrapper.appendChild(table);
    tableContainer.appendChild(tableWrapper);
    page.appendChild(tableContainer);
    
    // ===== فوتر =====
    const footer = document.createElement('div');
    Object.assign(footer.style, {
        display: 'flex',
        justifyContent: 'center',
        gap: '16px',
        padding: '16px 20px',
        borderTop: '2px solid var(--border-color-strong)',
        background: 'var(--bg-card)',
        flexShrink: '0',
        direction: 'rtl'
    });
    
    const importBtn = document.createElement('button');
    importBtn.textContent = '📥 وارد کردن ذکرها';
    Object.assign(importBtn.style, {
        padding: 'clamp(12px, 2vh, 16px)',
        fontSize: 'clamp(16px, 2.8vw, 20px)',
        fontWeight: '700',
        borderRadius: 'clamp(10px, 2vh, 14px)',
        border: '2px solid var(--primary-color, #0ea5e9)',
        background: 'var(--primary-color, #0ea5e9)',
        color: '#ffffff',
        cursor: 'pointer',
        fontFamily: '"Love",Tahoma,"Vazirmatn",sans-serif',
        transition: 'all 0.2s ease',
        boxShadow: '0 4px 16px var(--shadow-color), 0 0 30px var(--primary-color-glow)',
        flex: '1',
        maxWidth: '300px'
    });
    footer.appendChild(importBtn);
    
    const cancelBtn = document.createElement('button');
    cancelBtn.textContent = '✖ انصراف';
    Object.assign(cancelBtn.style, {
        padding: 'clamp(12px, 2vh, 16px)',
        fontSize: 'clamp(16px, 2.8vw, 20px)',
        fontWeight: '700',
        borderRadius: 'clamp(10px, 2vh, 14px)',
        border: '2px solid #ef4444',
        background: 'transparent',
        color: '#ef4444',
        cursor: 'pointer',
        fontFamily: '"Love",Tahoma,"Vazirmatn",sans-serif',
        transition: 'all 0.2s ease',
        flex: '1',
        maxWidth: '200px'
    });
    footer.appendChild(cancelBtn);
    
    page.appendChild(footer);
    page.style.display = 'flex';
    
    // ===== رویدادها =====
    importBtn.addEventListener('click', async function() {
        if (currentDataRows.length === 0) {
            showToast('هیچ داده‌ای برای وارد کردن وجود ندارد');
            return;
        }
        await confirmImport();
    });
    
    cancelBtn.addEventListener('click', function() {
        currentDataRows = [];
        importedData = [];
        selectedCsvFile = null;
        document.getElementById('pageCsvPreview')?.remove();
        showPage('pageAddZekr');
        
        const formSection = document.getElementById('addZekrFormSection');
        const divider = document.getElementById('addZekrDivider');
        const importTitle = document.getElementById('addZekrImportTitle');
        const importBox = document.getElementById('addZekrImportBox');
        const csvInfo = document.getElementById('addZekrCsvInfo');
        const csvFileInput = document.getElementById('csvFileInput');
        const csvFileName = document.getElementById('csvFileName');
        
        if (formSection) formSection.classList.remove('hidden');
        if (divider) divider.classList.remove('hidden');
        if (importTitle) importTitle.classList.remove('hidden');
        if (importBox) importBox.classList.remove('hidden');
        if (csvInfo) csvInfo.classList.remove('hidden');
        if (csvFileInput) csvFileInput.value = '';
        if (csvFileName) csvFileName.textContent = 'هیچ فایلی انتخاب نشده';
        
        showToast('❌ انصراف از وارد کردن');
    });
    
    // ===== حذف ردیف‌ها =====
    page.querySelectorAll('.delete-row-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const index = parseInt(this.dataset.index);
            currentDataRows.splice(index, 1);
            if (currentDataRows.length === 0) {
                showToast('همه ردیف‌ها حذف شدند');
                document.getElementById('pageCsvPreview')?.remove();
                showPage('pageAddZekr');
            } else {
                createCsvPreviewPage();
            }
        });
    });
}

function showCsvPreviewPage() {
    createCsvPreviewPage();
}

async function confirmImport() {
    let addedCount = 0;
    let skippedCount = 0;
    const existingZekrs = getZekrList().map(z => z.text);
    
    const addPromises = currentDataRows.map(async (item) => {
        if (existingZekrs.includes(item.text)) {
            skippedCount++;
            return null;
        }
        await addZekr(item.text, item.meaning, item.target);
        addedCount++;
        return item.text;
    });
    
    await Promise.all(addPromises);
    
    let message = '✅ ' + addedCount + ' ذکر با موفقیت اضافه شد';
    if (skippedCount > 0) message += '، ⚠️ ' + skippedCount + ' ذکر تکراری';
    showToast(message);
    
    currentDataRows = [];
    importedData = [];
    selectedCsvFile = null;
    
    document.getElementById('pageCsvPreview')?.remove();
    showPage('pageAddZekr');
    
    const formSection = document.getElementById('addZekrFormSection');
    const divider = document.getElementById('addZekrDivider');
    const importTitle = document.getElementById('addZekrImportTitle');
    const importBox = document.getElementById('addZekrImportBox');
    const csvInfo = document.getElementById('addZekrCsvInfo');
    const csvFileInput = document.getElementById('csvFileInput');
    const csvFileName = document.getElementById('csvFileName');
    
    if (formSection) formSection.classList.remove('hidden');
    if (divider) divider.classList.remove('hidden');
    if (importTitle) importTitle.classList.remove('hidden');
    if (importBox) importBox.classList.remove('hidden');
    if (csvInfo) csvInfo.classList.remove('hidden');
    if (csvFileInput) csvFileInput.value = '';
    if (csvFileName) csvFileName.textContent = 'هیچ فایلی انتخاب نشده';
    
    await loadZekrList();
}

export function getSelectedCsvFile() {
    return selectedCsvFile;
}