// Wires Vice Coast Cover Studio: state, the control panel, drag-to-pan on the
// preview, photo uploads and the one-click PNG export. The cover itself is
// drawn by cover.js; this file only moves the state around it.
import { renderCover, renderExportCanvas, EXPORT_SIZES, TITLE_STYLES } from './cover.js';
import { LAYOUTS, LAYOUT_ORDER, panelsFor } from './layouts.js';
import { GRADES, GRADE_ORDER } from './grades.js';
import { runShot } from './shots.js';

const $ = (id) => document.getElementById(id);
const canvas = $('preview');
const ctx = canvas.getContext('2d');

const state = {
  layout: 'hero',
  grade: 'sunset',
  title: 'VICE COAST',
  subtitle: 'Sunset heist on Ocean Drive',
  titleStyle: 'sunset',
  titlePos: 'bottom',
  size: 'portrait',
  panels: [],
  selected: 0,
};

const photos = new Map();
const photoNames = new Map();
let photoSeq = 0;

const SAMPLES = [
  { id: 'sample-pier', name: 'Pier (sample)', src: 'samples/pier.jpg' },
  { id: 'sample-boulevard', name: 'Boulevard (sample)', src: 'samples/boulevard.jpg' },
];

function panelCount() {
  return panelsFor(state.layout, 100, 100).length;
}

function ensurePanels() {
  const n = panelCount();
  while (state.panels.length < n) state.panels.push({ photoId: null, zoom: 1, ox: 0, oy: 0 });
  state.panels.length = n;
  if (state.selected >= n) state.selected = 0;
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`could not load ${src}`));
    img.src = src;
  });
}

async function addPhotoFile(file) {
  const id = `up${++photoSeq}`;
  const url = URL.createObjectURL(file);
  const img = await loadImage(url);
  photos.set(id, img);
  photoNames.set(id, file.name);
  return id;
}

async function addSample(sample) {
  if (photos.has(sample.id)) return sample.id;
  const img = await loadImage(sample.src);
  photos.set(sample.id, img);
  return sample.id;
}

function assignPhotoToPanel(photoId, panelIndex) {
  ensurePanels();
  state.panels[panelIndex].photoId = photoId;
}

function fillAllPanels(photoId) {
  ensurePanels();
  state.panels.forEach((p) => { p.photoId = photoId; });
}

function previewSize() {
  const size = EXPORT_SIZES[state.size];
  const long = 880;
  const scale = long / Math.max(size.width, size.height);
  return { width: Math.round(size.width * scale), height: Math.round(size.height * scale) };
}

function redraw() {
  ensurePanels();
  const { width, height } = previewSize();
  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width;
    canvas.height = height;
  }
  renderCover(ctx, width, height, state, photos);
  syncPanelBar();
  syncSliders();
}

function setStatus(text) {
  $('status').textContent = text;
}

// ---- control builders ----

function buildPickers() {
  const layoutBox = $('layout-picker');
  LAYOUT_ORDER.forEach((id) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'pick';
    b.dataset.layout = id;
    b.innerHTML = `<span class="pick-name">${LAYOUTS[id].name}</span><span class="pick-hint">${LAYOUTS[id].hint}</span>`;
    b.addEventListener('click', () => {
      state.layout = id;
      ensurePanels();
      markPicked(layoutBox, id, 'data-layout');
      redraw();
    });
    layoutBox.appendChild(b);
  });
  const gradeBox = $('grade-picker');
  GRADE_ORDER.forEach((id) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'swatch';
    b.dataset.grade = id;
    b.style.background = `linear-gradient(135deg, ${GRADES[id].sky[0]}, ${GRADES[id].sky[1]} 55%, ${GRADES[id].sky[3]})`;
    b.title = `${GRADES[id].name} — ${GRADES[id].hint}`;
    b.setAttribute('aria-label', GRADES[id].name);
    b.addEventListener('click', () => {
      state.grade = id;
      markPicked(gradeBox, id, 'data-grade');
      redraw();
    });
    gradeBox.appendChild(b);
  });
  const styleBox = $('style-picker');
  Object.values(TITLE_STYLES).forEach((style) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'pick';
    b.dataset.style = style.id;
    b.innerHTML = `<span class="pick-name">${style.name}</span>`;
    b.addEventListener('click', () => {
      state.titleStyle = style.id;
      markPicked(styleBox, style.id, 'data-style');
      redraw();
    });
    styleBox.appendChild(b);
  });
  markPicked(layoutBox, state.layout, 'data-layout');
  markPicked(gradeBox, state.grade, 'data-grade');
  markPicked(styleBox, state.titleStyle, 'data-style');
}

function markPicked(box, id, attr) {
  box.querySelectorAll('button').forEach((b) => b.classList.toggle('active', b.getAttribute(attr) === id));
}

// ---- panel bar + sliders ----

function photoName(id) {
  if (!id) return 'Empty';
  if (id === 'sample-pier') return 'Pier';
  if (id === 'sample-boulevard') return 'Boulevard';
  return photoNames.get(id) ?? id;
}

function syncPanelBar() {
  const bar = $('panel-bar');
  bar.innerHTML = '';
  state.panels.forEach((panel, i) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = `panel-chip${i === state.selected ? ' active' : ''}`;
    b.textContent = `#${i + 1} · ${photoName(panel.photoId)}`;
    b.addEventListener('click', () => {
      state.selected = i;
      redraw();
    });
    bar.appendChild(b);
  });
  $('panel-label').textContent = `Panel ${state.selected + 1} of ${state.panels.length}`;
}

function syncSliders() {
  const panel = state.panels[state.selected];
  if (!panel) return;
  $('zoom').value = panel.zoom;
  $('pan-x').value = panel.ox;
  $('pan-y').value = panel.oy;
  $('zoom-val').textContent = `${Math.round(panel.zoom * 100)}%`;
}

function bindSliders() {
  $('zoom').addEventListener('input', (e) => { state.panels[state.selected].zoom = Number(e.target.value); redraw(); });
  $('pan-x').addEventListener('input', (e) => { state.panels[state.selected].ox = Number(e.target.value); redraw(); });
  $('pan-y').addEventListener('input', (e) => { state.panels[state.selected].oy = Number(e.target.value); redraw(); });
}

// ---- drag to pan on the preview ----

function panelAtPoint(px, py) {
  const rects = panelsFor(state.layout, canvas.width, canvas.height);
  for (let i = rects.length - 1; i >= 0; i -= 1) {
    const r = rects[i];
    const cx = r.x + r.w / 2;
    const cy = r.y + r.h / 2;
    const angle = -((r.rot ?? 0) * Math.PI) / 180;
    const dx = px - cx;
    const dy = py - cy;
    const lx = dx * Math.cos(angle) - dy * Math.sin(angle) + r.w / 2;
    const ly = dx * Math.sin(angle) + dy * Math.cos(angle) + r.h / 2;
    if (lx >= 0 && lx <= r.w && ly >= 0 && ly <= r.h) return i;
  }
  return -1;
}

function bindDrag() {
  let drag = null;
  canvas.addEventListener('pointerdown', (e) => {
    const box = canvas.getBoundingClientRect();
    const px = ((e.clientX - box.left) / box.width) * canvas.width;
    const py = ((e.clientY - box.top) / box.height) * canvas.height;
    const hit = panelAtPoint(px, py);
    if (hit < 0) return;
    state.selected = hit;
    const panel = state.panels[hit];
    const img = panel.photoId ? photos.get(panel.photoId) : null;
    drag = { index: hit, lastX: px, lastY: py, img };
    canvas.setPointerCapture(e.pointerId);
    redraw();
  });
  canvas.addEventListener('pointermove', (e) => {
    if (!drag || !drag.img) return;
    const box = canvas.getBoundingClientRect();
    const px = ((e.clientX - box.left) / box.width) * canvas.width;
    const py = ((e.clientY - box.top) / box.height) * canvas.height;
    const rects = panelsFor(state.layout, canvas.width, canvas.height);
    const r = rects[drag.index];
    const panel = state.panels[drag.index];
    const base = Math.max(r.w / drag.img.naturalWidth, r.h / drag.img.naturalHeight) * panel.zoom;
    const dw = drag.img.naturalWidth * base;
    const dh = drag.img.naturalHeight * base;
    const maxX = Math.max(1, (dw - r.w) / 2);
    const maxY = Math.max(1, (dh - r.h) / 2);
    panel.ox = Math.max(-1, Math.min(1, panel.ox + (px - drag.lastX) / maxX));
    panel.oy = Math.max(-1, Math.min(1, panel.oy + (py - drag.lastY) / maxY));
    drag.lastX = px;
    drag.lastY = py;
    redraw();
  });
  canvas.addEventListener('pointerup', () => { drag = null; });
}

// ---- photos, caption, export ----

function bindPhotos() {
  $('photo-file').addEventListener('change', async (e) => {
    const files = [...e.target.files];
    if (!files.length) return;
    try {
      const ids = [];
      for (const file of files) ids.push(await addPhotoFile(file));
      // First uploaded photo fills empty panels; extra photos go one per panel.
      ensurePanels();
      ids.forEach((id, k) => {
        if (k === 0) {
          state.panels.forEach((p) => { if (!p.photoId) p.photoId = id; });
        } else if (k < state.panels.length) {
          state.panels[k].photoId = id;
        }
      });
      setStatus(`${files.length} photo${files.length > 1 ? 's' : ''} loaded — drag any panel to reposition it.`);
      redraw();
    } catch (err) {
      setStatus(`Could not read that photo: ${err.message}`);
    }
    e.target.value = '';
  });
  $('sample-pier').addEventListener('click', async () => {
    const id = await addSample(SAMPLES[0]);
    fillAllPanels(id);
    setStatus('Pier sample loaded into every panel — pick another photo to swap any panel.');
    redraw();
  });
  $('sample-boulevard').addEventListener('click', async () => {
    const id = await addSample(SAMPLES[1]);
    fillAllPanels(id);
    setStatus('Boulevard sample loaded into every panel.');
    redraw();
  });
  $('fill-all').addEventListener('click', () => {
    const panel = state.panels[state.selected];
    if (!panel?.photoId) { setStatus('Pick a photo for this panel first.'); return; }
    fillAllPanels(panel.photoId);
    setStatus(`Panel ${state.selected + 1}'s photo now fills every panel.`);
    redraw();
  });
  $('clear-panel').addEventListener('click', () => {
    state.panels[state.selected].photoId = null;
    state.panels[state.selected].zoom = 1;
    state.panels[state.selected].ox = 0;
    state.panels[state.selected].oy = 0;
    redraw();
  });
}

function bindCaption() {
  $('title-input').addEventListener('input', (e) => { state.title = e.target.value; redraw(); });
  $('subtitle-input').addEventListener('input', (e) => { state.subtitle = e.target.value; redraw(); });
  $('title-pos').addEventListener('change', (e) => { state.titlePos = e.target.value; redraw(); });
}

function bindExport() {
  const sizeBox = $('size-picker');
  Object.values(EXPORT_SIZES).forEach((size) => {
    const label = document.createElement('label');
    label.className = 'size-opt';
    label.innerHTML = `<input type="radio" name="export-size" value="${size.id}"${size.id === state.size ? ' checked' : ''}> <span>${size.name}<br><b>${size.label}</b></span>`;
    label.querySelector('input').addEventListener('change', () => {
      state.size = size.id;
      redraw();
    });
    sizeBox.appendChild(label);
  });
  $('export').addEventListener('click', () => exportCover(state.size));
}

function exportCover(sizeId) {
  const size = EXPORT_SIZES[sizeId] ?? EXPORT_SIZES.square;
  const out = renderExportCanvas(size.id, state, photos);
  out.toBlob((blob) => {
    if (!blob) { setStatus('Export failed — try again.'); return; }
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `vice-coast-cover-${size.width}x${size.height}.png`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 5000);
    setStatus(`Saved vice-coast-cover-${size.width}x${size.height}.png — share it anywhere.`);
  }, 'image/png');
}

// Test hook: the screenshot script exports through the same path the button uses.
window.__viceCoast = {
  state,
  photos,
  redraw,
  exportDataURL(sizeId) {
    const out = renderExportCanvas(sizeId, state, photos);
    return out.toDataURL('image/png');
  },
  exportSize(sizeId) {
    const out = renderExportCanvas(sizeId, state, photos);
    return { width: out.width, height: out.height };
  },
};

buildPickers();
bindSliders();
bindDrag();
bindPhotos();
bindCaption();
bindExport();
ensurePanels();

const query = new URLSearchParams(location.search);
if (query.get('shot')) {
  runShot(query, { state, photos, addSample, fillAllPanels, redraw, setSize: (id) => { state.size = id; } });
} else {
  addSample(SAMPLES[0]).then((id) => { fillAllPanels(id); redraw(); });
  redraw();
}
