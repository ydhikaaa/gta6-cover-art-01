// Fixed scenes for screenshots: ?shot=cover shows the cover alone, full-bleed,
// ?shot=editor shows the editor with a sample photo loaded. Query knobs:
// layout, grade, photo (pier | boulevard | both), caption, subtitle,
// titleStyle, titlePos, size. window.__shotReady is set once painted.
import { panelsFor } from './layouts.js';

export async function runShot(query, app) {
  const { state, photos, addSample, fillAllPanels, redraw, setSize } = app;
  const shot = query.get('shot');
  if (shot === 'cover') document.body.classList.add('shot-cover');
  if (query.get('layout')) state.layout = query.get('layout');
  if (query.get('grade')) state.grade = query.get('grade');
  if (query.get('caption') !== null) state.title = query.get('caption');
  if (query.get('subtitle') !== null) state.subtitle = query.get('subtitle');
  if (query.get('titleStyle')) state.titleStyle = query.get('titleStyle');
  if (query.get('titlePos')) state.titlePos = query.get('titlePos');
  if (query.get('size')) setSize(query.get('size'));
  document.getElementById('title-input').value = state.title;
  document.getElementById('subtitle-input').value = state.subtitle;

  const choice = query.get('photo') ?? 'both';
  // Resize the panel list to this layout BEFORE assigning photos: the list
  // still holds the previous layout's count until the next redraw.
  const n = panelsFor(state.layout, 100, 100).length;
  while (state.panels.length < n) state.panels.push({ photoId: null, zoom: 1, ox: 0, oy: 0 });
  state.panels.length = n;
  if (choice === 'both') {
    const pier = await addSample({ id: 'sample-pier', src: 'samples/pier.jpg' });
    const blvd = await addSample({ id: 'sample-boulevard', src: 'samples/boulevard.jpg' });
    // Pier leads the hero panel, boulevard fills the rest — two photos, one cover.
    for (let i = 0; i < n; i += 1) state.panels[i].photoId = i === 0 ? pier : blvd;
    if (state.layout === 'tilt') {
      state.panels[2].photoId = pier;
      // Keep faces in frame in the tilted collage: nudge each photo down.
      state.panels[0].oy = 0.15;
      state.panels[1].oy = 0.30;
      state.panels[2].oy = 0.65;
    }
  } else {
    const id = await addSample({ id: `sample-${choice}`, src: `samples/${choice}.jpg` });
    fillAllPanels(id);
  }
  // A touch of craft for the stills: hero panel slightly zoomed, title low.
  if (state.panels[0] && state.layout !== 'tilt') { state.panels[0].zoom = 1.12; state.panels[0].oy = -0.08; }
  redraw();
  requestAnimationFrame(() => requestAnimationFrame(() => { window.__shotReady = true; }));
}
