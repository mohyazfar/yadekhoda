// ============================================
// routines-manager.js - مدیریت روال‌ها (نسخه کامل نهایی)
// ============================================

import { getStorage, setStorage, removeStorage } from '../utils/storage.js';
import { showToast, showPage } from './ui-utils.js';
import { getZekrList } from './zekr-manager.js';
import { confirmDialog } from '../utils/dialog.js';
import { toPersianNumber, toEnglishNumber } from '../utils/persian.js';
import { ICONS } from '../icons.js';

const STORAGE_KEY = 'routines';
let routines = [];
let selectedZekrIds = new Set();
let editingRoutineId = null;
let editingRoutineData = null;

export async function initRoutines() {
    const saved = await getStorage(STORAGE_KEY, []);
    routines = saved;
    return routines;
}

async function saveRoutines() {
    await setStorage(STORAGE_KEY, routines);
}

export function getRoutines() {
    return routines;
}

export function getRoutineById(id) {
    return routines.find(r => r.id === id);
}

export async function addRoutine(title, zekrs) {
    const newId = Math.max(0, ...routines.map(r => r.id), 0) + 1;
    const newRoutine = {
        id: newId,
        title: title.trim(),
        zekrs: zekrs.map(z => ({
            id: z.id || null,
            text: z.text,
            meaning: z.meaning || '',
            target: z.target || 1,
            isCustom: z.isCustom || false
        })),
        createdAt: new Date().toISOString()
    };
    routines.push(newRoutine);
    await saveRoutines();
    return newId;
}

export async function updateRoutine(id, title, zekrs) {
    const routine = getRoutineById(id);
    if (!routine) return false;
    routine.title = title.trim();
    routine.zekrs = zekrs.map(z => ({
        id: z.id || null,
        text: z.text,
        meaning: z.meaning || '',
        target: z.target || 1,
        isCustom: z.isCustom || false
    }));
    await saveRoutines();
    return true;
}

export async function deleteRoutine(id) {
    routines = routines.filter(r => r.id !== id);
    await saveRoutines();
    return true;
}

export function getSelectedZekrs() {
    return selectedZekrIds;
}

export function toggleZekrSelection(id) {
    if (selectedZekrIds.has(id)) {
        selectedZekrIds.delete(id);
    } else {
        selectedZekrIds.add(id);
    }
    return selectedZekrIds;
}

export function clearSelection() {
    selectedZekrIds.clear();
}

export function getSelectedZekrList() {
    const allZekrs = getZekrList();
    return allZekrs.filter(z => selectedZekrIds.has(z.id));
}

export async function loadRoutinesList() {
    const container = document.getElementById('routinesListContainer');
    if (!container) return;

    if (routines.length === 0) {
        container.innerHTML = `
            <div class="routine-empty">
                <div class="routine-empty-icon">📋</div>
                <div class="routine-empty-text">هیچ روالی ثبت نشده است</div>
                <div class="routine-empty-text" style="font-size:14px;color:var(--text-muted);">
                    روی دکمه <span class="highlight">➕</span> کلیک کنید تا یک روال جدید بسازید
                </div>
            </div>
        `;
        return;
    }

    const fragment = document.createDocumentFragment();

    for (const routine of routines) {
        const item = document.createElement('div');
        item.className = 'routine-item';
        item.dataset.id = routine.id;

        const totalZekrs = routine.zekrs.length;
        const totalTarget = routine.zekrs.reduce((sum, z) => sum + z.target, 0);

        item.innerHTML = `
            <div class="routine-item-header">
                <div class="routine-item-title">${routine.title}</div>
                <div class="routine-item-subtitle">${toPersianNumber(totalZekrs)} ذکر · ${toPersianNumber(totalTarget)} مرتبه</div>
            </div>
            <div class="routine-item-divider"></div>
            <div class="routine-item-footer">
                <div class="routine-item-left">
                    <button class="routine-item-btn edit" data-id="${routine.id}" title="ویرایش">
                        ${ICONS.pencil}
                    </button>
                    <button class="routine-item-btn delete" data-id="${routine.id}" title="حذف">
                        ${ICONS.trash}
                    </button>
                </div>
                <div class="routine-item-right">
                    <span class="routine-item-count">ذکرها: <span class="count-number">${toPersianNumber(totalZekrs)}</span></span>
                </div>
            </div>
        `;

        fragment.appendChild(item);
    }

    container.innerHTML = '';
    container.appendChild(fragment);

    updateRoutinesCount();
    setupRoutineEvents();
}

function updateRoutinesCount() {
    const countEl = document.getElementById('routinesCount');
    if (countEl) {
        countEl.textContent = toPersianNumber(routines.length);
    }
}

function setupRoutineEvents() {
    document.querySelectorAll('.routine-item').forEach(item => {
        item.addEventListener('click', function(e) {
            if (e.target.closest('.routine-item-btn')) return;
            const id = parseInt(this.dataset.id);
            startRoutine(id);
        });
    });

    document.querySelectorAll('.routine-item-btn.edit').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.stopPropagation();
            const id = parseInt(this.dataset.id);
            editRoutine(id);
        });
    });

    document.querySelectorAll('.routine-item-btn.delete').forEach(btn => {
        btn.addEventListener('click', async function(e) {
            e.stopPropagation();
            const id = parseInt(this.dataset.id);
            const routine = getRoutineById(id);
            const result = await confirmDialog(
                `آیا از حذف روال "${routine?.title || 'این روال'}" مطمئن هستید؟`,
                'حذف روال',
                '🗑️'
            );
            if (result) {
                await deleteRoutine(id);
                await loadRoutinesList();
                showToast('✅ روال حذف شد');
            }
        });
    });
}

export function showRoutinesPage() {
    showPage('pageRoutines');
    setTimeout(() => {
        loadRoutinesList();
    }, 50);
}

export async function showRoutineBuilder() {
    selectedZekrIds.clear();
    editingRoutineId = null;
    editingRoutineData = null;
    showPage('pageRoutineBuilder');
    await loadRoutineBuilderList();
    
    const headerText = document.querySelector('#pageRoutineBuilder .routines-header-count-text');
    if (headerText) {
        headerText.textContent = 'انتخاب ذکر/ها';
    }
    
    const confirmBtn = document.getElementById('routineBuilderConfirmBtn');
    if (confirmBtn) {
        confirmBtn.textContent = 'ادامه';
    }
}

async function loadRoutineBuilderList() {
    const container = document.getElementById('routineBuilderList');
    if (!container) return;

    const allZekrs = getZekrList();
    if (allZekrs.length === 0) {
        container.innerHTML = `
            <div class="routine-empty">
                <div class="routine-empty-icon">📭</div>
                <div class="routine-empty-text">هیچ ذکری وجود ندارد</div>
                <div class="routine-empty-text" style="font-size:14px;color:var(--text-muted);">
                    ابتدا در صفحه ذکرها، ذکر جدید اضافه کنید
                </div>
            </div>
        `;
        return;
    }

    const fragment = document.createDocumentFragment();

    for (const zekr of allZekrs) {
        const isSelected = selectedZekrIds.has(zekr.id);
        const item = document.createElement('div');
        item.className = 'routine-builder-item';
        item.dataset.id = zekr.id;

        const checkboxIcon = isSelected ? ICONS.checkboxChecked : ICONS.checkboxEmpty;

        item.innerHTML = `
            <div class="routine-builder-item-checkbox ${isSelected ? 'checked' : ''}" data-id="${zekr.id}">
                ${checkboxIcon}
            </div>
            <div class="routine-builder-item-content">
                <div class="routine-builder-item-text">${zekr.text}</div>
                <div class="routine-builder-item-meaning">${zekr.meaning || '—'}</div>
            </div>
        `;

        fragment.appendChild(item);
    }

    container.innerHTML = '';
    container.appendChild(fragment);

    updateBuilderCount();
    setupBuilderEvents();
}

function setupBuilderEvents() {
    document.querySelectorAll('.routine-builder-item').forEach(item => {
        item.addEventListener('click', function() {
            const id = parseInt(this.dataset.id);
            toggleZekrSelection(id);
            loadRoutineBuilderList();
        });
    });

    document.querySelectorAll('.routine-builder-item-checkbox').forEach(el => {
        el.addEventListener('click', function(e) {
            e.stopPropagation();
            const id = parseInt(this.dataset.id);
            toggleZekrSelection(id);
            loadRoutineBuilderList();
        });
    });

    const cancelBtn = document.getElementById('routineBuilderCancelBtn');
    if (cancelBtn) {
        cancelBtn.addEventListener('click', function() {
            selectedZekrIds.clear();
            showRoutinesPage();
        });
    }

    const confirmBtn = document.getElementById('routineBuilderConfirmBtn');
    if (confirmBtn) {
        confirmBtn.addEventListener('click', function() {
            const selected = getSelectedZekrList();
            if (selected.length === 0) {
                showToast('⚠️ حداقل یک ذکر انتخاب کنید');
                return;
            }
            
            if (editingRoutineId) {
                showRoutineSetup(selected, editingRoutineId);
            } else {
                showRoutineSetup(selected);
            }
        });
    }
}

function updateBuilderCount() {
    const countEl = document.getElementById('routineBuilderCount');
    const footer = document.getElementById('routineBuilderFooter');
    const confirmBtn = document.getElementById('routineBuilderConfirmBtn');
    
    if (countEl) {
        countEl.textContent = toPersianNumber(selectedZekrIds.size);
    }
    
    if (footer) {
        if (selectedZekrIds.size > 0) {
            footer.classList.add('show');
        } else {
            footer.classList.remove('show');
        }
    }
    
    if (confirmBtn) {
        confirmBtn.disabled = selectedZekrIds.size === 0;
    }
}

export function editRoutine(id) {
    const routine = getRoutineById(id);
    if (!routine) {
        showToast('روال پیدا نشد');
        return;
    }

    editingRoutineId = id;
    editingRoutineData = routine;
    selectedZekrIds.clear();
    routine.zekrs.forEach(z => {
        if (z.id) {
            selectedZekrIds.add(z.id);
        }
    });

    showRoutineSetup(routine.zekrs, id);
}

function showRoutineSetup(selectedZekrs, editId = null) {
    showPage('pageRoutineSetup');
    setTimeout(() => {
        loadRoutineSetupList(selectedZekrs, editId);
    }, 100);
}

function loadRoutineSetupList(selectedZekrs, editId = null) {
    const container = document.getElementById('routineSetupList');
    const titleInput = document.getElementById('routineTitleInput');

    if (!container) return;

    if (titleInput) {
        if (editId && editingRoutineData) {
            titleInput.value = editingRoutineData.title;
        } else {
            titleInput.value = '';
        }
        setTimeout(() => {
            titleInput.focus();
            titleInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 200);
    }

    const fragment = document.createDocumentFragment();

    for (const zekr of selectedZekrs) {
        const item = document.createElement('div');
        item.className = 'routine-setup-item';
        const itemId = zekr.id || 'custom_' + Date.now() + '_' + Math.random();
        item.dataset.id = itemId;

        const target = zekr.target || 1;

        item.innerHTML = `
            <div class="routine-setup-item-row">
                <div class="routine-setup-item-text">${zekr.text}</div>
                <div class="routine-setup-item-count">
                    <span class="routine-setup-item-count-label">تعداد</span>
                    <input type="number" class="routine-setup-item-input" data-id="${itemId}" value="${target}" min="1" step="1" placeholder="">
                </div>
            </div>
            <div class="routine-setup-item-actions">
                <button class="routine-setup-item-btn edit" data-id="${itemId}" title="ویرایش">
                    <svg viewBox="0 0 36 36" fill="none" stroke="currentColor" stroke-width="2" style="width:20px;height:20px;">
                        <path d="M33.87,8.32,28,2.42a2.07,2.07,0,0,0-2.92,0L4.27,23.2l-1.9,8.2a2.06,2.06,0,0,0,2,2.5,2.14,2.14,0,0,0,.43,0L13.09,32,33.87,11.24A2.07,2.07,0,0,0,33.87,8.32ZM12.09,30.2,4.32,31.83l1.77-7.62L21.66,8.7l6,6ZM29,13.25l-6-6,3.48-3.46,5.9,6Z"/>
                    </svg>
                </button>
                <button class="routine-setup-item-btn delete" data-id="${itemId}" title="حذف">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="width:20px;height:20px;">
                        <line x1="4" y1="4" x2="20" y2="20" stroke-linecap="round"/>
                        <line x1="20" y1="4" x2="4" y2="20" stroke-linecap="round"/>
                    </svg>
                </button>
            </div>
        `;

        fragment.appendChild(item);
    }

    const addItem = document.createElement('div');
    addItem.className = 'routine-setup-item add-manual';
    addItem.innerHTML = `
        <button class="routine-setup-add-manual-btn">➕ افزودن دستی</button>
    `;
    fragment.appendChild(addItem);

    container.innerHTML = '';
    container.appendChild(fragment);

    document.querySelectorAll('.routine-setup-item-input').forEach(input => {
        input.addEventListener('focus', function() {
            setTimeout(() => {
                this.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, 300);
        });
        
        input.addEventListener('input', function() {
            let val = parseInt(this.value);
            if (isNaN(val) || val < 1) {
                this.value = '';
            }
            validateSetupForm();
        });
    });

    document.querySelectorAll('.routine-setup-item-btn.delete').forEach(btn => {
        btn.addEventListener('click', function() {
            const item = this.closest('.routine-setup-item');
            if (item) {
                const isCustom = item.dataset.id && item.dataset.id.startsWith('custom_');
                if (isCustom) {
                    item.remove();
                } else {
                    const id = parseInt(item.dataset.id);
                    if (id) {
                        selectedZekrIds.delete(id);
                    }
                    item.remove();
                }
                validateSetupForm();
                showToast('🗑️ ذکر حذف شد');
            }
        });
    });

    document.querySelectorAll('.routine-setup-item-btn.edit').forEach(btn => {
        btn.addEventListener('click', function() {
            const item = this.closest('.routine-setup-item');
            if (item) {
                const textEl = item.querySelector('.routine-setup-item-text');
                const inputEl = item.querySelector('.routine-setup-item-input');
                const currentText = textEl?.textContent || '';
                const currentTarget = inputEl?.value || 1;

                showEditZekrDialog(currentText, currentTarget, item);
            }
        });
    });

    document.querySelector('.routine-setup-add-manual-btn')?.addEventListener('click', function() {
        showAddManualDialog();
    });

    if (titleInput) {
        titleInput.addEventListener('input', validateSetupForm);
    }

    const cancelBtn = document.getElementById('routineSetupCancelBtn');
    if (cancelBtn) {
        const newCancelBtn = cancelBtn.cloneNode(true);
        cancelBtn.parentNode.replaceChild(newCancelBtn, cancelBtn);
        newCancelBtn.addEventListener('click', function() {
            selectedZekrIds.clear();
            editingRoutineId = null;
            editingRoutineData = null;
            showRoutinesPage();
        });
    }

    const confirmBtn = document.getElementById('routineSetupConfirmBtn');
    if (confirmBtn) {
        const newConfirmBtn = confirmBtn.cloneNode(true);
        confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);
        newConfirmBtn.addEventListener('click', async function() {
            const title = titleInput?.value.trim();
            if (!title) {
                showToast('⚠️ لطفاً عنوان روال را وارد کنید');
                return;
            }

            const zekrs = [];
            document.querySelectorAll('.routine-setup-item:not(.add-manual)').forEach(item => {
                const id = item.dataset.id;
                const input = item.querySelector('.routine-setup-item-input');
                let target = parseInt(input?.value || 1);
                if (isNaN(target) || target < 1) target = 1;
                
                const textEl = item.querySelector('.routine-setup-item-text');
                const text = textEl?.textContent || '';
                
                const isCustom = id && id.startsWith('custom_');
                const zekr = getZekrList().find(z => z.id === parseInt(id));
                
                if (zekr) {
                    zekrs.push({
                        id: zekr.id,
                        text: zekr.text,
                        meaning: zekr.meaning || '',
                        target: target,
                        isCustom: false
                    });
                } else if (text) {
                    zekrs.push({
                        id: null,
                        text: text,
                        meaning: '',
                        target: target,
                        isCustom: true
                    });
                }
            });

            if (zekrs.length === 0) {
                showToast('⚠️ هیچ ذکری انتخاب نشده');
                return;
            }

            if (editId) {
                await updateRoutine(editId, title, zekrs);
                showToast('✅ روال با موفقیت ویرایش شد');
            } else {
                await addRoutine(title, zekrs);
                showToast('✅ روال با موفقیت ساخته شد');
            }
            
            selectedZekrIds.clear();
            editingRoutineId = null;
            editingRoutineData = null;
            showRoutinesPage();
        });
    }

    validateSetupForm();
}

function showEditZekrDialog(currentText, currentTarget, item) {
    const dialog = document.getElementById('customDialog');
    if (!dialog) return;

    const icon = document.getElementById('dialogIcon');
    const title = document.getElementById('dialogTitle');
    const message = document.getElementById('dialogMessage');
    const inputContainer = document.getElementById('dialogInputContainer');
    const confirmBtn = document.getElementById('dialogConfirm');
    const cancelBtn = document.getElementById('dialogCancel');

    if (icon) icon.textContent = '✏️';
    if (title) title.textContent = 'ویرایش ذکر';
    if (message) message.textContent = 'متن و تعداد ذکر را تغییر دهید:';
    
    if (inputContainer) {
        inputContainer.style.display = 'block';
        inputContainer.innerHTML = `
            <input type="text" id="dialogEditText" class="dialog-input" value="${currentText}" placeholder="متن ذکر" style="margin-bottom:8px; font-family:'Quran','Love',Tahoma,sans-serif;">
            <input type="number" id="dialogEditTarget" class="dialog-input" value="${currentTarget}" min="1" placeholder="تعداد">
        `;
        setTimeout(() => {
            document.getElementById('dialogEditText')?.focus();
        }, 200);
    }

    const existingCheckbox = inputContainer?.querySelector('.dialog-checkbox-wrapper');
    if (existingCheckbox) existingCheckbox.remove();

    if (confirmBtn) {
        confirmBtn.textContent = 'ذخیره';
        const newConfirmBtn = confirmBtn.cloneNode(true);
        confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);
        newConfirmBtn.addEventListener('click', function() {
            const textInput = document.getElementById('dialogEditText');
            const targetInput = document.getElementById('dialogEditTarget');
            const newText = textInput?.value.trim();
            let newTarget = parseInt(targetInput?.value || 1);
            if (isNaN(newTarget) || newTarget < 1) newTarget = 1;

            if (!newText) {
                showToast('⚠️ لطفاً متن ذکر را وارد کنید');
                textInput?.focus();
                return;
            }

            const textEl = item.querySelector('.routine-setup-item-text');
            const inputEl = item.querySelector('.routine-setup-item-input');
            if (textEl) textEl.textContent = newText;
            if (inputEl) inputEl.value = newTarget;

            if (item.dataset.id && !item.dataset.id.startsWith('custom_')) {
                const zekr = getZekrList().find(z => z.id === parseInt(item.dataset.id));
                if (zekr) {
                    const zekrIndex = getZekrList().findIndex(z => z.id === parseInt(item.dataset.id));
                    if (zekrIndex !== -1) {
                        getZekrList()[zekrIndex].text = newText;
                    }
                }
            }

            validateSetupForm();
            showToast('✅ ذکر ویرایش شد');
            dialog.classList.remove('show');
        });
    }

    if (cancelBtn) {
        const newCancelBtn = cancelBtn.cloneNode(true);
        cancelBtn.parentNode.replaceChild(newCancelBtn, cancelBtn);
        newCancelBtn.textContent = 'انصراف';
        newCancelBtn.addEventListener('click', function() {
            dialog.classList.remove('show');
        });
    }

    const overlay = dialog.querySelector('.dialog-overlay');
    if (overlay) {
        overlay.onclick = function() {
            dialog.classList.remove('show');
        };
    }

    dialog.classList.add('show');
}

function showAddManualDialog() {
    const dialog = document.getElementById('customDialog');
    if (!dialog) return;

    const icon = document.getElementById('dialogIcon');
    const title = document.getElementById('dialogTitle');
    const message = document.getElementById('dialogMessage');
    const inputContainer = document.getElementById('dialogInputContainer');
    const confirmBtn = document.getElementById('dialogConfirm');
    const cancelBtn = document.getElementById('dialogCancel');

    if (icon) icon.textContent = '✏️';
    if (title) title.textContent = 'افزودن ذکر دستی';
    if (message) message.textContent = 'متن ذکر را وارد کنید:';
    
    if (inputContainer) {
        inputContainer.style.display = 'block';
        const input = document.getElementById('dialogInput');
        if (input) {
            input.type = 'text';
            input.value = '';
            input.placeholder = 'متن ذکر را بنویسید...';
            input.className = 'dialog-input';
            setTimeout(() => {
                input.focus();
                input.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, 200);
        }
    }

    const existingCheckbox = inputContainer?.querySelector('.dialog-checkbox-wrapper');
    if (existingCheckbox) existingCheckbox.remove();

    if (confirmBtn) {
        confirmBtn.textContent = 'افزودن';
        const newConfirmBtn = confirmBtn.cloneNode(true);
        confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);
        newConfirmBtn.addEventListener('click', function() {
            const input = document.getElementById('dialogInput');
            const text = input?.value?.trim();
            if (!text) {
                showToast('⚠️ لطفاً متن ذکر را وارد کنید');
                input?.focus();
                return;
            }

            const container = document.getElementById('routineSetupList');
            if (container) {
                const item = document.createElement('div');
                item.className = 'routine-setup-item';
                const id = 'custom_' + Date.now() + '_' + Math.random();
                item.dataset.id = id;

                item.innerHTML = `
                    <div class="routine-setup-item-row">
                        <div class="routine-setup-item-text">${text}</div>
                        <div class="routine-setup-item-count">
                            <span class="routine-setup-item-count-label">تعداد</span>
                            <input type="number" class="routine-setup-item-input" data-id="${id}" value="1" min="1" step="1" placeholder="">
                        </div>
                    </div>
                    <div class="routine-setup-item-actions">
                        <button class="routine-setup-item-btn edit" data-id="${id}" title="ویرایش">
                            <svg viewBox="0 0 36 36" fill="none" stroke="currentColor" stroke-width="2" style="width:20px;height:20px;">
                                <path d="M33.87,8.32,28,2.42a2.07,2.07,0,0,0-2.92,0L4.27,23.2l-1.9,8.2a2.06,2.06,0,0,0,2,2.5,2.14,2.14,0,0,0,.43,0L13.09,32,33.87,11.24A2.07,2.07,0,0,0,33.87,8.32ZM12.09,30.2,4.32,31.83l1.77-7.62L21.66,8.7l6,6ZM29,13.25l-6-6,3.48-3.46,5.9,6Z"/>
                            </svg>
                        </button>
                        <button class="routine-setup-item-btn delete" data-id="${id}" title="حذف">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="width:20px;height:20px;">
                                <line x1="4" y1="4" x2="20" y2="20" stroke-linecap="round"/>
                                <line x1="20" y1="4" x2="4" y2="20" stroke-linecap="round"/>
                            </svg>
                        </button>
                    </div>
                `;

                const addBtn = container.querySelector('.add-manual');
                if (addBtn) {
                    container.insertBefore(item, addBtn);
                } else {
                    container.appendChild(item);
                }

                const inputEl = item.querySelector('.routine-setup-item-input');
                if (inputEl) {
                    inputEl.addEventListener('focus', function() {
                        setTimeout(() => {
                            this.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        }, 300);
                    });
                    inputEl.addEventListener('input', function() {
                        let val = parseInt(this.value);
                        if (isNaN(val) || val < 1) {
                            this.value = '';
                        }
                        validateSetupForm();
                    });
                }

                const removeBtn = item.querySelector('.routine-setup-item-btn.delete');
                if (removeBtn) {
                    removeBtn.addEventListener('click', function() {
                        item.remove();
                        validateSetupForm();
                        showToast('🗑️ ذکر حذف شد');
                    });
                }

                const editBtn = item.querySelector('.routine-setup-item-btn.edit');
                if (editBtn) {
                    editBtn.addEventListener('click', function() {
                        const textEl = item.querySelector('.routine-setup-item-text');
                        const inputEl = item.querySelector('.routine-setup-item-input');
                        const currentText = textEl?.textContent || '';
                        const currentTarget = inputEl?.value || 1;
                        showEditZekrDialog(currentText, currentTarget, item);
                    });
                }

                validateSetupForm();
                showToast('✅ ذکر دستی اضافه شد');
            }

            dialog.classList.remove('show');
        });
    }

    if (cancelBtn) {
        const newCancelBtn = cancelBtn.cloneNode(true);
        cancelBtn.parentNode.replaceChild(newCancelBtn, cancelBtn);
        newCancelBtn.textContent = 'انصراف';
        newCancelBtn.addEventListener('click', function() {
            dialog.classList.remove('show');
        });
    }

    const overlay = dialog.querySelector('.dialog-overlay');
    if (overlay) {
        overlay.onclick = function() {
            dialog.classList.remove('show');
        };
    }

    dialog.classList.add('show');
}

function validateSetupForm() {
    const titleInput = document.getElementById('routineTitleInput');
    const confirmBtn = document.getElementById('routineSetupConfirmBtn');
    
    if (!confirmBtn) return;
    
    const title = titleInput?.value.trim() || '';
    const hasZekrs = document.querySelectorAll('.routine-setup-item:not(.add-manual)').length > 0;
    
    confirmBtn.disabled = !(title && hasZekrs);
}

export async function startRoutine(id) {
    const routine = getRoutineById(id);
    if (!routine) {
        showToast('روال پیدا نشد');
        return;
    }

    showPage('pageRoutineCounter');
    
    try {
        const { initRoutineCounter } = await import('./routine-counter.js');
        setTimeout(() => {
            initRoutineCounter(routine);
        }, 300);
    } catch (e) {
        console.error('❌ خطا در بارگذاری شمارنده روال:', e);
        showToast('⚠️ خطا در شروع روال');
        showPage('pageRoutines');
    }
}