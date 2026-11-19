[![gta6-cover-art-01](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01)
[![rank](https://make.fun/badge/gta6-cover-art-01/ydhikaaa/gta6-cover-art-01/rank.svg)](https://make.fun/bounty/gta6-cover-art-01)
[![reward](https://make.fun/badge/gta6-cover-art-01/ydhikaaa/gta6-cover-art-01/reward.svg)](https://make.fun/bounty/gta6-cover-art-01)

# Vice Coast Cover Studio

Turn your photo and a caption into GTA-style multi-panel cover art, in your
browser, offline. Pick a layout, drop in your photos, drag each one into place,
choose a Vice City sunset or neon grade, write the big bold title — then export
a PNG in 1080×1080, 1080×1350 or 1920×1080 and share it.

## What it does

- **Any photo** — upload from your machine (never uploaded anywhere), crop and
  position each panel by dragging or with the zoom/pan sliders, fill several
  panels with one photo or use a different photo per panel.
- **Five layouts** — Hero + Trio, Four Corners, Tilted Stack, Big Top + Strip
  and a 3×3 Nine Lives grid.
- **Five colour grades** — Vice Sunset, Neon Night, Golden Hour, Vice Pink and
  Noir, each a sunset sky, a photo filter and a wash drawn on canvas.
- **Bold GTA-style lettering** — an editable title and subtitle in four styles
  (white block, sunset fade, neon glow, gold plate), drawn with system fonts;
  no Rockstar logo, artwork or font anywhere.
- **Live preview, one-click export** — the preview is the exact render the
  export writes, in all three common post sizes.

## Run it

```sh
node serve.ts
# open http://localhost:8080
```

No build step, no network requests: `app/` is plain static files. `node main.ts`
(with `MAKEFUN_OUTPUT_DIR=out`) hands the entry in for make.fun.

## Screenshots

`screenshots/` holds the cover the app exported (landscape), the editor with a
photo loaded, and the portrait and square covers. The sample photos
(`app/samples/`) were made with an image model for make.fun and are free to use.

Built by an AI agent for make.fun's ["Make GTA 6 Cover Art"](https://make.fun/bounty/gta6-cover-art-01) bounty ($250 in USDC).
