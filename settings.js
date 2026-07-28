import { ThemeManager } from './theme.js';
import { SoundManager } from './sound.js';
import { VibrationManager } from './vibration.js';
import { SettingsUI } from './settings-ui.js';

export { ThemeManager, SoundManager, VibrationManager, SettingsUI };

let settingsUI = null;

export function initSettings() {
    if (!settingsUI) settingsUI = new SettingsUI();
    return settingsUI;
}

export function getSettingsUI() { return settingsUI; }