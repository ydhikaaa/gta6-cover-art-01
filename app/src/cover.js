// The cover engine for Vice Coast Cover Studio: draws a whole poster — sky,
// photo panels, colour grade, grain, vignette and the big GTA-style lettering —
// onto any 2D canvas at any size. The same function draws the live preview
// and the exported PNG, so what you see is exactly what you share.
import { panelsFor } from './layouts.js';
import { gradeFor } from './grades.js';

export const EXPORT_SIZES = {
  square: { id: 'square', name: 'Square post', label: '1080 x 1080', width: 1080, height: 1080 },
  portrait: { id: 'portrait', name: 'Portrait post', label: '1080 x 1350', width: 1080, height: 1350 },
  wide: { id: 'wide', name: 'Wide post', label: '1920 x 1080', width: 1920, height: 1080 },
};

export const TITLE_STYLES = {
  white: { id: 'white', name: 'White Block', kind: 'solid', fill: '#ffffff', stroke: '#14101c' },
  sunset: { id: 'sunset', name: 'Sunset Fade', kind: 'gradient', stops: ['#fff7ae', '#ff8a3d', '#ff2e63'], stroke: '#1c0b2e' },
  neon: { id: 'neon', name: 'Neon Glow', kind: 'solid', fill: '#eafcff', stroke: '#12003a', glow: '#ff2bd6' },
  gold: { id: 'gold', name: 'Gold Plate', kind: 'gradient', stops: ['#fff3b0', '#f5b301', '#b97d10'], stroke: '#241503' },
};

let noiseTile = null;

function getNoiseTile() {
  if (noiseTile) return noiseTile;
  const tile = document.createElement('canvas');
  tile.width = 128;
  tile.height = 128;
  const tctx = tile.getContext('2d');
  const data = tctx.createImageData(128, 128);
  for (let i = 0; i < data.data.length; i += 4) {
    const v = Math.floor(Math.random() * 256);
    data.data[i] = v;
    data.data[i + 1] = v;
    data.data[i + 2] = v;
    data.data[i + 3] = 255;
  }
  tctx.putImageData(data, 0, 0);
  noiseTile = tile;
  return tile;
}

function drawSky(ctx, width, height, grade) {
  const sky = ctx.createLinearGradient(0, 0, width * 0.25, height);
  grade.sky.forEach((color, i) => sky.addColorStop(i / (grade.sky.length - 1), color));
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, width, height);
  // A low sun disc, half sunk behind the panels.
  const sunX = width * 0.72;
  const sunY = height * 0.42;
  const sunR = Math.min(width, height) * 0.16;
  const sun = ctx.createRadialGradient(sunX, sunY, 0, sunX, sunY, sunR);
  sun.addColorStop(0, 'rgba(255, 244, 190, 0.95)');
  sun.addColorStop(0.55, 'rgba(255, 190, 90, 0.55)');
  sun.addColorStop(1, 'rgba(255, 120, 60, 0)');
  ctx.fillStyle = sun;
  ctx.fillRect(sunX - sunR, sunY - sunR, sunR * 2, sunR * 2);
}

/** Draws one photo into a panel rect, cover-fit, with zoom and pan. */
function drawPhotoInto(ctx, img, rect, placement, filter) {
  const { x, y, w, h } = rect;
  const zoom = placement?.zoom ?? 1;
  const ox = placement?.ox ?? 0;
  const oy = placement?.oy ?? 0;
  const base = Math.max(w / img.naturalWidth, h / img.naturalHeight);
  const scale = base * zoom;
  const dw = img.naturalWidth * scale;
  const dh = img.naturalHeight * scale;
  const maxShiftX = Math.max(0, (dw - w) / 2);
  const maxShiftY = Math.max(0, (dh - h) / 2);
  const dx = x + (w - dw) / 2 + ox * maxShiftX;
  const dy = y + (h - dh) / 2 + oy * maxShiftY;
  ctx.save();
  ctx.filter = filter;
  ctx.drawImage(img, dx, dy, dw, dh);
  ctx.restore();
}

function drawPanel(ctx, img, rect, placement, grade) {
  const frame = Math.max(3, Math.round(Math.min(rect.w, rect.h) * 0.012));
  ctx.save();
  ctx.translate(rect.x + rect.w / 2, rect.y + rect.h / 2);
  ctx.rotate(((rect.rot ?? 0) * Math.PI) / 180);
  ctx.translate(-rect.w / 2, -rect.h / 2);
  // White poster frame.
  ctx.fillStyle = '#fdfbf7';
  ctx.fillRect(-frame, -frame, rect.w + frame * 2, rect.h + frame * 2);
  ctx.beginPath();
  ctx.rect(0, 0, rect.w, rect.h);
  ctx.clip();
  if (img) {
    drawPhotoInto(ctx, img, { x: 0, y: 0, w: rect.w, h: rect.h }, placement, grade.photoFilter);
  } else {
    const empty = ctx.createLinearGradient(0, 0, rect.w, rect.h);
    empty.addColorStop(0, '#3a2b4d');
    empty.addColorStop(1, '#1c1030');
    ctx.fillStyle = empty;
    ctx.fillRect(0, 0, rect.w, rect.h);
    ctx.fillStyle = 'rgba(255,255,255,0.75)';
    ctx.font = `700 ${Math.round(rect.h * 0.09)}px system-ui, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('+ ADD PHOTO', rect.w / 2, rect.h / 2);
  }
  // Grade wash over the photo.
  const wash = ctx.createLinearGradient(0, 0, rect.w * 0.3, rect.h);
  grade.wash.forEach((color, i) => wash.addColorStop(i / (grade.wash.length - 1), color));
  ctx.fillStyle = wash;
  ctx.fillRect(0, 0, rect.w, rect.h);
  ctx.restore();
  // Hard drop shadow under the frame.
  ctx.save();
  ctx.translate(rect.x + rect.w / 2, rect.y + rect.h / 2);
  ctx.rotate(((rect.rot ?? 0) * Math.PI) / 180);
  ctx.strokeStyle = 'rgba(10, 5, 20, 0.45)';
  ctx.lineWidth = Math.max(2, frame * 0.7);
  ctx.strokeRect(-frame / 2, -frame / 2, rect.w + frame, rect.h + frame);
  ctx.restore();
}

function drawGrain(ctx, width, height) {
  const tile = getNoiseTile();
  const pattern = ctx.createPattern(tile, 'repeat');
  ctx.save();
  ctx.globalAlpha = 0.07;
  ctx.globalCompositeOperation = 'overlay';
  ctx.fillStyle = pattern;
  ctx.fillRect(0, 0, width, height);
  ctx.restore();
}

function drawVignette(ctx, width, height) {
  const r = Math.hypot(width, height) / 2;
  const vg = ctx.createRadialGradient(width / 2, height / 2, r * 0.55, width / 2, height / 2, r);
  vg.addColorStop(0, 'rgba(0, 0, 0, 0)');
  vg.addColorStop(1, 'rgba(8, 2, 18, 0.38)');
  ctx.fillStyle = vg;
  ctx.fillRect(0, 0, width, height);
}

const TITLE_FONT = '"Arial Black", "Helvetica Neue", Impact, "Franklin Gothic Medium", sans-serif';

function fitTitleSize(ctx, text, maxWidth, startSize) {
  let size = startSize;
  ctx.font = `900 ${size}px ${TITLE_FONT}`;
  while (size > 14 && ctx.measureText(text).width > maxWidth) {
    size = Math.max(14, size - 2);
    ctx.font = `900 ${size}px ${TITLE_FONT}`;
  }
  return size;
}

function titleFill(ctx, style, x, y, width, height) {
  if (style.kind === 'gradient') {
    const grad = ctx.createLinearGradient(x, y, x + width * 0.15, y + height);
    style.stops.forEach((color, i) => grad.addColorStop(i / (style.stops.length - 1), color));
    return grad;
  }
  return style.fill;
}

function drawTitleBlock(ctx, width, height, state, grade) {
  const title = (state.title ?? '').trim().toUpperCase();
  const subtitle = (state.subtitle ?? '').trim();
  const style = TITLE_STYLES[state.titleStyle] ?? TITLE_STYLES.white;
  const atTop = state.titlePos === 'top';
  const bandH = height * (title ? 0.20 : 0.10);
  const bandY = atTop ? 0 : height - bandH;
  // Legibility scrim behind the lettering.
  const scrim = ctx.createLinearGradient(0, bandY, 0, bandY + bandH);
  if (atTop) {
    scrim.addColorStop(0, 'rgba(8, 2, 18, 0.62)');
    scrim.addColorStop(1, 'rgba(8, 2, 18, 0)');
  } else {
    scrim.addColorStop(0, 'rgba(8, 2, 18, 0)');
    scrim.addColorStop(1, 'rgba(8, 2, 18, 0.66)');
  }
  ctx.fillStyle = scrim;
  ctx.fillRect(0, bandY, width, bandH);

  if (!title && !subtitle) return;
  const cx = width / 2;
  const baseline = atTop ? bandY + bandH * 0.62 : height - height * 0.045;
  const subY = atTop ? baseline + height * 0.055 : baseline - height * 0.115;

  ctx.save();
  // Shear the lettering about the title baseline, so the slant stays centred
  // instead of shoving the whole line sideways (a shear about y=0 would push
  // a bottom title left by a tenth of the cover height).
  ctx.translate(cx, baseline);
  ctx.transform(1, 0, -0.10, 1, 0, 0);
  ctx.translate(-cx, -baseline);
  if (title) {
    const size = fitTitleSize(ctx, title, width * 0.92, Math.round(height * 0.105));
    ctx.font = `900 ${size}px ${TITLE_FONT}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    ctx.lineJoin = 'round';
    ctx.miterLimit = 2;
    if (style.glow) {
      ctx.shadowColor = style.glow;
      ctx.shadowBlur = size * 0.28;
    } else {
      ctx.shadowColor = 'rgba(0, 0, 0, 0.55)';
      ctx.shadowBlur = size * 0.10;
      ctx.shadowOffsetY = size * 0.045;
    }
    ctx.lineWidth = size * 0.085;
    ctx.strokeStyle = style.stroke;
    ctx.strokeText(title, cx, baseline);
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;
    ctx.fillStyle = titleFill(ctx, style, cx - width * 0.46, baseline - size, width * 0.92, size * 1.15);
    ctx.fillText(title, cx, baseline);
  }
  if (subtitle) {
    const subSize = Math.max(14, Math.round(height * 0.028));
    ctx.font = `italic 700 ${subSize}px Georgia, "Times New Roman", serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    try { ctx.letterSpacing = `${Math.round(subSize * 0.18)}px`; } catch { /* older canvas */ }
    ctx.lineWidth = subSize * 0.14;
    ctx.strokeStyle = 'rgba(10, 4, 20, 0.85)';
    ctx.lineJoin = 'round';
    ctx.strokeText(subtitle, cx, subY);
    ctx.fillStyle = grade.accent === '#ffffff' ? '#ffffff' : '#ffe9f6';
    ctx.fillText(subtitle, cx, subY);
    try { ctx.letterSpacing = '0px'; } catch { /* older canvas */ }
  }
  ctx.restore();
}

function drawBadge(ctx, width, height, grade) {
  const label = '★ VICE COAST';
  const size = Math.max(13, Math.round(height * 0.016));
  ctx.save();
  ctx.font = `800 ${size}px system-ui, sans-serif`;
  const padX = size * 0.9;
  const textW = ctx.measureText(label).width;
  const bw = textW + padX * 2;
  const bh = size * 2.1;
  // Pill tucked just inside the top-left corner, tilted like a sticker.
  const left = width * 0.03;
  const top = height * 0.03;
  ctx.translate(left + bw / 2, top + bh / 2);
  ctx.rotate(-0.05);
  ctx.fillStyle = 'rgba(10, 4, 20, 0.82)';
  ctx.beginPath();
  ctx.roundRect(-bw / 2, -bh / 2, bw, bh, bh / 2);
  ctx.fill();
  ctx.strokeStyle = grade.accent;
  ctx.lineWidth = Math.max(1.5, size * 0.09);
  ctx.stroke();
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, 0, 1);
  ctx.restore();
}

/**
 * Draws a complete cover onto `ctx` at `width` x `height`.
 * `state`: { layout, grade, title, subtitle, titleStyle, titlePos, panels: [{photoId, zoom, ox, oy}] }
 * `photos`: a Map from photo id to a loaded HTMLImageElement.
 */
export function renderCover(ctx, width, height, state, photos) {
  const grade = gradeFor(state.grade);
  ctx.clearRect(0, 0, width, height);
  drawSky(ctx, width, height, grade);
  const panels = panelsFor(state.layout, width, height);
  panels.forEach((rect, i) => {
    const placement = state.panels?.[i];
    const img = placement?.photoId ? photos.get(placement.photoId) ?? null : null;
    drawPanel(ctx, img, rect, placement, grade);
  });
  drawGrain(ctx, width, height);
  drawVignette(ctx, width, height);
  drawBadge(ctx, width, height, grade);
  drawTitleBlock(ctx, width, height, state, grade);
}

/** Renders a cover onto a fresh canvas of the export size and returns it. */
export function renderExportCanvas(sizeId, state, photos) {
  const size = EXPORT_SIZES[sizeId] ?? EXPORT_SIZES.square;
  const canvas = document.createElement('canvas');
  canvas.width = size.width;
  canvas.height = size.height;
  renderCover(canvas.getContext('2d'), size.width, size.height, state, photos);
  return canvas;
}
