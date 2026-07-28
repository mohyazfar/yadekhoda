// ============================================
// grid.js - صفحه شبکه مرجع خالص
// ============================================

import { showPage } from './ui-utils.js';

var COLS = 10;
var ROWS = 18;

function getCellLabel(row, col) {
    var colLetter = String.fromCharCode(64 + col);
    return colLetter + row;
}

export function initGrid() {
    var container = document.getElementById('gridContainer');
    if (!container) {
        console.error('❌ gridContainer پیدا نشد!');
        return;
    }

    console.log('✅ gridContainer پیدا شد، ساخت شبکه...');

    container.innerHTML = '';

    var totalCells = 0;
    for (var row = 1; row <= ROWS; row++) {
        for (var col = 1; col <= COLS; col++) {
            var cell = document.createElement('div');
            cell.className = 'grid-cell';
            cell.textContent = getCellLabel(row, col);
            cell.dataset.row = row;
            cell.dataset.col = col;
            cell.dataset.address = getCellLabel(row, col);
            container.appendChild(cell);
            totalCells++;
        }
    }

    console.log('✅ ' + totalCells + ' سلول ساخته شد');
}

export function showGridPage() {
    showPage('pageGrid');
    // تاخیر بیشتر برای اطمینان از رندر شدن صفحه
    setTimeout(function() {
        initGrid();
    }, 100);
}