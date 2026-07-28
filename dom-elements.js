// ============================================
// dom-elements.js - المان‌های DOM
// ============================================

export const DOM = {
    home: {
        lastZekrBox: document.getElementById('lastZekrBox'),
        lastZekrText: document.getElementById('lastZekrText'),
        lastZekrFill: document.getElementById('lastZekrFill'),
        homeBtns: document.querySelectorAll('.homeBtn'),
        homeGrid: document.querySelector('.homeGrid')
    },
    counter: {
        zekrText: document.getElementById('zekrText'),
        meaning: document.getElementById('meaning'),
        countBtn: document.getElementById('countBtn'),
        resetBtn: document.getElementById('resetBtn'),
        vibrateBtn: document.getElementById('vibrateBtn'),
        progressBox: document.getElementById('counterProgressBox'),
        progressFill: document.getElementById('counterProgressFill'),
        resetToast: document.getElementById('resetToast')
    },
    pages: {
        home: document.getElementById('pageHome'),
        counter: document.getElementById('pageCounter'),
        zekr: document.getElementById('pageZekr'),
        settings: document.getElementById('pageSettings'),
        about: document.getElementById('pageAbout'),
        favorites: document.getElementById('pageFavorites'),
        addZekr: document.getElementById('pageAddZekr'),
        editZekr: document.getElementById('pageEditZekr'),
        preview: document.getElementById('pagePreview')
    },
    footer: {
        weekday: document.getElementById('weekday'),
        time: document.getElementById('time'),
        dateShamsi: document.getElementById('dateShamsi')
    },
    toast: document.getElementById('toast'),
    mainApp: document.getElementById('mainApp'),
    zekrListContainer: document.getElementById('zekrListContainer'),
    favoritesContainer: document.getElementById('favoritesContainer'),
    forms: {
        addZekr: {
            text: document.getElementById('inputZekrText'),
            meaning: document.getElementById('inputZekrMeaning'),
            target: document.getElementById('inputZekrTarget'),
            previewBtn: document.getElementById('previewZekrBtn')
        },
        editZekr: {
            text: document.getElementById('editZekrText'),
            meaning: document.getElementById('editZekrMeaning'),
            target: document.getElementById('editZekrTarget'),
            updateBtn: document.getElementById('updateZekrBtn')
        },
        preview: {
            text: document.getElementById('previewCardText'),
            meaning: document.getElementById('previewCardMeaning'),
            target: document.getElementById('previewCardTarget'),
            editBtn: document.getElementById('editFromPreviewBtn'),
            confirmBtn: document.getElementById('confirmFromPreviewBtn')
        }
    },
    buttons: {
        addZekr: document.getElementById('addZekrBtn'),
        goToZekr: document.getElementById('goToZekrFromFavorites'),
        support: document.getElementById('supportBtn')
    }
};