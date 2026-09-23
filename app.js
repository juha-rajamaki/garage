'use strict';

const STORAGE_KEY = 'garage-planner-v4';
let visible = new Set();

const board = document.getElementById('board');

// Car PNG crops + their exact position in the garage image (as % of image size)
// These match the crop coordinates used when creating the PNG files.
const CARS = {
  bmw: {
    img:    'car-bmw.png',
    // crop was: left=0, top=300, right=600, bottom=1024 from 1535x1024
    leftPct: 0 / 1535,
    topPct:  300 / 1024,
    widthPct: 600 / 1535,
  },
  porsche: {
    img:    'car-porsche.png',
    // crop: left=340, top=240, right=1020, bottom=1024
    leftPct: 340 / 1535,
    topPct:  240 / 1024,
    widthPct: 680 / 1535,
  },
  jeep: {
    img:    'car-jeep.png',
    // crop: left=870, top=200, right=1535, bottom=1024
    leftPct: 870 / 1535,
    topPct:  200 / 1024,
    widthPct: 665 / 1535,
  },
};

function loadState() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) { visible = new Set(JSON.parse(saved)); return; }
  } catch (_) {}
  visible = new Set();
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...visible]));
}

function renderBoard() {
  const bw = board.offsetWidth;
  const bh = board.offsetHeight;

  Object.entries(CARS).forEach(([key, car]) => {
    const existing = document.getElementById('car-img-' + key);

    if (visible.has(key)) {
      if (existing) return;
      const img = document.createElement('img');
      img.id        = 'car-img-' + key;
      img.src       = car.img;
      img.draggable = false;
      img.style.cssText = `
        position: absolute;
        left:   ${Math.round(car.leftPct  * bw)}px;
        top:    ${Math.round(car.topPct   * bh)}px;
        width:  ${Math.round(car.widthPct * bw)}px;
        height: auto;
        opacity: 0;
        transition: opacity 0.4s ease;
        pointer-events: none;
      `;
      board.appendChild(img);
      requestAnimationFrame(() => { img.style.opacity = '1'; });
    } else {
      if (!existing) return;
      existing.style.opacity = '0';
      setTimeout(() => existing.remove(), 420);
    }
  });
}

// ── Resize: rebuild layers ──
let resizeTimer;
window.addEventListener('resize', () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => {
    document.querySelectorAll('.car-layer').forEach(el => el.remove());
    renderBoard();
  }, 150);
});

// ── 3D Viewer Modal ──
const viewerOverlay = document.getElementById('viewer-overlay');
const viewerAdd     = document.getElementById('viewer-add');

function open3DViewer(key) {
  viewerOverlay.classList.remove('hidden');
  viewerAdd.dataset.key = key;
}

function close3DViewer() {
  viewerOverlay.classList.add('hidden');
}

function bind3DViewer() {
  document.getElementById('viewer-close').addEventListener('click', close3DViewer);
  viewerOverlay.addEventListener('click', e => {
    if (e.target === viewerOverlay) close3DViewer();
  });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') close3DViewer();
  });
  viewerAdd.addEventListener('click', () => {
    const key = viewerAdd.dataset.key;
    if (key) {
      visible.add(key);
      saveState();
      renderBoard();
      updateSidebarStates();
      close3DViewer();
    }
  });
}

// ── Sidebar toggle ──
function bindSidebar() {
  document.querySelectorAll('.lib-car').forEach(el => {
    const key = el.dataset.key;
    el.addEventListener('click', () => {
      if (key === 'porsche' && !visible.has(key)) {
        open3DViewer(key);
        return;
      }
      if (visible.has(key)) {
        visible.delete(key);
      } else {
        visible.add(key);
      }
      saveState();
      renderBoard();
      updateSidebarStates();
    });
  });
}

function updateSidebarStates() {
  document.querySelectorAll('.lib-car').forEach(el => {
    el.classList.toggle('active', visible.has(el.dataset.key));
  });
}

// ── Toolbar ──
function bindToolbar() {
  document.getElementById('btn-reset').addEventListener('click', () => {
    if (!confirm('Tyhjennetäänkö talli?')) return;
    visible.clear();
    saveState();
    document.querySelectorAll('.car-layer').forEach(el => el.remove());
    updateSidebarStates();
  });
}

// ── Init ──
function init() {
  loadState();
  renderBoard();
  bindSidebar();
  bind3DViewer();
  updateSidebarStates();
  bindToolbar();
}

window.addEventListener('DOMContentLoaded', init);
