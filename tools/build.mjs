#!/usr/bin/env node
// Construye todo el kit: atlas, tiras, Godot, GIFs, FX, manifiesto.
// Uso: node tools/build.mjs [--sizes 32,64,128] [--facings right,left,front,back]
import { Worker } from 'node:worker_threads';
import { mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import { cpus } from 'node:os';
import { createCanvas, ImageData } from '@napi-rs/canvas';
import { CLIPS, GROUPS, FACINGS } from '../src/anim/clips.js';
import { emoteFrame, dustFrame, sparkFrame, confettiFrame, shadow, EMOTES, EMOTE_LABELS } from '../src/core/fx.js';
import { RAMPS, BASE, OUTLINE } from '../src/core/palette.js';
import { SIZES } from '../src/core/render.js';
import { EXPORT_FPS } from './lib/frames.mjs';

const arg = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : d; };
const sizes = arg('--sizes', '32,64,128').split(',').map(Number);
const facings = arg('--facings', 'right,left,front,back').split(',');
const OUT = arg('--out', 'dist');
const version = JSON.parse(readFileSync('package.json', 'utf8')).version;
mkdirSync(OUT, { recursive: true });

const jobs = [];
for (const size of sizes.sort((a, b) => b - a)) for (const facing of facings) jobs.push({ size, facing });
const t0 = Date.now();
const results = [];
await new Promise((resolve, reject) => {
  let next = 0, running = 0;
  const launch = () => {
    if (next >= jobs.length && running === 0) return resolve();
    while (running < Math.max(1, cpus().length) && next < jobs.length) {
      const job = jobs[next++];
      running++;
      const w = new Worker(new URL('./lib/atlas-job.mjs', import.meta.url), { workerData: { ...job, out: OUT, version } });
      w.on('message', (m) => { results.push(m); console.log(`  ✓ ${m.size}px ${m.facing}: ${m.clips} clips, ${m.frames} cuadros`); });
      w.on('error', reject);
      w.on('exit', () => { running--; launch(); });
    }
  };
  launch();
});

// ---------- FX: emotes y partículas ----------
mkdirSync(`${OUT}/fx`, { recursive: true });
for (const scale of [1, 2]) {
  const tag = scale === 1 ? 64 : 128;
  // Emotes: una fila por emote, 4 cuadros (punto, abre, lleno, rebote)
  const cells = EMOTES.map((n) => [0, 1, 2, 3].map((s) => emoteFrame(n, s, scale)));
  const cw = Math.max(...cells.flat().map((c) => c.w)), ch = Math.max(...cells.flat().map((c) => c.h));
  const cv = createCanvas(cw * 4, ch * EMOTES.length);
  const g = cv.getContext('2d');
  const meta = { frameSize: { w: cw, h: ch }, anchor: 'esquina inferior izquierda = punta de la cola; colócala en head_top + (3, 2)', emotes: {} };
  cells.forEach((row, r) => {
    row.forEach((c, k) => g.putImageData(new ImageData(c.data, c.w, c.h), k * cw, r * ch + (ch - c.h)));
    meta.emotes[EMOTES[r]] = { row: r, frames: 4, label: EMOTE_LABELS[EMOTES[r]], durations: [60, 60, 900, 300] };
  });
  writeFileSync(`${OUT}/fx/emotes-${tag}.png`, cv.toBuffer('image/png'));
  writeFileSync(`${OUT}/fx/emotes-${tag}.json`, JSON.stringify(meta, null, 1));
  // Partículas
  const parts = { dust: [0, 1, 2, 3].map((i) => dustFrame(i, scale)), spark: [0, 1, 2].map((i) => sparkFrame(i, scale)),
    confetti: [0, 1, 2, 3, 4].map((i) => confettiFrame(i, scale)), shadow: [shadow(scale === 1 ? 26 : 52)] };
  const pw = Math.max(...Object.values(parts).flat().map((c) => c.w)) , ph = Math.max(...Object.values(parts).flat().map((c) => c.h));
  const pc = createCanvas(pw * 5, ph * 4);
  const pg = pc.getContext('2d');
  const pmeta = { cell: { w: pw, h: ph }, rows: {} };
  Object.entries(parts).forEach(([k, arr], r) => {
    arr.forEach((c, i) => pg.putImageData(new ImageData(c.data, c.w, c.h), i * pw, r * ph));
    pmeta.rows[k] = { row: r, frames: arr.length, w: arr[0].w, h: arr[0].h };
  });
  writeFileSync(`${OUT}/fx/particles-${tag}.png`, pc.toBuffer('image/png'));
  writeFileSync(`${OUT}/fx/particles-${tag}.json`, JSON.stringify(pmeta, null, 1));
}

// ---------- Manifiesto ----------
const manifest = {
  name: 'Moki Pixel', version, generated: new Date().toISOString(),
  status: 'propuesto (adaptación pixel art del diseño aprobado el 12-oct-2026; pendiente de aprobación de Jorge)',
  fps: EXPORT_FPS, sizes: sizes.map((s) => ({ size: s, unitsPerPx: 1 / SIZES[s].s, groundY: SIZES[s].ground })),
  facings: Object.fromEntries(facings.map((f) => [f, { yaw: FACINGS[f] }])),
  groups: GROUPS,
  clips: Object.fromEntries(Object.entries(CLIPS).map(([k, c]) => [k, {
    group: c.group, duration: c.dur, loop: !!c.loop, facings: c.facings, note: c.note, principles: c.principles,
    events: c.events || [], emote: c.emote || null, speed_u_per_s: c.speed || 0,
  }])),
  emotes: EMOTE_LABELS,
  palette: { base: BASE, ramps: RAMPS, outline: OUTLINE },
  atlases: results.sort((a, b) => a.size - b.size || a.facing.localeCompare(b.facing)),
  signature: 'Hecho con amor ❤️🎮 por JorgeSuarez.com.mx para explorar y jugar con IA y videojuegos.',
};
writeFileSync(`${OUT}/manifest.json`, JSON.stringify(manifest, null, 1));
console.log(`Listo en ${((Date.now() - t0) / 1000).toFixed(1)} s → ${OUT}/`);
