// Hands in the Vice Coast Cover Studio entry (Node 22, standard library only).
// The app is plain static files under app/ — index.html plus its own ES modules,
// no library and no network request — and this program copies app/ and
// screenshots/ from beside this file into the output directory and writes
// /output/dossier.json with the vendored make.fun library, so the judge can
// read the entry. Outside the grader, MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
//
// The two runs the grader makes must write identical bytes, so this program
// copies files only and never stamps a time or a random value anywhere.

import { cpSync, existsSync, mkdirSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-app.ts';

const repoRoot = fileURLToPath(new URL('.', import.meta.url));
const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

function fail(message) {
  throw new Error(`main.ts: ${message}`);
}

function copyTree(source, target) {
  cpSync(source, target, { recursive: true });
}

function checkShots(dir) {
  // The gate allows 3 or 4 screenshots, each a whole PNG or JPEG under 256 KiB.
  const names = readdirSync(dir).filter((name) => !name.startsWith('.'));
  if (names.length < 3 || names.length > 4) fail(`screenshots/ holds ${names.length} files, need 3 or 4`);
  for (const name of names) {
    const size = statSync(join(dir, name)).size;
    if (size > 262144) fail(`screenshots/${name} is ${size} bytes, over the 256 KiB cap`);
    if (!/\.(png|jpe?g)$/i.test(name)) fail(`screenshots/${name} is not a PNG or JPEG`);
  }
}

function checkApp(dir) {
  // The gate caps app/ at 993 entries and 48 MiB in all; refuse early here so a
  // bad tree fails loudly instead of passing a broken entry to the scorer.
  let entries = 0;
  let bytes = 0;
  const walk = (path) => {
    for (const name of readdirSync(path)) {
      const full = join(path, name);
      entries += 1;
      const stats = statSync(full);
      if (stats.isDirectory()) walk(full);
      else bytes += stats.size;
    }
  };
  walk(dir);
  if (entries > 993) fail(`app/ holds ${entries} entries, over the 993 cap`);
  if (bytes > 50331648) fail(`app/ is ${bytes} bytes, over the 48 MiB cap`);
  if (!existsSync(join(dir, 'index.html'))) fail('app/index.html is missing');
}

const appDir = join(repoRoot, 'app');
const shotsDir = join(repoRoot, 'screenshots');

checkApp(appDir);
if (existsSync(shotsDir)) checkShots(shotsDir);

mkdirSync(outDir, { recursive: true });
copyTree(appDir, join(outDir, 'app'));
mkdirSync(join(outDir, 'screenshots'), { recursive: true });
if (existsSync(shotsDir)) copyTree(shotsDir, join(outDir, 'screenshots'));

// The scorer's own caps (reference/gate.json): only text_max_bytes shapes the
// bytes; the others refuse an entry the scorer would refuse.
writeFileSync(
  join(outDir, 'dossier.json'),
  buildDossier(outDir, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    app_max_files: 993,
    app_max_bytes: 50331648,
    app_path_max_bytes: 1000,
  }),
);
