// ============================================
// dialog.js - سیستم دیالوگ (نسخه اصلاح‌شده)
// ============================================

const dialog = {
    element: null,
    overlay: null,
    box: null,
    icon: null,
    title: null,
    message: null,
    input: null,
    inputContainer: null,
    cancelBtn: null,
    confirmBtn: null,
    resolve: null,
    isInputMode: false,
    isCheckboxMode: false,
    checkbox: null,
    checkboxLabel: null,
    currentCount: 0,
    currentValue: '',

    init() {
        this.element = document.getElementById('customDialog');
        this.overlay = this.element?.querySelector('.dialog-overlay');
        this.box = this.element?.querySelector('.dialog-box');
        this.icon = document.getElementById('dialogIcon');
        this.title = document.getElementById('dialogTitle');
        this.message = document.getElementById('dialogMessage');
        this.inputContainer = document.getElementById('dialogInputContainer');
        this.input = document.getElementById('dialogInput');
        this.cancelBtn = document.getElementById('dialogCancel');
        this.confirmBtn = document.getElementById('dialogConfirm');

        if (!this.element) {
            return;
        }

        this.setupEvents();
    },

    setupEvents() {
        this.cancelBtn?.addEventListener('click', () => {
            if (this.isInputMode) {
                this.hide(null);
            } else {
                this.hide(false);
            }
        });

        this.confirmBtn?.addEventListener('click', () => {
            if (this.isInputMode) {
                const value = this.input?.value.trim();
                if (value && !isNaN(value) && parseInt(value) > 0) {
                    const numValue = parseInt(value);
                    if (this.currentCount > 0 && numValue < this.currentCount) {
                        this.input?.classList.add('error');
                        this.confirmBtn?.classList.add('disabled');
                        return;
                    }
                    const isPermanent = this.checkbox?.checked || false;
                    this.hide({ value: numValue, permanent: isPermanent });
                } else {
                    this.input?.classList.add('error');
                    setTimeout(() => this.input?.classList.remove('error'), 500);
                }
            } else {
                this.hide(true);
            }
        });

        this.input?.addEventListener('input', () => {
            const value = this.input?.value.trim();
            if (value && !isNaN(value) && parseInt(value) > 0) {
                const numValue = parseInt(value);
                if (this.currentCount > 0 && numValue < this.currentCount) {
                    this.input?.classList.add('error');
                    this.confirmBtn?.classList.add('disabled');
                    const errorMsg = document.getElementById('dialogErrorMsg');
                    if (errorMsg) {
                        errorMsg.textContent = `❌ نمیتوانید کمتر از ${this.currentCount} وارد کنید`;
                        errorMsg.style.display = 'block';
                    }
                } else {
                    this.input?.classList.remove('error');
                    this.confirmBtn?.classList.remove('disabled');
                    const errorMsg = document.getElementById('dialogErrorMsg');
                    if (errorMsg) {
                        errorMsg.style.display = 'none';
                    }
                }
            } else {
                this.input?.classList.remove('error');
                this.confirmBtn?.classList.remove('disabled');
                const errorMsg = document.getElementById('dialogErrorMsg');
                if (errorMsg) {
                    errorMsg.style.display = 'none';
                }
            }
        });

        this.overlay?.addEventListener('click', () => {
            if (this.isInputMode) {
                this.hide(null);
            } else {
                this.hide(false);
            }
        });

        this.input?.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                this.confirmBtn?.click();
            }
            if (e.key === 'Escape') {
                this.cancelBtn?.click();
            }
        });

        this.box?.addEventListener('click', (e) => {
            e.stopPropagation();
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isVisible()) {
                if (this.isInputMode) {
                    this.hide(null);
                } else {
                    this.hide(false);
                }
            }
        });
    },

    show(options) {
        return new Promise((resolve) => {
            const buttons = document.querySelector('.dialog-buttons');
            if (buttons) {
                buttons.style.display = 'flex';
            }

            const {
                icon = '',
                title = '',
                message = '',
                confirmText = 'تأیید',
                cancelText = 'انصراف',
                inputMode = false,
                inputValue = '',
                inputPlaceholder = 'مقدار را وارد کنید',
                inputType = 'number',
                showCheckbox = false,
                checkboxLabel = 'جایگزینی دائمی (ذخیره)',
                checkboxChecked = false,
                currentValue = '',
                currentCount = 0
            } = options;

            this.isInputMode = inputMode;
            this.isCheckboxMode = showCheckbox;
            this.currentCount = currentCount;
            this.currentValue = currentValue;

            if (this.icon) this.icon.textContent = icon;
            if (this.title) this.title.textContent = title;
            
            let messageText = message;
            if (currentValue) {
                messageText = `تعداد فعلی: ${currentValue}`;
            }
            if (this.message) this.message.textContent = messageText;
            
            if (this.confirmBtn) {
                this.confirmBtn.textContent = confirmText;
                this.confirmBtn.classList.remove('disabled');
                this.confirmBtn.style.display = 'flex';
            }
            if (this.cancelBtn) {
                this.cancelBtn.textContent = cancelText;
                this.cancelBtn.style.display = 'flex';
            }

            const oldError = this.inputContainer?.querySelector('#dialogErrorMsg');
            if (oldError) oldError.remove();

            if (this.inputContainer) {
                if (inputMode) {
                    this.inputContainer.style.display = 'block';
                    if (this.input) {
                        this.input.type = inputType;
                        this.input.value = '';
                        this.input.placeholder = inputPlaceholder;
                        this.input.classList.remove('error');
                        this.input.focus();
                    }
                    
                    const errorMsg = document.createElement('div');
                    errorMsg.id = 'dialogErrorMsg';
                    errorMsg.style.cssText = 'display:none; color:#ef4444; font-size:12px; text-align:center; margin-top:4px; font-family:\'Love\',Tahoma,\'Vazirmatn\',sans-serif;';
                    this.inputContainer.appendChild(errorMsg);
                    
                    const existingCheckbox = this.inputContainer.querySelector('.dialog-checkbox-wrapper');
                    if (existingCheckbox) existingCheckbox.remove();
                    
                    if (showCheckbox) {
                        const wrapper = document.createElement('div');
                        wrapper.className = 'dialog-checkbox-wrapper';
                        wrapper.style.cssText = 'display:flex; align-items:center; gap:8px; justify-content:center; margin:8px 0; direction:rtl;';
                        wrapper.innerHTML = `
                            <input type="checkbox" id="dialogCheckbox" ${checkboxChecked ? 'checked' : ''} style="width:18px; height:18px; accent-color: var(--primary-color); cursor:pointer;">
                            <label for="dialogCheckbox" style="font-size:13px; color:var(--text-secondary); cursor:pointer; font-family:'Love',Tahoma,'Vazirmatn',sans-serif;">${checkboxLabel}</label>
                        `;
                        this.inputContainer.appendChild(wrapper);
                        this.checkbox = document.getElementById('dialogCheckbox');
                    } else {
                        this.checkbox = null;
                    }
                } else {
                    this.inputContainer.style.display = 'none';
                }
            }

            this.element?.classList.add('show');
            this.resolve = resolve;
        });
    },

    hide(result) {
        this.element?.classList.remove('show');
        if (this.resolve) {
            this.resolve(result);
            this.resolve = null;
        }
        
        // ===== 🔧 ریست کردن همه مقادیر =====
        this.isInputMode = false;
        this.isCheckboxMode = false;
        this.currentCount = 0;
        this.currentValue = '';
        this.checkbox = null;
        
        const errorMsg = document.getElementById('dialogErrorMsg');
        if (errorMsg) errorMsg.remove();
        
        // ===== پاک کردن ورودی =====
        if (this.input) {
            this.input.value = '';
            this.input.classList.remove('error');
        }
    },

    isVisible() {
        return this.element?.classList.contains('show') || false;
    }
};

export function showDialog(options) {
    return dialog.show(options);
}

export function confirmDialog(message, title = 'تأیید', icon = '') {
    return dialog.show({
        icon: icon,
        title: title,
        message: message,
        confirmText: 'بله',
        cancelText: 'خیر',
        inputMode: false
    });
}

export function promptNumberDialog(message, title = 'ورود مقدار', icon = '', defaultValue = '', placeholder = 'مقدار را وارد کنید') {
    return dialog.show({
        icon: icon,
        title: title,
        message: message,
        confirmText: 'ثبت',
        cancelText: 'انصراف',
        inputMode: true,
        inputValue: defaultValue,
        inputPlaceholder: placeholder,
        inputType: 'number'
    });
}

export function promptTargetDialog(currentTarget, currentCount = 0) {
    return dialog.show({
        icon: '',
        title: '',
        message: '',
        confirmText: 'تایید',
        cancelText: 'انصراف',
        inputMode: true,
        inputValue: '',
        inputPlaceholder: 'تعداد جدید را وارد کنید',
        inputType: 'number',
        showCheckbox: true,
        checkboxLabel: 'جایگزینی دائمی (ذخیره)',
        checkboxChecked: false,
        currentValue: String(currentTarget),
        currentCount: currentCount
    });
}

export function initDialog() {
    dialog.init();
}

window.confirmDialog = confirmDialog;
window.promptNumberDialog = promptNumberDialog;
window.promptTargetDialog = promptTargetDialog;
window.showDialog = showDialog;