#!/usr/bin/env node
// Wallpapers pixel art de Moki en tamaños de escritorio y celular. Uso: node tools/wallpapers.mjs
import { writeFileSync, mkdirSync } from 'node:fs';
import { loadAtlas, frameAt, drawMoki, drawEmote, drawFx, drawBackground, createCanvas } from './lib/compose.mjs';

const TARGETS = [
  { id: 'escritorio-1080p', W: 1920, H: 1080, k: 6 },
  { id: 'escritorio-1440p', W: 2560, H: 1440, k: 8 },
  { id: 'escritorio-4k', W: 3840, H: 2160, k: 12 },
  { id: 'ultrawide-3440', W: 3440, H: 1440, k: 8 },
  { id: 'celular-iphone', W: 1170, H: 2532, k: 6 },
  { id: 'celular-android', W: 1080, H: 2400, k: 6 },
];
const SCENES = [
  { id: 'cosmos', bg: 'noche', clip: 'sit', t: 0.4, facing: 'right', x: 0.32, emote: null },
  { id: 'taller', bg: 'taller', clip: 'building', t: 0.5, facing: 'right', x: 0.4, fx: 'spark' },
  { id: 'juega', bg: 'papel', clip: 'play', t: 0.2, facing: 'right', x: 0.42, emote: 'heart' },
  { id: 'hola', bg: 'noche', clip: 'wave', t: 0.55, facing: 'front', x: 0.5, emote: null, seed: 21 },
];

const out = 'dist/wallpapers';
mkdirSync(out, { recursive: true });
for (const sc of SCENES) {
  const atlas = await loadAtlas(64, sc.facing);
  for (const tg of TARGETS) {
    const w = Math.ceil(tg.W / tg.k), h = Math.ceil(tg.H / tg.k);
    const portrait = h > w;
    const groundY = portrait ? Math.round(h * 0.78) : h - Math.round(h * 0.16);
    const base = createCanvas(w, h);
    const g = base.getContext('2d');
    g.imageSmoothingEnabled = false;
    drawBackground(g, w, h, sc.bg, groundY, sc.seed || 11);
    const x = Math.round(w * (portrait ? 0.5 : sc.x));
    const fr = frameAt(atlas, sc.clip, sc.t);
    const { headTop } = drawMoki(g, atlas, fr, x, groundY);
    if (sc.emote) drawEmote(g, sc.emote, 2, headTop, 1);
    if (sc.fx === 'spark') drawFx(g, 'spark', 1, x + 15, groundY - 8, 1);
    const big = createCanvas(tg.W, tg.H);
    const bg = big.getContext('2d');
    bg.imageSmoothingEnabled = false;
    bg.drawImage(base, 0, 0, w * tg.k, h * tg.k);
    writeFileSync(`${out}/moki-${sc.id}-${tg.id}-${tg.W}x${tg.H}.png`, big.toBuffer('image/png'));
  }
  console.log('  ✓', sc.id);
}
console.log('Wallpapers →', out);
