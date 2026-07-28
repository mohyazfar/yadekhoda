// ============================================
// settings-ui.js - مدیریت تنظیمات (اصلاح‌شده)
// ============================================

import { getColorThemes, applyColorTheme, applyMode } from './theme.js';
import { setVibrationPattern, getVibrationPatterns, getCurrentPatternIndex } from './vibration.js';
import { getStorage } from '../utils/storage.js';

export class SettingsUI {
    constructor() {
        this.colorContainer = document.getElementById("colorThemeContainer");
        this.vibrationContainer = document.getElementById("vibrationContainer");
        this.themeModeBtns = document.querySelectorAll(".theme-mode-btn");
        this.toasts = {};
        this.isInitialized = false;
        
        this.clearAllActiveStates();
        this.init();
    }

    clearAllActiveStates() {
        document.querySelectorAll('.color-theme-circle').forEach(el => el.classList.remove('active'));
        document.querySelectorAll('.vibration-pattern-btn').forEach(el => el.classList.remove('active'));
        document.querySelectorAll('.theme-mode-btn').forEach(el => el.classList.remove('active'));
    }

    init() {
        if (this.isInitialized) return;
        
        this.clearAllActiveStates();
        
        this.buildColorThemes();
        this.buildVibrationPatterns();
        this.setupEventListeners();
        this.createToastElements();
        
        this.loadSavedSettings();
        this.scrollToTop();
        
        this.isInitialized = true;
    }

    scrollToTop() {
        const settingsMain = document.querySelector('.settingsMain');
        if (settingsMain) {
            settingsMain.scrollTo({ top: 0, behavior: 'smooth' });
        }
    }

    createToastElements() {
        const sections = document.querySelectorAll('.settings-section');
        sections.forEach((section, index) => {
            const header = section.querySelector('.settings-section-header');
            if (header) {
                const toast = header.querySelector('.settings-toast');
                if (toast) {
                    this.toasts[index] = toast;
                }
            }
        });
    }

    showSectionToast(sectionIndex, message) {
        const toast = this.toasts[sectionIndex];
        if (!toast) return;
        toast.textContent = message;
        toast.classList.add('show');
        clearTimeout(toast._timer);
        toast._timer = setTimeout(() => { 
            toast.classList.remove('show'); 
        }, 2000);
    }

    buildColorThemes() {
        if (!this.colorContainer) return;
        const themes = getColorThemes();
        
        this.colorContainer.innerHTML = '';
        
        this.colorContainer.innerHTML = themes.map((theme, index) => `
            <div class="color-theme-circle" 
                 style="background: ${theme.color};" 
                 data-index="${index}"
                 title="${theme.name}">
            </div>
        `).join("");
    }

    buildVibrationPatterns() {
        if (!this.vibrationContainer) return;
        const patterns = getVibrationPatterns();
        const currentIndex = getCurrentPatternIndex();
        
        this.vibrationContainer.innerHTML = '';
        
        this.vibrationContainer.innerHTML = patterns.map((pattern) => `
            <div class="vibration-pattern-btn ${pattern.id === currentIndex ? 'active' : ''}" 
                 data-index="${pattern.id}"
                 title="${pattern.name}">
                <span class="vibration-pattern-icon">${pattern.icon}</span>
                <span class="vibration-pattern-name">${pattern.name}</span>
            </div>
        `).join("");
    }

    setupEventListeners() {
        this.themeModeBtns.forEach((btn) => {
            const newBtn = btn.cloneNode(true);
            btn.parentNode.replaceChild(newBtn, btn);
        });
        
        this.themeModeBtns = document.querySelectorAll(".theme-mode-btn");
        
        this.themeModeBtns.forEach((btn) => {
            btn.addEventListener("click", () => {
                const mode = btn.dataset.mode;
                applyMode(mode);
                this.updateThemeModeButtons(mode);
                const modeNames = { light: "روشن", dark: "تاریک", auto: "خودکار" };
                this.showSectionToast(0, modeNames[mode]);
            });
        });

        if (this.colorContainer) {
            const newContainer = this.colorContainer.cloneNode(true);
            this.colorContainer.parentNode.replaceChild(newContainer, this.colorContainer);
            this.colorContainer = newContainer;
            
            this.colorContainer.addEventListener("click", (e) => {
                const circle = e.target.closest(".color-theme-circle");
                if (!circle) return;
                const index = parseInt(circle.dataset.index);
                applyColorTheme(index);
                this.updateColorCircles(index);
                const themes = getColorThemes();
                this.showSectionToast(1, themes[index].name);
            });
        }

        if (this.vibrationContainer) {
            const newContainer = this.vibrationContainer.cloneNode(true);
            this.vibrationContainer.parentNode.replaceChild(newContainer, this.vibrationContainer);
            this.vibrationContainer = newContainer;
            
            this.vibrationContainer.addEventListener("click", (e) => {
                const btn = e.target.closest(".vibration-pattern-btn");
                if (!btn) return;
                const index = parseInt(btn.dataset.index);
                setVibrationPattern(index);
                this.updateVibrationButtons(index);
                const patterns = getVibrationPatterns();
                const pattern = patterns.find(p => p.id === index);
                if (pattern) {
                    this.showSectionToast(2, pattern.icon + ' ' + pattern.name);
                }
            });
        }
    }

    updateThemeModeButtons(mode) {
        this.themeModeBtns.forEach(btn => btn.classList.remove('active'));
        this.themeModeBtns.forEach(btn => {
            if (btn.dataset.mode === mode) {
                btn.classList.add('active');
            }
        });
    }

    updateColorCircles(index) {
        document.querySelectorAll(".color-theme-circle").forEach(el => el.classList.remove('active'));
        document.querySelectorAll(".color-theme-circle").forEach((el, i) => {
            if (i === index) {
                el.classList.add('active');
            }
        });
    }

    updateVibrationButtons(index) {
        document.querySelectorAll(".vibration-pattern-btn").forEach(el => el.classList.remove('active'));
        document.querySelectorAll(".vibration-pattern-btn").forEach(el => {
            if (parseInt(el.dataset.index) === index) {
                el.classList.add('active');
            }
        });
    }

    async loadSavedSettings() {
        this.clearAllActiveStates();
        
        const currentMode = await getStorage('themeMode', 'light');
        this.updateThemeModeButtons(currentMode);
        
        const currentColor = await getStorage('colorTheme', 0);
        this.updateColorCircles(currentColor);
        
        const currentVibration = await getStorage('vibrationPattern', 0);
        this.updateVibrationButtons(currentVibration);
    }
}