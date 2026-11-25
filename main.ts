// Sizzle Street Kitchen — hand-in program (Node 22, standard library only).
//
// The game itself is the static site in game/ (open game/index.html in a
// desktop browser; it plays fully offline). This program packages an entry:
// it copies game/ and screenshots/ into the output directory and writes
// dossier.json there with the vendored make.fun library, byte for byte the
// way the scorer rebuilds it.
//
// Run it the way the grader does:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
// MAKEFUN_OUTPUT_DIR stands in for /output outside the grader's container.

import { cpSync, existsSync, mkdirSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

// Count the files under a directory (the output cap counts entries, and a
// hand-in that quietly outgrows it should fail here, not at the gate).
function countEntries(dir: string): number {
  let n = 0;
  for (const name of readdirSync(dir)) {
    n += 1;
    if (statSync(join(dir, name)).isDirectory()) n += countEntries(join(dir, name));
  }
  return n;
}

const repoDir = fileURLToPath(new URL('.', import.meta.url));
const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// The scorer's caps for this bounty. Only text_max_bytes changes the bytes
// written; the rest make this program refuse a tree the scorer would refuse
// anyway (too many screenshots or game files, an oversize file, a path that
// is too long), so a bad hand-in fails here first instead of at the gate.
const CAPS = {
  text_max_bytes: 163_840,
  screenshots: { max: 4, max_bytes: 262_144 },
  game_max_files: 993,
  game_max_bytes: 50_331_648,
  game_path_max_bytes: 1_000,
};

mkdirSync(outDir, { recursive: true });
cpSync(join(repoDir, 'game'), join(outDir, 'game'), { recursive: true });

const shotsDir = join(repoDir, 'screenshots');
if (existsSync(shotsDir)) {
  mkdirSync(join(outDir, 'screenshots'), { recursive: true });
  cpSync(shotsDir, join(outDir, 'screenshots'), { recursive: true });
}

const dossier = buildDossier(outDir, CAPS);
writeFileSync(join(outDir, 'dossier.json'), dossier);

// A one-line receipt on stderr (stdout stays clean): what was handed in.
const entries = countEntries(outDir);
console.error(`sizzle-street-kitchen: ${entries} output entries, dossier ${dossier.byteLength} bytes`);
