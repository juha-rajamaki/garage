'use strict';

const STORAGE_KEY = 'garage-planner-v4';
let visible = new Set();

const board = document.getElementById('board');

// ── Background images: empty garage vs full garage ──
// We composite cars by layering full-garage image regions as absolutely
// positioned divs that show only the car's area via clip-path.
// This avoids cutout artifacts entirely.

const CAR_CLIPS = {
  bmw: {
    // Position & size as % of board — matches where BMW sits in garage.jpg
    left:   '0%',
    top:    '28%',
    width:  '38%',
    height: '72%',
    // clip-path inset removes the empty sides of the full image region
    clipPath: 'inset(0 0 0 0)',
  },
  porsche: {
    left:   '23%',
    top:    '22%',
    width:  '45%',
    height: '78%',
    clipPath: 'inset(0 0 0 0)',
  },
  jeep: {
    left:   '58%',
    top:    '18%',
    width:  '42%',
    height: '82%',
    clipPath: 'inset(0 0 0 0)',
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

// Each car layer is a div that shows the full-garage image
// at the same size/position as the board, cropped to the car's area.
function renderBoard() {
  const bw = board.offsetWidth;
  const bh = board.offsetHeight;

  ['bmw', 'porsche', 'jeep'].forEach(key => {
    const existing = document.getElementById('car-layer-' + key);
    const c = CAR_CLIPS[key];

    if (visible.has(key)) {
      if (existing) return;

      const layer = document.createElement('div');
      layer.id = 'car-layer-' + key;
      layer.className = 'car-layer';

      // The inner div shows the full garage.jpg, offset to align with board bg
      layer.style.cssText = `
        position: absolute;
        left: ${c.left};
        top: ${c.top};
        width: ${c.width};
        height: ${c.height};
        overflow: hidden;
        opacity: 0;
        transition: opacity 0.4s ease;
        pointer-events: none;
      `;

      // Inner: full-size garage image positioned to align perfectly
      const inner = document.createElement('div');
      inner.style.cssText = `
        position: absolute;
        background-image: url('garage.jpg');
        background-size: cover;
        background-position: center top;
        top: 0; left: 0;
        width: 100%;
        height: 100%;
      `;

      // We need to "undo" the clip offset so the bg aligns with board
      // Use a pseudo-full-size container trick
      const fullW = bw;
      const fullH = bh;
      const leftPx  = parseFloat(c.left)  / 100 * fullW;
      const topPx   = parseFloat(c.top)   / 100 * fullH;
      const wPx     = parseFloat(c.width)  / 100 * fullW;
      const hPx     = parseFloat(c.height) / 100 * fullH;

      inner.style.width      = (fullW / wPx * 100) + '%';
      inner.style.height     = (fullH / hPx * 100) + '%';
      inner.style.left       = -(leftPx / wPx * 100) + '%';
      inner.style.top        = -(topPx  / hPx * 100) + '%';

      layer.appendChild(inner);
      board.appendChild(layer);
      requestAnimationFrame(() => { layer.style.opacity = '1'; });

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
