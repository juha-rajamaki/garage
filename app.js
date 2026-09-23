'use strict';

// ── SVG templates for each car (keyed by "make|model") ──
const CAR_SVGS = {
  'BMW|Z4 35is': `<svg viewBox="0 0 80 30" fill="none" xmlns="http://www.w3.org/2000/svg">
    <ellipse cx="40" cy="22" rx="36" ry="6" fill="#1a1a1a" opacity="0.4"/>
    <path d="M8 20 Q12 10 22 8 Q30 5 40 5 Q52 5 62 9 Q70 12 72 20 Z" fill="#1a1a1a"/>
    <path d="M20 20 Q22 12 30 10 Q38 8 48 10 Q56 12 58 20" fill="#2c2c2c"/>
    <rect x="14" y="18" width="52" height="5" rx="2" fill="#111"/>
    <circle cx="20" cy="23" r="4" fill="#0a0a0a" stroke="#555" stroke-width="1"/>
    <circle cx="20" cy="23" r="2" fill="#222"/>
    <circle cx="60" cy="23" r="4" fill="#0a0a0a" stroke="#555" stroke-width="1"/>
    <circle cx="60" cy="23" r="2" fill="#222"/>
    <rect x="62" y="14" width="8" height="4" rx="1" fill="#3a90ff" opacity="0.9"/>
    <rect x="8" y="14" width="6" height="4" rx="1" fill="#ff4444" opacity="0.7"/>
  </svg>`,
  'Porsche|Panamera E-Hybrid': `<svg viewBox="0 0 80 30" fill="none" xmlns="http://www.w3.org/2000/svg">
    <ellipse cx="40" cy="22" rx="36" ry="6" fill="#4a4a4a" opacity="0.4"/>
    <path d="M8 20 Q10 12 20 9 Q30 6 40 6 Q52 6 62 10 Q70 13 72 20 Z" fill="#5a5a5a"/>
    <path d="M18 20 Q20 12 30 10 Q40 8 50 10 Q58 12 60 20" fill="#6e6e6e"/>
    <rect x="12" y="18" width="56" height="5" rx="2" fill="#3a3a3a"/>
    <circle cx="20" cy="23" r="4" fill="#0a0a0a" stroke="#666" stroke-width="1"/>
    <circle cx="20" cy="23" r="2" fill="#222"/>
    <circle cx="60" cy="23" r="4" fill="#0a0a0a" stroke="#666" stroke-width="1"/>
    <circle cx="60" cy="23" r="2" fill="#222"/>
    <rect x="62" y="14" width="8" height="4" rx="1" fill="#ffe082" opacity="0.9"/>
    <rect x="8" y="14" width="6" height="4" rx="1" fill="#ffe082" opacity="0.7"/>
  </svg>`,
  'Jeep|Wrangler Rubicon': `<svg viewBox="0 0 80 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <ellipse cx="40" cy="25" rx="36" ry="6" fill="#f0f0f0" opacity="0.2"/>
    <rect x="10" y="8" width="60" height="16" rx="1" fill="#e8e8e8"/>
    <rect x="14" y="5" width="52" height="14" rx="1" fill="#f5f5f5"/>
    <rect x="16" y="7" width="22" height="9" rx="1" fill="#1a3040" opacity="0.7"/>
    <rect x="42" y="7" width="22" height="9" rx="1" fill="#1a3040" opacity="0.7"/>
    <rect x="10" y="22" width="60" height="4" rx="1" fill="#d0d0d0"/>
    <circle cx="20" cy="26" r="5" fill="#111" stroke="#555" stroke-width="1.5"/>
    <circle cx="20" cy="26" r="2.5" fill="#2a2a2a"/>
    <circle cx="60" cy="26" r="5" fill="#111" stroke="#555" stroke-width="1.5"/>
    <circle cx="60" cy="26" r="2.5" fill="#2a2a2a"/>
    <rect x="64" y="14" width="8" height="5" rx="1" fill="#f5f5f5" opacity="0.9"/>
    <rect x="6" y="14" width="6" height="5" rx="1" fill="#f5f5f5" opacity="0.7"/>
  </svg>`,
};

function getSvg(make, model) {
  return CAR_SVGS[`${make}|${model}`] || CAR_SVGS['BMW|M5'];
}

// ── Library car definitions (same order as sidebar HTML) ──
const LIBRARY_CARS = [
  { make: 'BMW',     model: 'Z4 35is' },
  { make: 'Porsche', model: 'Panamera E-Hybrid' },
  { make: 'Jeep',    model: 'Wrangler Rubicon' },
];

// ── State ──
let cars = [];      // cars currently visible on the board
let nextId = 1;
let editingId = null;

const board = document.getElementById('board');
const modalOverlay = document.getElementById('modal-overlay');
const toast = createToast();

// ── Init ──
function init() {
  loadState();
  renderAll();
  bindSidebar();
  updateSidebarStates();
  bindToolbar();
  bindModal();
}

function loadState() {
  localStorage.removeItem('garage-planner-v1'); // clean up old key
  try {
    const saved = localStorage.getItem('garage-planner-v2');
    if (saved) {
      const parsed = JSON.parse(saved);
      cars = parsed.cars || [];
      nextId = parsed.nextId || 1;
      return;
    }
  } catch (_) {}
  // First load: empty board
  cars = [];
  nextId = 1;
}

function saveState() {
  localStorage.setItem('garage-planner-v2', JSON.stringify({ cars, nextId }));
}

// ── Rendering ──
function renderAll() {
  board.querySelectorAll('.car-card').forEach(el => el.remove());
  cars.forEach(c => renderCard(c));
}

function renderCard(car) {
  const existing = document.getElementById(car.id);
  if (existing) existing.remove();

  const el = document.createElement('div');
  el.className = 'car-card';
  el.id = car.id;
  el.style.left = car.x + 'px';
  el.style.top  = car.y + 'px';

  el.innerHTML = `
    <div class="card-header">
      <span class="spot-badge">${escHtml(car.spot || '—')}</span>
      <button class="card-delete" title="Remove">&times;</button>
    </div>
    <div class="card-car-icon">${getSvg(car.make, car.model)}</div>
    <div class="card-details">
      <div class="card-make-model">${escHtml(car.make)} ${escHtml(car.model)}</div>
      <div class="card-owner">${escHtml(car.owner)}</div>
      <div class="card-notes">${escHtml(car.notes)}</div>
      <div class="card-edit-hint">double-click to edit</div>
    </div>
  `;

  el.querySelector('.card-delete').addEventListener('click', e => {
    e.stopPropagation();
    deleteCar(car.id);
  });

  el.addEventListener('dblclick', e => {
    e.stopPropagation();
    openModal(car.id);
  });

  makeDraggable(el, car);
  board.appendChild(el);
}

// ── Drag & drop ──
function makeDraggable(el, car) {
  let startX, startY, startLeft, startTop, dragging = false;

  el.addEventListener('mousedown', e => {
    if (e.target.classList.contains('card-delete')) return;
    if (e.detail === 2) return; // let dblclick through
    e.preventDefault();
    dragging = true;
    startX = e.clientX;
    startY = e.clientY;
    startLeft = car.x;
    startTop  = car.y;
    el.classList.add('dragging');

    // bring to front
    el.style.zIndex = 50;

    function onMove(ev) {
      if (!dragging) return;
      const dx = ev.clientX - startX;
      const dy = ev.clientY - startY;
      const bw = board.offsetWidth;
      const bh = board.offsetHeight;
      car.x = Math.max(0, Math.min(bw - el.offsetWidth,  startLeft + dx));
      car.y = Math.max(0, Math.min(bh - el.offsetHeight, startTop  + dy));
      el.style.left = car.x + 'px';
      el.style.top  = car.y + 'px';
    }

    function onUp() {
      dragging = false;
      el.classList.remove('dragging');
      el.style.zIndex = '';
      saveState();
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    }

    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  });
}

// ── Modal ──
function openModal(id) {
  editingId = id;
  const car = cars.find(c => c.id === id);
  if (!car) return;

  document.getElementById('field-make-model').value = `${car.make} ${car.model}`;
  document.getElementById('field-owner').value  = car.owner;
  document.getElementById('field-spot').value   = car.spot;
  document.getElementById('field-notes').value  = car.notes;
  document.getElementById('modal-car-icon').innerHTML = getSvg(car.make, car.model);

  modalOverlay.classList.remove('hidden');
  document.getElementById('field-owner').focus();
}

function closeModal() {
  modalOverlay.classList.add('hidden');
  editingId = null;
}

function saveModal() {
  const car = cars.find(c => c.id === editingId);
  if (!car) return;

  const rawMakeModel = document.getElementById('field-make-model').value.trim();
  const parts = rawMakeModel.split(' ');
  car.make  = parts[0] || car.make;
  car.model = parts.slice(1).join(' ') || car.model;
  car.owner = document.getElementById('field-owner').value.trim();
  car.spot  = document.getElementById('field-spot').value.trim().toUpperCase() || '—';
  car.notes = document.getElementById('field-notes').value.trim();

  renderCard(car);
  saveState();
  closeModal();
  showToast('Car details saved');
}

function bindModal() {
  document.getElementById('modal-close').addEventListener('click', closeModal);
  document.getElementById('modal-save').addEventListener('click', saveModal);
  document.getElementById('modal-delete').addEventListener('click', () => {
    deleteCar(editingId);
    closeModal();
  });
  modalOverlay.addEventListener('click', e => {
    if (e.target === modalOverlay) closeModal();
  });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeModal();
    if (e.key === 'Enter' && !modalOverlay.classList.contains('hidden') && e.target.tagName !== 'TEXTAREA') {
      saveModal();
    }
  });
}

// ── Sidebar ──
function bindSidebar() {
  document.querySelectorAll('.lib-car').forEach(el => {
    el.addEventListener('click', () => {
      const make  = el.dataset.make;
      const model = el.dataset.model;
      toggleCar(make, model, el);
    });
  });
}

function toggleCar(make, model, libEl) {
  const key = `${make}|${model}`;
  const existing = cars.find(c => `${c.make}|${c.model}` === key);

  if (existing) {
    // Already on board — remove it
    deleteCar(existing.id);
    libEl.classList.remove('active');
    libEl.classList.add('hidden-car');
    showToast(`${make} ${model} removed`);
  } else {
    // Not on board — add it
    const bw = board.offsetWidth;
    const bh = board.offsetHeight;
    const x = Math.round(bw / 2 - 45 + (Math.random() - 0.5) * 80);
    const y = Math.round(bh / 2 - 40 + (Math.random() - 0.5) * 60);

    const car = {
      id:    'car-' + (nextId++),
      make,
      model,
      owner: '',
      notes: '',
      spot:  String.fromCharCode(64 + Math.ceil(cars.length / 3)) + ((cars.length % 3) + 1),
      x:     Math.max(0, Math.min(bw - 160, x)),
      y:     Math.max(0, Math.min(bh - 120, y)),
    };

    cars.push(car);
    renderCard(car);
    saveState();
    libEl.classList.add('active');
    libEl.classList.remove('hidden-car');
    showToast(`${make} ${model} added`);
  }
}

// Sync sidebar button states to current board contents
function updateSidebarStates() {
  document.querySelectorAll('.lib-car').forEach(el => {
    const key = `${el.dataset.make}|${el.dataset.model}`;
    const onBoard = cars.some(c => `${c.make}|${c.model}` === key);
    el.classList.toggle('active', onBoard);
    el.classList.toggle('hidden-car', !onBoard);
  });
}

// ── Delete ──
function deleteCar(id) {
  cars = cars.filter(c => c.id !== id);
  const el = document.getElementById(id);
  if (el) {
    el.style.transition = 'opacity 0.2s, transform 0.2s';
    el.style.opacity = '0';
    el.style.transform = 'scale(0.85)';
    setTimeout(() => el.remove(), 220);
  }
  saveState();
  updateSidebarStates();
}

// ── Toolbar ──
function bindToolbar() {
  document.getElementById('btn-reset').addEventListener('click', () => {
    if (!confirm('Reset board to defaults? This will remove all custom cars and positions.')) return;
    localStorage.removeItem('garage-planner-v2');
    cars = [];
    loadState();
    renderAll();
    updateSidebarStates();
    showToast('Board cleared');
  });

  document.getElementById('btn-save').addEventListener('click', () => {
    const json = JSON.stringify({ exportedAt: new Date().toISOString(), cars }, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = 'garage-layout.json';
    a.click();
    URL.revokeObjectURL(url);
    showToast('Layout saved as JSON');
  });
}

// ── Toast ──
function createToast() {
  const el = document.createElement('div');
  el.id = 'toast';
  document.body.appendChild(el);
  return el;
}

let toastTimer;
function showToast(msg) {
  toast.textContent = msg;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 2400);
}

// ── Util ──
function escHtml(s) {
  return String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

window.addEventListener('DOMContentLoaded', init);
