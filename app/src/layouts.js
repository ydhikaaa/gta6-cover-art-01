// Panel geometry for Vice Coast Cover Studio: each layout is a function of the
// cover size (W, H) that returns the panels of the poster, in draw order.
// A panel is { x, y, w, h, rot } in pixels, rot in degrees around its centre.
// Every layout leaves a thin gap between panels so the sunset sky behind them
// shows through like the white gutters of a printed poster.

function gapFor(width) {
  return Math.max(6, Math.round(width * 0.014));
}

function heroTrio(width, height) {
  const g = gapFor(width);
  const split = Math.round(width * 0.6);
  const rightX = split + g;
  const rightW = width - rightX - g;
  const third = Math.floor((height - 2 * g - 2 * g) / 3);
  return [
    { x: g, y: g, w: split - 2 * g, h: height - 2 * g, rot: 0 },
    { x: rightX, y: g, w: rightW, h: third, rot: 0 },
    { x: rightX, y: g + third + g, w: rightW, h: third, rot: 0 },
    { x: rightX, y: g + 2 * (third + g), w: rightW, h: height - g - (g + 2 * (third + g)), rot: 0 },
  ];
}

function quadGrid(width, height) {
  const g = gapFor(width);
  const halfW = Math.floor((width - 3 * g) / 2);
  const halfH = Math.floor((height - 3 * g) / 2);
  return [
    { x: g, y: g, w: halfW, h: halfH, rot: 0 },
    { x: g + halfW + g, y: g, w: halfW, h: halfH, rot: 0 },
    { x: g, y: g + halfH + g, w: halfW, h: halfH, rot: 0 },
    { x: g + halfW + g, y: g + halfH + g, w: halfW, h: halfH, rot: 0 },
  ];
}

function tiltedTrio(width, height) {
  // The loading-screen collage: three snapshots thrown down at angles, edges
  // overlapping, each with a white frame. Rotations stay small so no panel
  // leaves the cover.
  const g = gapFor(width);
  return [
    { x: g, y: g, w: Math.round(width * 0.56), h: Math.round(height * 0.62), rot: -4 },
    { x: Math.round(width * 0.48), y: Math.round(height * 0.08), w: Math.round(width * 0.46), h: Math.round(height * 0.52), rot: 3.5 },
    { x: Math.round(width * 0.22), y: Math.round(height * 0.52), w: Math.round(width * 0.62), h: Math.round(height * 0.42), rot: -2 },
  ];
}

function stripLayout(width, height) {
  const g = gapFor(width);
  const topH = Math.round((height - 3 * g) * 0.62);
  const stripY = g + topH + g;
  const stripH = height - stripY - g;
  const third = Math.floor((width - 4 * g) / 3);
  return [
    { x: g, y: g, w: width - 2 * g, h: topH, rot: 0 },
    { x: g, y: stripY, w: third, h: stripH, rot: 0 },
    { x: g + third + g, y: stripY, w: third, h: stripH, rot: 0 },
    { x: g + 2 * (third + g), y: stripY, w: width - g - (g + 2 * (third + g)), h: stripH, rot: 0 },
  ];
}

function nineGrid(width, height) {
  const g = gapFor(width);
  const cellW = Math.floor((width - 4 * g) / 3);
  const cellH = Math.floor((height - 4 * g) / 3);
  const panels = [];
  for (let row = 0; row < 3; row += 1) {
    for (let col = 0; col < 3; col += 1) {
      panels.push({ x: g + col * (cellW + g), y: g + row * (cellH + g), w: cellW, h: cellH, rot: 0 });
    }
  }
  return panels;
}

export const LAYOUTS = {
  hero: { id: 'hero', name: 'Hero + Trio', hint: 'One big moment, three small ones', build: heroTrio },
  quad: { id: 'quad', name: 'Four Corners', hint: 'A clean 2 x 2 grid', build: quadGrid },
  tilt: { id: 'tilt', name: 'Tilted Stack', hint: 'Snapshots thrown on the table', build: tiltedTrio },
  strip: { id: 'strip', name: 'Big Top + Strip', hint: 'A wide hero over three frames', build: stripLayout },
  nine: { id: 'nine', name: 'Nine Lives', hint: 'A 3 x 3 comic grid', build: nineGrid },
};

export const LAYOUT_ORDER = ['hero', 'quad', 'tilt', 'strip', 'nine'];

/** Panels for a layout id at a cover size; falls back to the hero layout. */
export function panelsFor(layoutId, width, height) {
  const layout = LAYOUTS[layoutId] ?? LAYOUTS.hero;
  return layout.build(width, height);
}
