// ============================================
// reminders-manager.js - مدیریت یادآورها
// ============================================

import { getStorage, setStorage, removeStorage } from '../utils/storage.js';
import { showToast, showPage } from './ui-utils.js';
import { getRoutines } from './routines-manager.js';
import { confirmDialog } from '../utils/dialog.js';
import { toPersianNumber } from '../utils/persian.js';
import { ICONS } from '../icons.js';

const STORAGE_KEY = 'reminders';
let reminders = [];
let reminderCheckerInterval = null;

// ===== روزهای هفته =====
const WEEKDAYS = ['شنبه', 'یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنجشنبه', 'جمعه'];
const WEEKDAYS_SHORT = ['ش', 'ی', 'د', 'س', 'چ', 'پ', 'ج'];

export async function initReminders() {
    const saved = await getStorage(STORAGE_KEY, []);
    reminders = saved;
    startReminderChecker();
    return reminders;
}

async function saveReminders() {
    await setStorage(STORAGE_KEY, reminders);
}

export function getReminders() {
    return reminders;
}

export function getReminderById(id) {
    return reminders.find(r => r.id === id);
}

export async function addReminder(title, routineId, hour, minute, repeatType, repeatDays = []) {
    const newId = Math.max(0, ...reminders.map(r => r.id), 0) + 1;
    const newReminder = {
        id: newId,
        title: title.trim(),
        routineId: routineId || null,
        hour: hour,
        minute: minute,
        repeatType: repeatType, // daily, weekly, once
        repeatDays: repeatDays,
        isActive: true,
        lastNotified: null,
        createdAt: new Date().toISOString()
    };
    reminders.push(newReminder);
    await saveReminders();
    return newId;
}

export async function updateReminder(id, data) {
    const reminder = getReminderById(id);
    if (!reminder) return false;
    Object.assign(reminder, data);
    await saveReminders();
    return true;
}

export async function toggleReminder(id) {
    const reminder = getReminderById(id);
    if (!reminder) return false;
    reminder.isActive = !reminder.isActive;
    await saveReminders();
    return reminder.isActive;
}

export async function deleteReminder(id) {
    reminders = reminders.filter(r => r.id !== id);
    await saveReminders();
    return true;
}

// ============================================
// ===== نمایش لیست =====
// ============================================

export async function loadRemindersList() {
    const container = document.getElementById('remindersListContainer');
    if (!container) return;

    if (reminders.length === 0) {
        container.innerHTML = `
            <div class="reminder-empty">
                <div class="reminder-empty-icon">⏰</div>
                <div class="reminder-empty-text">هیچ یادآوری ثبت نشده است</div>
                <div class="reminder-empty-text" style="font-size:14px;color:var(--text-muted);">
                    روی دکمه <span class="highlight">➕</span> کلیک کنید تا یک یادآور جدید بسازید
                </div>
            </div>
        `;
        return;
    }

    const fragment = document.createDocumentFragment();

    for (const reminder of reminders) {
        const item = document.createElement('div');
        item.className = 'reminder-item';
        item.dataset.id = reminder.id;

        const timeStr = `${String(reminder.hour).padStart(2, '0')}:${String(reminder.minute).padStart(2, '0')}`;
        let repeatStr = '';
        
        switch (reminder.repeatType) {
            case 'daily':
                repeatStr = 'روزانه';
                break;
            case 'weekly':
                const days = reminder.repeatDays.map(d => WEEKDAYS_SHORT[d]).join(' ');
                repeatStr = `هفتگی (${days})`;
                break;
            case 'once':
                repeatStr = 'یکبار';
                break;
            default:
                repeatStr = '—';
        }

        const statusClass = reminder.isActive ? 'active' : 'inactive';
        const statusText = reminder.isActive ? 'فعال ✅' : 'غیرفعال ❌';

        item.innerHTML = `
            <div class="reminder-item-header">
                <div class="reminder-item-title">${reminder.title}</div>
                <span class="reminder-item-status ${statusClass}">${statusText}</span>
            </div>
            <div class="reminder-item-time">⏰ ${timeStr}</div>
            <div class="reminder-item-repeat">📅 ${repeatStr}</div>
            <div class="reminder-item-divider"></div>
            <div class="reminder-item-footer">
                <div class="reminder-item-left">
                    <button class="reminder-item-btn toggle" data-id="${reminder.id}" title="${reminder.isActive ? 'غیرفعال کردن' : 'فعال کردن'}">
                        ${ICONS.heart}
                    </button>
                </div>
                <div class="reminder-item-right">
                    <button class="reminder-item-btn delete" data-id="${reminder.id}" title="حذف">
                        ${ICONS.trash}
                    </button>
                </div>
            </div>
        `;

        fragment.appendChild(item);
    }

    container.innerHTML = '';
    container.appendChild(fragment);

    updateRemindersCount();
    setupReminderEvents();
}

function updateRemindersCount() {
    const countEl = document.getElementById('remindersCount');
    if (countEl) {
        countEl.textContent = toPersianNumber(reminders.length);
    }
}

function setupReminderEvents() {
    // دکمه فعال/غیرفعال
    document.querySelectorAll('.reminder-item-btn.toggle').forEach(btn => {
        btn.addEventListener('click', async function(e) {
            e.stopPropagation();
            const id = parseInt(this.dataset.id);
            const isActive = await toggleReminder(id);
            await loadRemindersList();
            showToast(isActive ? '✅ یادآور فعال شد' : '⛔ یادآور غیرفعال شد');
        });
    });

    // دکمه حذف
    document.querySelectorAll('.reminder-item-btn.delete').forEach(btn => {
        btn.addEventListener('click', async function(e) {
            e.stopPropagation();
            const id = parseInt(this.dataset.id);
            const reminder = getReminderById(id);
            const result = await confirmDialog(
                `آیا از حذف یادآور "${reminder?.title || 'این یادآور'}" مطمئن هستید؟`,
                'حذف یادآور',
                '🗑️'
            );
            if (result) {
                await deleteReminder(id);
                await loadRemindersList();
                showToast('✅ یادآور حذف شد');
            }
        });
    });
}

export function showRemindersPage() {
    showPage('pageReminders');
    setTimeout(() => {
        loadRemindersList();
    }, 50);
}

// ============================================
// ===== دیالوگ افزودن یادآور =====
// ============================================

export function showAddReminderDialog() {
    const dialog = document.getElementById('customDialog');
    if (!dialog) return;

    const icon = document.getElementById('dialogIcon');
    const title = document.getElementById('dialogTitle');
    const message = document.getElementById('dialogMessage');
    const inputContainer = document.getElementById('dialogInputContainer');
    const confirmBtn = document.getElementById('dialogConfirm');
    const cancelBtn = document.getElementById('dialogCancel');
    const buttons = document.querySelector('.dialog-buttons');

    if (icon) icon.textContent = '⏰';
    if (title) title.textContent = 'افزودن یادآور';
    if (message) {
        // ساخت فرم
        const routines = getRoutines();
        let routinesOptions = '<option value="">انتخاب روال (اختیاری)</option>';
        for (const routine of routines) {
            routinesOptions += `<option value="${routine.id}">${routine.title}</option>`;
        }

        message.innerHTML = `
            <div class="reminder-dialog-content">
                <div class="reminder-dialog-group">
                    <label>عنوان یادآور <span style="color:#ef4444;">*</span></label>
                    <input type="text" id="reminderTitleInput" placeholder="مثلاً: تسبیحات فاطمه (س)">
                </div>
                <div class="reminder-dialog-group">
                    <label>روال مرتبط (اختیاری)</label>
                    <select id="reminderRoutineSelect">
                        ${routinesOptions}
                    </select>
                </div>
                <div class="reminder-dialog-group">
                    <label>ساعت <span style="color:#ef4444;">*</span></label>
                    <input type="time" id="reminderTimeInput" value="07:00">
                </div>
                <div class="reminder-dialog-group">
                    <label>تکرار</label>
                    <select id="reminderRepeatSelect">
                        <option value="daily">روزانه</option>
                        <option value="weekly">هفتگی</option>
                        <option value="once">یکبار</option>
                    </select>
                </div>
                <div class="reminder-dialog-group" id="weeklyDaysContainer" style="display:none;">
                    <label>روزهای هفته</label>
                    <div class="repeat-days">
                        ${WEEKDAYS.map((day, index) => `
                            <button class="repeat-day-btn" data-day="${index}">${day.slice(0, 1)}</button>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;
    }

    if (inputContainer) inputContainer.style.display = 'none';
    if (buttons) buttons.style.display = 'flex';

    if (confirmBtn) {
        confirmBtn.textContent = 'افزودن';
        confirmBtn.onclick = async function() {
            const titleInput = document.getElementById('reminderTitleInput');
            const routineSelect = document.getElementById('reminderRoutineSelect');
            const timeInput = document.getElementById('reminderTimeInput');
            const repeatSelect = document.getElementById('reminderRepeatSelect');

            const title = titleInput?.value.trim();
            if (!title) {
                showToast('⚠️ لطفاً عنوان یادآور را وارد کنید');
                titleInput?.focus();
                return;
            }

            const time = timeInput?.value || '07:00';
            const [hour, minute] = time.split(':').map(Number);
            if (isNaN(hour) || isNaN(minute)) {
                showToast('⚠️ لطفاً ساعت معتبر وارد کنید');
                return;
            }

            const routineId = routineSelect?.value ? parseInt(routineSelect.value) : null;
            const repeatType = repeatSelect?.value || 'daily';
            let repeatDays = [];

            if (repeatType === 'weekly') {
                document.querySelectorAll('.repeat-day-btn.active').forEach(btn => {
                    repeatDays.push(parseInt(btn.dataset.day));
                });
                if (repeatDays.length === 0) {
                    showToast('⚠️ لطفاً حداقل یک روز را انتخاب کنید');
                    return;
                }
            }

            await addReminder(title, routineId, hour, minute, repeatType, repeatDays);
            dialog.classList.remove('show');
            showToast('✅ یادآور با موفقیت اضافه شد');
            await loadRemindersList();

            // درخواست اجازه نوتیفیکیشن
            if ('Notification' in window && Notification.permission === 'default') {
                Notification.requestPermission();
            }
        };
    }

    if (cancelBtn) {
        cancelBtn.textContent = 'انصراف';
        cancelBtn.onclick = function() {
            dialog.classList.remove('show');
        };
    }

    const overlay = dialog.querySelector('.dialog-overlay');
    if (overlay) {
        overlay.onclick = function() {
            dialog.classList.remove('show');
        };
    }

    dialog.classList.add('show');

    // رویدادهای تکرار
    setTimeout(() => {
        const repeatSelect = document.getElementById('reminderRepeatSelect');
        if (repeatSelect) {
            repeatSelect.addEventListener('change', function() {
                const container = document.getElementById('weeklyDaysContainer');
                if (container) {
                    container.style.display = this.value === 'weekly' ? 'block' : 'none';
                }
            });
        }

        // رویدادهای روزهای هفته
        document.querySelectorAll('.repeat-day-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                this.classList.toggle('active');
            });
        });
    }, 100);
}

// ============================================
// ===== چک‌کننده یادآورها =====
// ============================================

function startReminderChecker() {
    if (reminderCheckerInterval) {
        clearInterval(reminderCheckerInterval);
    }

    reminderCheckerInterval = setInterval(async () => {
        const now = new Date();
        const hour = now.getHours();
        const minute = now.getMinutes();
        const day = now.getDay(); // 0=شنبه
        const today = now.toDateString();

        // فقط دقیقه‌های ۰ اجرا کن (هر ساعت یکبار)
        if (minute !== 0) return;

        for (const reminder of reminders) {
            if (!reminder.isActive) continue;
            if (reminder.hour !== hour || reminder.minute !== minute) continue;

            // بررسی تکرار
            if (reminder.repeatType === 'weekly') {
                if (!reminder.repeatDays.includes(day)) continue;
            }

            // بررسی نوتیفیکیشن امروز
            if (reminder.lastNotified === today) continue;

            // ارسال نوتیفیکیشن
            sendReminderNotification(reminder);

            // به‌روزرسانی آخرین ارسال
            reminder.lastNotified = today;
            await saveReminders();
        }
    }, 60000); // هر دقیقه

    // یک بار هم بلافاصله اجرا کن
    setTimeout(() => {
        checkRemindersNow();
    }, 5000);
}

async function checkRemindersNow() {
    const now = new Date();
    const hour = now.getHours();
    const minute = now.getMinutes();
    const day = now.getDay();
    const today = now.toDateString();

    for (const reminder of reminders) {
        if (!reminder.isActive) continue;
        if (reminder.hour !== hour || reminder.minute !== minute) continue;

        if (reminder.repeatType === 'weekly') {
            if (!reminder.repeatDays.includes(day)) continue;
        }

        if (reminder.lastNotified === today) continue;

        sendReminderNotification(reminder);
        reminder.lastNotified = today;
        await saveReminders();
    }
}

function sendReminderNotification(reminder) {
    if (!('Notification' in window)) return;
    if (Notification.permission !== 'granted') return;

    const timeStr = `${String(reminder.hour).padStart(2, '0')}:${String(reminder.minute).padStart(2, '0')}`;
    
    const notification = new Notification(`🔔 ${reminder.title}`, {
        body: `⏰ ${timeStr} - زمان انجام "${reminder.title}" فرا رسید`,
        icon: '/assets/icon-192x192.png',
        vibrate: [200, 100, 200, 100, 200],
        tag: `reminder_${reminder.id}`,
        requireInteraction: true,
        data: { reminderId: reminder.id, routineId: reminder.routineId }
    });

    notification.onclick = function() {
        window.focus();
        if (this.data.routineId) {
            import('./routines-manager.js').then(({ startRoutine }) => {
                startRoutine(this.data.routineId);
            });
        }
        this.close();
    };

    // ویبره گوشی
    if (navigator.vibrate) {
        navigator.vibrate([200, 100, 200, 100, 200]);
    }
}

export function stopReminderChecker() {
    if (reminderCheckerInterval) {
        clearInterval(reminderCheckerInterval);
        reminderCheckerInterval = null;
    }
}