'use strict';

// ── Car definitions — position on board as % of board size ──
const CARS = [
  {
    key:   'bmw',
    make:  'BMW',
    model: 'Z4 35is',
    img:   'car-bmw.png',
    // left third of the board, bottom-aligned
    xPct:  0.01,
    yPct:  0.18,
    wPct:  0.34,
  },
  {
    key:   'porsche',
    make:  'Porsche',
    model: 'Panamera E-Hybrid',
    img:   'car-porsche.png',
    xPct:  0.28,
    yPct:  0.10,
    wPct:  0.38,
  },
  {
    key:   'jeep',
    make:  'Jeep',
    model: 'Wrangler Rubicon',
    img:   'car-jeep.png',
    xPct:  0.60,
    yPct:  0.05,
    wPct:  0.40,
  },
];

// ── State: which cars are visible ──
const STORAGE_KEY = 'garage-planner-v3';
let visible = new Set();

const board = document.getElementById('board');

function loadState() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const arr = JSON.parse(saved);
      visible = new Set(arr);
      return;
    }
  } catch (_) {}
  visible = new Set();
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...visible]));
}

// ── Render: place/remove car images on board ──
function renderBoard() {
  const bw = board.offsetWidth;
  const bh = board.offsetHeight;

  CARS.forEach(car => {
    const existing = document.getElementById('car-img-' + car.key);
    if (visible.has(car.key)) {
      if (existing) return; // already shown
      const img = document.createElement('img');
      img.id  = 'car-img-' + car.key;
      img.src = car.img;
      img.alt = `${car.make} ${car.model}`;
      img.draggable = false;
      img.className = 'car-on-board';
      img.style.left   = Math.round(car.xPct * bw) + 'px';
      img.style.top    = Math.round(car.yPct * bh) + 'px';
      img.style.width  = Math.round(car.wPct * bw) + 'px';
      img.style.height = 'auto';
      // fade in
      img.style.opacity = '0';
      img.style.transition = 'opacity 0.35s ease';
      board.appendChild(img);
      requestAnimationFrame(() => { img.style.opacity = '1'; });
    } else {
      if (!existing) return;
      existing.style.opacity = '0';
      setTimeout(() => existing.remove(), 360);
    }
  });
}

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
    el.addEventListener('click', e => {
      // If this car has a 3D model and is not yet on the board, open viewer
      if (key === 'porsche' && !visible.has(key)) {
        open3DViewer(key);
        return;
      }
      // Otherwise toggle
      if (visible.has(key)) {
        visible.delete(key);
        el.classList.remove('active');
      } else {
        visible.add(key);
        el.classList.add('active');
      }
      saveState();
      renderBoard();
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
    renderBoard();
    updateSidebarStates();
  });
}

// ── Resize: reposition cars if window resizes ──
let resizeTimer;
window.addEventListener('resize', () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => {
    // Remove all and re-render at new positions
    document.querySelectorAll('.car-on-board').forEach(el => el.remove());
    renderBoard();
  }, 150);
});

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
