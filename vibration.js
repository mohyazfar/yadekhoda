// ============================================
// vibration.js - مدیریت ویبره (اصلاح‌شده)
// ============================================

import { CONFIG } from './config.js';
import { VIBRATION_PATTERNS } from './config.js';
import { getStorage, setStorage } from '../utils/storage.js';

let vibrateEnabled = true;
let currentPatternIndex = 0;
let currentPattern = VIBRATION_PATTERNS[0].pattern;

export async function initVibration() {
    vibrateEnabled = await getStorage(CONFIG.STORAGE_KEYS.VIBRATE, true);
    currentPatternIndex = await getStorage(CONFIG.STORAGE_KEYS.VIBRATION_PATTERN, 0);
    const pattern = VIBRATION_PATTERNS.find(p => p.id === currentPatternIndex);
    currentPattern = pattern ? pattern.pattern : VIBRATION_PATTERNS[0].pattern;
}

export function vibrate() {
    if (!vibrateEnabled || !navigator.vibrate) return;
    navigator.vibrate(currentPattern);
}

export function setVibrationPattern(index) {
    currentPatternIndex = index;
    setStorage(CONFIG.STORAGE_KEYS.VIBRATION_PATTERN, index);
    const pattern = VIBRATION_PATTERNS.find(p => p.id === index);
    currentPattern = pattern ? pattern.pattern : VIBRATION_PATTERNS[0].pattern;
    if (navigator.vibrate) {
        navigator.vibrate(currentPattern);
    }
}

export function getVibrationPatterns() {
    return VIBRATION_PATTERNS;
}

export function getCurrentPatternIndex() {
    return currentPatternIndex;
}

export function getCurrentPattern() {
    return currentPattern;
}

export function getVibrateEnabled() { return vibrateEnabled; }

export function getVibrationLevel() {
    return currentPatternIndex;
}

export function setVibrationLevel(index) {
    setVibrationPattern(index);
}

export function toggleVibration() {
    vibrateEnabled = !vibrateEnabled;
    setStorage(CONFIG.STORAGE_KEYS.VIBRATE, vibrateEnabled);
    if (vibrateEnabled && navigator.vibrate) {
        navigator.vibrate(50);
    }
    return vibrateEnabled;
}