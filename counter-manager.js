// ============================================
// counter-manager.js - مدیریت شمارنده (نسخه نهایی)
// ============================================

import { DOM } from './dom-elements.js';
import { WEEK_ZEKR } from './config.js';
import { getStorage, setStorage } from '../utils/storage.js';
import { toPersianNumber } from '../utils/persian.js';
import { showToast, showPage } from './ui-utils.js';
import { vibrate } from './vibration.js';
import { updateHeader } from './date-time.js';
import { logZekr, logFreeZekr } from './stats-data.js';
import { animateFullReset, stopAnimation } from './animation-utils.js';
import { promptTargetDialog } from '../utils/dialog.js';
import { ICONS } from '../icons.js';

let counter = 0;
let target = 100;
let originalTarget = 100;
let totalCount = 0;
let currentZekr = { text: '', meaning: '', target: 100, id: null };
let resetTimer = null;
let isGoalReached = false;
let popDirection = true;
let isTempTarget = false;
let freeMode = false;
let hasCustomTarget = false;

const counterDisplay = document.getElementById('counterNumberDisplay');
const counterMiniNumber = document.getElementById('counterMiniNumber');
const counterProgressBar = document.getElementById('counterProgressBar');
const counterProgressTrack = document.getElementById('counterProgressTrack');
const counterMiniBox = document.getElementById('counterMiniBox');
const fingerprintIcon = document.querySelector('.fingerprint-icon');
const resetSvg = document.querySelector('#resetBtn svg');
const zekrText = document.getElementById('zekrText');
const meaning = document.getElementById('meaning');
const zekrDividerLine = document.getElementById('zekrDividerLine');
const targetBadge = document.getElementById('targetBadge');
const targetValueBadge = document.getElementById('targetValueBadge');
const zekrSelectBadge = document.getElementById('zekrSelectBadge');

export function getCounter() { return counter; }
export function getTarget() { return target; }
export function getCurrentZekr() { return currentZekr; }
export function getTotalCount() { return totalCount; }
export function isFreeMode() { return freeMode; }

export function enterFreeMode() {
    freeMode = true;
    hasCustomTarget = false;
    setCurrentZekr(null, 'free');
}

export function exitFreeMode() {
    freeMode = false;
}

export async function initCounter() {
    counter = await getStorage('counter', 0);
    totalCount = await getStorage('totalCount', 0);
    freeMode = false;
    hasCustomTarget = false;
    updateDisplay();
    updateProgress();
    const defaultZekr = { text: 'يَا ذَا الْجَلَالِ وَالْإِكْرَامِ', target: 100, id: null };
    updateHeader(defaultZekr.text, null, defaultZekr.target, false);
    await setupEvents();
    resetFingerprintIcon();
    updateResetIconState();
    updateFreeModeUI();
}

export async function setCurrentZekr(zekr, mode = 'normal') {
    if (mode === 'free' || freeMode) {
        freeMode = true;
        hasCustomTarget = false;
        currentZekr = { text: '', meaning: '', target: Infinity, id: null };
        target = Infinity;
        originalTarget = Infinity;
        isTempTarget = false;
        counter = 0;
        isGoalReached = false;
        await setStorage('counter', counter);
        removeSuccessEffect();
        updateDisplay();
        updateProgress();
        updateFreeModeUI();
        hideResetToast();
        resetFingerprintIcon();
        removeResetRotate();
        updateResetIconState();
        updateHeader('', null, '∞', false);
        
        const selectBadge = document.getElementById('zekrSelectBadge');
        if (selectBadge) {
            selectBadge.classList.remove('blink');
        }
        const badge = document.querySelector('.zekr-count-badge');
        if (badge) {
            badge.classList.remove('blink');
        }
        
        const translateToggle = document.getElementById('zekrTranslateToggle');
        const zekrCard = document.getElementById('zekrCard');
        if (translateToggle) {
            translateToggle.classList.remove('active');
        }
        if (zekrCard) {
            zekrCard.classList.remove('hide-translate');
        }
        return;
    }

    freeMode = false;
    hasCustomTarget = false;
    if (!zekr) return;
    
    currentZekr = zekr;
    target = zekr.target || 100;
    originalTarget = target;
    isTempTarget = false;
    
    if (DOM.counter.zekrText) {
        DOM.counter.zekrText.textContent = zekr.text;
    }
    if (DOM.counter.meaning) {
        DOM.counter.meaning.textContent = zekr.meaning || "";
    }
    
    adjustZekrFontSize(zekr.text);
    counter = 0;
    isGoalReached = false;
    await setStorage('counter', counter);
    removeSuccessEffect();
    updateDisplay();
    updateProgress();
    updateHeader(zekr.text, null, target, false);
    hideResetToast();
    resetFingerprintIcon();
    removeResetRotate();
    updateResetIconState();
    updateFreeModeUI();
    
    const selectBadge = document.getElementById('zekrSelectBadge');
    if (selectBadge) {
        selectBadge.classList.remove('blink');
    }
    const badge = document.querySelector('.zekr-count-badge');
    if (badge) {
        badge.classList.remove('blink');
    }
    
    const translateToggle = document.getElementById('zekrTranslateToggle');
    const zekrCard = document.getElementById('zekrCard');
    if (translateToggle) {
        translateToggle.classList.remove('active');
    }
    if (zekrCard) {
        zekrCard.classList.remove('hide-translate');
    }
}

export async function setFreeModeTarget(newTarget) {
    if (!freeMode) return;
    
    hasCustomTarget = true;
    target = newTarget;
    originalTarget = newTarget;
    counter = 0;
    isGoalReached = false;
    await setStorage('counter', counter);
    
    updateDisplay();
    updateProgress();
    updateFreeModeUI();
    updateHeader('', null, newTarget, false);
    
    if (counterProgressTrack) {
        counterProgressTrack.style.display = '';
    }
    if (counterProgressBar) {
        counterProgressBar.style.width = '0%';
        counterProgressBar.style.opacity = '0.2';
    }
    
    showToast(`🎯 تعداد هدف: ${newTarget}`);
}

function updateFreeModeUI() {
    if (freeMode) {
        if (zekrText) {
            zekrText.textContent = '';
            zekrText.style.display = 'none';
        }
        if (meaning) {
            meaning.textContent = '';
            meaning.style.display = 'none';
        }
        if (zekrDividerLine) {
            zekrDividerLine.style.display = 'none';
        }
        
        if (targetBadge) {
            if (hasCustomTarget && target !== Infinity) {
                targetBadge.textContent = `تعداد: ${toPersianNumber(target)}`;
            } else {
                targetBadge.textContent = 'تعداد: ∞';
            }
        }
        if (targetValueBadge) {
            if (hasCustomTarget && target !== Infinity) {
                targetValueBadge.textContent = toPersianNumber(target);
            } else {
                targetValueBadge.textContent = '∞';
            }
        }
        
        if (counterProgressTrack) {
            if (hasCustomTarget && target !== Infinity) {
                counterProgressTrack.style.display = '';
            } else {
                counterProgressTrack.style.display = 'none';
            }
        }
        
        if (zekrSelectBadge) {
            zekrSelectBadge.style.display = 'inline-block';
        }
        const translateToggle = document.getElementById('zekrTranslateToggle');
        if (translateToggle) {
            translateToggle.style.display = 'none';
        }
    } else {
        if (zekrText) {
            zekrText.style.display = '';
        }
        if (meaning) {
            meaning.style.display = '';
        }
        if (zekrDividerLine) {
            zekrDividerLine.style.display = '';
        }
        if (counterProgressTrack) {
            counterProgressTrack.style.display = '';
        }
        if (targetValueBadge) {
            targetValueBadge.textContent = toPersianNumber(target);
        }
        if (targetBadge) {
            targetBadge.innerHTML = `تعداد: <span id="targetValueBadge">${toPersianNumber(target)}</span>`;
        }
        const translateToggle = document.getElementById('zekrTranslateToggle');
        if (translateToggle) {
            translateToggle.style.display = '';
        }
        if (currentZekr && currentZekr.text) {
            if (zekrText) {
                zekrText.textContent = currentZekr.text;
            }
            if (meaning) {
                meaning.textContent = currentZekr.meaning || "";
            }
            adjustZekrFontSize(currentZekr.text);
        }
    }
}

async function handleFreeModeIncrement() {
    if (hasCustomTarget && target !== Infinity && counter >= target) {
        triggerResetRotate();
        if (navigator.vibrate) {
            navigator.vibrate([100, 100, 100, 100, 100, 100, 100, 100, 100, 100]);
        }
        return;
    }
    
    const wasZero = counter === 0;
    counter++;
    totalCount++;
    await setStorage('counter', counter);
    await setStorage('totalCount', totalCount);
    
    await logFreeZekr(1);
    
    updateDisplay();
    updateProgress();
    animateNumber();
    animateMiniNumber();
    vibrate();
    
    if (wasZero) {
        updateResetIconState();
    }
    
    if (hasCustomTarget && target !== Infinity && counter >= target) {
        if (navigator.vibrate) {
            navigator.vibrate(1000);
        }
        showSuccessEffect();
        isGoalReached = true;
        updateHeader('', null, target, true);
        
        if (fingerprintIcon) {
            fingerprintIcon.classList.add('goal-reached');
        }
        
        if (navigator.vibrate) {
            navigator.vibrate([100, 100, 100, 100, 100, 100, 100, 100, 100, 100]);
        }
    }
}

async function handleNormalModeIncrement() {
    if (counter < target) {
        const wasZero = counter === 0;
        counter++;
        totalCount++;
        await setStorage('counter', counter);
        await setStorage('totalCount', totalCount);
        
        if (currentZekr.text) {
            await logZekr(currentZekr.text, 1);
        }
        
        updateDisplay();
        updateProgress();
        animateNumber();
        animateMiniNumber();
        vibrate();
        
        if (wasZero) {
            updateResetIconState();
        }
        
        if (counter >= target) {
            if (navigator.vibrate) {
                navigator.vibrate(1000);
            }
            showSuccessEffect();
            isGoalReached = true;
            updateHeader(currentZekr.text, null, target, true);
            
            if (fingerprintIcon) {
                fingerprintIcon.classList.add('goal-reached');
            }
            
            if (navigator.vibrate) {
                navigator.vibrate([100, 100, 100, 100, 100, 100, 100, 100, 100, 100]);
            }
            
            const badge = document.querySelector('.zekr-count-badge');
            if (badge) {
                badge.classList.remove('blink');
                void badge.offsetWidth;
                badge.classList.add('blink');
                setTimeout(() => {
                    badge.classList.remove('blink');
                }, 2000);
            }
        }
    } else {
        triggerResetRotate();
        
        if (navigator.vibrate) {
            navigator.vibrate([100, 100, 100, 100, 100, 100, 100, 100, 100, 100]);
        }
        
        const selectBadge = document.getElementById('zekrSelectBadge');
        if (selectBadge) {
            selectBadge.classList.remove('blink');
            void selectBadge.offsetWidth;
            selectBadge.classList.add('blink');
            setTimeout(() => {
                selectBadge.classList.remove('blink');
            }, 2000);
        }
    }
}

export async function incrementCounter() {
    if (freeMode) {
        await handleFreeModeIncrement();
    } else {
        await handleNormalModeIncrement();
    }
}

function resetFingerprintIcon() {
    if (!fingerprintIcon) return;
    fingerprintIcon.innerHTML = ICONS.fingerprint;
    fingerprintIcon.classList.remove('goal-message');
    fingerprintIcon.classList.remove('goal-reached');
}

function removeResetRotate() {
    const resetBtn = document.getElementById('resetBtn');
    if (!resetBtn) return;
    resetBtn.classList.remove('rotate');
}

function triggerResetRotate() {
    const resetBtn = document.getElementById('resetBtn');
    if (!resetBtn) return;
    
    resetBtn.classList.remove('rotate');
    void resetBtn.offsetWidth;
    resetBtn.classList.add('rotate');
}

function updateResetIconState() {
    if (!resetSvg) return;
    if (counter === 0) {
        resetSvg.classList.add('zero-state');
    } else {
        resetSvg.classList.remove('zero-state');
    }
}

function showResetToast() {
    const toast = document.getElementById('resetToast');
    if (toast) {
        const resetBtn = document.getElementById('resetBtn');
        if (resetBtn) {
            const rect = resetBtn.getBoundingClientRect();
            toast.style.position = 'fixed';
            toast.style.top = (rect.top - 50) + 'px';
            toast.style.left = (rect.left + rect.width / 2) + 'px';
            toast.style.transform = 'translateX(-50%)';
            toast.style.bottom = 'auto';
        }
        toast.textContent = '🔁 یک ثانیه نگه دار';
        toast.classList.add('show');
    }
}

function hideResetToast() {
    const toast = document.getElementById('resetToast');
    if (toast) {
        toast.classList.remove('show');
        setTimeout(() => {
            toast.style.position = '';
            toast.style.top = '';
            toast.style.left = '';
            toast.style.transform = '';
            toast.style.bottom = '';
        }, 300);
    }
}

export async function resetCounter() {
    stopAnimation();
    removeSuccessEffect();
    
    const startValue = counter;
    
    if (counterMiniNumber) {
        counterMiniNumber.classList.remove('pop-change-left', 'pop-change-right');
        counterMiniNumber.classList.add('reset-fade');
    }
    
    if (counterProgressBar && !freeMode) {
        counterProgressBar.style.transition = 'width 0.5s ease-in, opacity 0.5s ease-in';
        counterProgressBar.style.width = '0%';
        counterProgressBar.style.opacity = '0.2';
        counterProgressBar.classList.remove('complete', 'gradient');
    }
    
    await new Promise((resolve) => {
        setTimeout(() => {
            animateFullReset(
                {
                    progressBar: counterProgressBar,
                    numberElement: counterMiniNumber
                },
                startValue,
                500,
                async () => {
                    counter = 0;
                    isGoalReached = false;
                    await setStorage('counter', counter);
                    updateDisplay();
                    updateProgress();
                    hideResetToast();
                    
                    if (counterDisplay) {
                        counterDisplay.textContent = toPersianNumber(0);
                    }
                    
                    if (counterMiniNumber) {
                        counterMiniNumber.style.transition = 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)';
                        counterMiniNumber.style.transform = '';
                        counterMiniNumber.style.opacity = '';
                        counterMiniNumber.classList.remove('reset-fade');
                    }
                    
                    if (counterMiniBox) {
                        counterMiniBox.style.transition = 'transform 0.15s ease';
                        counterMiniBox.style.transform = 'scale(0.97)';
                        setTimeout(() => {
                            counterMiniBox.style.transform = 'scale(1)';
                        }, 150);
                    }
                    
                    resetFingerprintIcon();
                    removeResetRotate();
                    if (!freeMode) {
                        updateHeader(currentZekr.text, null, target, false);
                    } else {
                        updateHeader('', null, hasCustomTarget ? target : '∞', false);
                    }
                    updateResetIconState();
                    
                    const badge = document.querySelector('.zekr-count-badge');
                    if (badge) {
                        badge.classList.remove('blink');
                    }
                    const selectBadge = document.getElementById('zekrSelectBadge');
                    if (selectBadge) {
                        selectBadge.classList.remove('blink');
                    }
                    
                    if (navigator.vibrate) {
                        navigator.vibrate(50);
                    }
                    resolve();
                }
            );
        }, 400);
    });
    
    const resetBtn = document.getElementById('resetBtn');
    if (resetBtn) {
        resetBtn.classList.remove('rotate');
        void resetBtn.offsetWidth;
        resetBtn.classList.add('rotate');
    }
}

function showSuccessEffect() {
    if (!counterMiniBox) return;
    counterMiniBox.classList.add('success');
    
    setTimeout(() => {
        counterMiniBox.classList.remove('success');
    }, 500);
}

function removeSuccessEffect() {
    if (counterMiniBox) {
        counterMiniBox.classList.remove('success');
    }
}

export function loadDailyZekr(weekZekr) {
    const day = new Date().getDay();
    const info = weekZekr[day];
    if (!info) return;
    removeSuccessEffect();
    freeMode = false;
    hasCustomTarget = false;
    setCurrentZekr({ id: null, text: info.text, meaning: info.meaning, target: 100, source: "daily" });
    showPage('pageCounter');
}

export function loadSelectedZekr(id, getZekrByIdFn) {
    if (typeof getZekrByIdFn !== "function") {
        showToast("خطا در بارگذاری ذکر");
        return;
    }
    const item = getZekrByIdFn(id);
    if (!item) {
        showToast("ذکر پیدا نشد");
        return;
    }
    removeSuccessEffect();
    freeMode = false;
    hasCustomTarget = false;
    setCurrentZekr({ id: item.id, text: item.text, meaning: item.meaning || "", target: item.target || 100, source: "selected" });
    showPage('pageCounter');
}

function updateDisplay() {
    if (counterDisplay) {
        counterDisplay.textContent = toPersianNumber(counter);
    }
    if (counterMiniNumber) {
        counterMiniNumber.textContent = toPersianNumber(counter);
    }
    if (!freeMode) {
        const badge = document.getElementById('targetValueBadge');
        if (badge) {
            badge.textContent = toPersianNumber(target);
        }
    } else {
        if (hasCustomTarget && target !== Infinity) {
            const badge = document.getElementById('targetValueBadge');
            if (badge) {
                badge.textContent = toPersianNumber(target);
            }
        }
    }
}

function updateProgress() {
    if (!counterProgressBar) return;
    
    if (freeMode && (!hasCustomTarget || target === Infinity)) {
        counterProgressBar.style.width = '0%';
        counterProgressBar.style.opacity = '0';
        if (counterProgressTrack) {
            counterProgressTrack.style.display = 'none';
        }
        return;
    }
    
    if (counterProgressTrack) {
        counterProgressTrack.style.display = '';
    }
    
    const currentTarget = freeMode ? target : target;
    if (currentTarget === Infinity || currentTarget === 0) {
        counterProgressBar.style.width = '0%';
        counterProgressBar.style.opacity = '0';
        return;
    }
    
    const percent = Math.min((counter / currentTarget) * 100, 100);
    
    counterProgressBar.style.width = percent + '%';
    
    const opacity = 0.2 + (percent / 100) * 0.3;
    counterProgressBar.style.opacity = opacity;
    
    if (percent > 50) {
        counterProgressBar.classList.add('gradient');
    } else {
        counterProgressBar.classList.remove('gradient');
    }
    
    if (percent >= 100) {
        counterProgressBar.classList.add('complete');
    } else {
        counterProgressBar.classList.remove('complete');
    }
}

function animateNumber() {
    if (counterDisplay) {
        counterDisplay.classList.remove('pop');
        void counterDisplay.offsetWidth;
        counterDisplay.classList.add('pop');
    }
}

function animateMiniNumber() {
    if (counterMiniNumber) {
        counterMiniNumber.classList.remove('pop-change-left', 'pop-change-right');
        void counterMiniNumber.offsetWidth;
        
        if (popDirection) {
            counterMiniNumber.classList.add('pop-change-left');
        } else {
            counterMiniNumber.classList.add('pop-change-right');
        }
        
        popDirection = !popDirection;
    }
}

function adjustZekrFontSize(text) {
    if (!DOM.counter.zekrText) return;
    const length = text.length;
    if (length > 60) {
        DOM.counter.zekrText.classList.add('small-font');
    } else if (length > 45) {
        DOM.counter.zekrText.classList.add('small-font');
    } else if (length > 30) {
        DOM.counter.zekrText.classList.remove('small-font');
    } else if (length > 18) {
        DOM.counter.zekrText.classList.remove('small-font');
    } else {
        DOM.counter.zekrText.classList.remove('small-font');
    }
}

export function restoreOriginalTarget() {
    if (isTempTarget && !freeMode) {
        target = originalTarget;
        isTempTarget = false;
        updateDisplay();
        updateProgress();
        updateHeader(currentZekr.text, null, target, isGoalReached);
        
        const badgeEl = document.getElementById('targetValueBadge');
        if (badgeEl) {
            badgeEl.textContent = toPersianNumber(target);
        }
    }
}

export function resetHeaderToDaily() {
    const day = new Date().getDay();
    const info = WEEK_ZEKR[day];
    if (info) {
        updateHeader(info.text, null, 100, false);
    }
}

async function setupEvents() {
    if (DOM.counter.countBtn) {
        DOM.counter.countBtn.addEventListener('click', incrementCounter);
    }
    
    if (DOM.counter.resetBtn) {
        DOM.counter.resetBtn.addEventListener('pointerdown', function() {
            showResetToast();
            resetTimer = setTimeout(() => {
                resetCounter();
                hideResetToast();
            }, 800);
        });
        
        DOM.counter.resetBtn.addEventListener('pointerup', function() {
            clearTimeout(resetTimer);
            setTimeout(() => {
                hideResetToast();
            }, 300);
        });
        
        DOM.counter.resetBtn.addEventListener('pointercancel', function() {
            clearTimeout(resetTimer);
            hideResetToast();
        });
    }
    
    const badge = document.querySelector('.zekr-count-badge');
    if (badge) {
        badge.addEventListener('click', async function() {
            const currentTarget = freeMode ? (hasCustomTarget ? target : Infinity) : target;
            const currentCount = counter;
            
            const result = await promptTargetDialog(
                freeMode && !hasCustomTarget ? '∞' : String(currentTarget), 
                currentCount
            );
            
            if (result && result.value) {
                const newTarget = result.value;
                const isPermanent = result.permanent || false;
                
                if (freeMode) {
                    if (isPermanent) {
                        setFreeModeTarget(newTarget);
                        showToast(`✅ تعداد به ${newTarget} تغییر یافت`);
                    } else {
                        setFreeModeTarget(newTarget);
                        showToast(`🎯 تعداد موقتاً به ${newTarget} تغییر یافت`);
                    }
                    return;
                }
                
                if (isPermanent) {
                    target = newTarget;
                    originalTarget = newTarget;
                    isTempTarget = false;
                    await setStorage('counter', counter);
                    
                    const zekrId = currentZekr.id;
                    if (zekrId !== null && zekrId !== undefined && zekrId !== '') {
                        import('./zekr-manager.js').then(module => {
                            const { getZekrById, updateZekr, loadZekrList } = module;
                            const item = getZekrById(zekrId);
                            if (item) {
                                updateZekr(zekrId, item.text, item.meaning, newTarget);
                            }
                        }).catch(() => {});
                    }
                    
                    updateDisplay();
                    updateProgress();
                    updateHeader(currentZekr.text, null, target, isGoalReached);
                    
                    const badgeEl = document.getElementById('targetValueBadge');
                    if (badgeEl) {
                        badgeEl.textContent = toPersianNumber(target);
                    }
                    
                    showToast(`✅ تعداد به ${newTarget} تغییر یافت (دائمی)`);
                    
                } else {
                    if (!isTempTarget) {
                        originalTarget = target;
                    }
                    
                    target = newTarget;
                    isTempTarget = true;
                    
                    const badgeEl = document.getElementById('targetValueBadge');
                    if (badgeEl) {
                        badgeEl.textContent = toPersianNumber(newTarget);
                    }
                    
                    updateProgress();
                    
                    showToast(`🎯 تعداد موقتاً به ${newTarget} تغییر یافت`);
                }
            }
        });
    }
    
    const selectBadge = document.getElementById('zekrSelectBadge');
    if (selectBadge) {
        selectBadge.addEventListener('click', function() {
            showPage('pageZekr');
            import('./zekr-manager.js').then(module => {
                module.loadZekrList();
            }).catch(() => {});
            removeSuccessEffect();
            this.classList.remove('blink');
        });
    }
    
    const translateToggle = document.getElementById('zekrTranslateToggle');
    const zekrCard = document.getElementById('zekrCard');
    
    if (translateToggle && zekrCard) {
        translateToggle.addEventListener('click', function() {
            this.classList.toggle('active');
            zekrCard.classList.toggle('hide-translate');
        });
    }
}