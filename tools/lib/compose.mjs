// Composición de escenas pixel art: fondos procedurales de papel, Moki desde los atlas,
// sombra, emotes y burbujas de diálogo con tipografía de marca (texto nítido y separado, canon C07).
import { createCanvas, loadImage, GlobalFonts } from '@napi-rs/canvas';
import { readFileSync, existsSync } from 'node:fs';
import { emoteFrame, shadow, dustFrame, sparkFrame, confettiFrame } from '../../src/core/fx.js';
import { RAMPS } from '../../src/core/palette.js';
import { ImageData } from '@napi-rs/canvas';

const ROOT = new URL('../../', import.meta.url).pathname;
GlobalFonts.registerFromPath(`${ROOT}assets/fonts/Outfit-static.ttf`, 'Outfit');
GlobalFonts.registerFromPath(`${ROOT}assets/fonts/Inter-static.ttf`, 'Inter');

const cache = new Map();
export async function loadAtlas(size, facing, dist = `${ROOT}dist`) {
  const key = `${size}-${facing}`;
  if (cache.has(key)) return cache.get(key);
  const json = JSON.parse(readFileSync(`${dist}/sprites/${size}/moki-${size}-${facing}.json`, 'utf8'));
  const img = await loadImage(`${dist}/sprites/${size}/moki-${size}-${facing}.png`);
  const tags = Object.fromEntries(json.meta.frameTags.map((t) => [t.name, t]));
  const a = { json, img, tags, size };
  cache.set(key, a);
  return a;
}

// Devuelve el cuadro de un clip en el tiempo t (s) respetando duraciones por cuadro.
export function frameAt(atlas, clip, t) {
  const tag = atlas.tags[clip];
  if (!tag) throw new Error(`Clip «${clip}» no existe en ${atlas.size}px`);
  const fr = [];
  let total = 0;
  for (let i = tag.from; i <= tag.to; i++) { const f = atlas.json.frames[String(i)]; fr.push(f); total += f.duration; }
  let ms = t * 1000;
  if (tag.loop) ms = ((ms % total) + total) % total; else ms = Math.min(ms, total - 1);
  let acc = 0;
  for (const f of fr) { acc += f.duration; if (ms < acc) return f; }
  return fr[fr.length - 1];
}
export function clipLength(atlas, clip) {
  const tag = atlas.tags[clip];
  let total = 0;
  for (let i = tag.from; i <= tag.to; i++) total += atlas.json.frames[String(i)].duration;
  return total / 1000;
}

function toCanvas(c) {
  const cv = createCanvas(c.w, c.h);
  cv.getContext('2d').putImageData(new ImageData(c.data, c.w, c.h), 0, 0);
  return cv;
}
const fxCache = new Map();
function fxCanvas(key, make) {
  if (!fxCache.has(key)) fxCache.set(key, toCanvas(make()));
  return fxCache.get(key);
}

// x,y = pivote (entre suelas) en pixeles de la escena
export function drawMoki(g, atlas, frame, x, y, { shadowOn = true } = {}) {
  const s = atlas.size;
  const piv = atlas.json.meta.moki.pivot;
  if (shadowOn) {
    const sw = Math.round(s * 0.42);
    const sh = fxCanvas(`sh${sw}`, () => shadow(sw));
    const k = Math.max(0.5, 1 - frame.air / (s * 1.5));
    g.globalAlpha = k;
    g.drawImage(sh, Math.round(x - sw / 2), Math.round(y - sh.height / 2));
    g.globalAlpha = 1;
  }
  g.drawImage(atlas.img, frame.frame.x, frame.frame.y, s, s, Math.round(x - piv.x), Math.round(y - piv.y - frame.air), s, s);
  return { headTop: [x - piv.x + frame.anchors.head_top[0], y - piv.y - frame.air + frame.anchors.head_top[1]] };
}

export function drawEmote(g, name, stage, at, scale = 1) {
  const e = fxCanvas(`e${name}${stage}${scale}`, () => emoteFrame(name, stage, scale));
  g.drawImage(e, Math.round(at[0] + 3 * scale), Math.round(at[1] - e.height + 2 * scale));
}
export function drawFx(g, kind, i, x, y, scale = 1) {
  const make = { dust: dustFrame, spark: sparkFrame, confetti: confettiFrame }[kind];
  const c = fxCanvas(`${kind}${i}${scale}`, () => make(i, scale));
  g.drawImage(c, Math.round(x - c.width / 2), Math.round(y - c.height / 2));
}

// ---------- Fondos (pixel nativo) ----------
const P = RAMPS;
function rnd(seed) {
  let s = seed >>> 0;
  return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
}
export function drawBackground(g, W, H, kind = 'noche', groundY = H - 20, seed = 7) {
  if (kind === 'transparente') return;
  const r = rnd(seed);
  if (kind === 'noche' || kind === 'cosmos') {
    g.fillStyle = '#0A0A0A'; g.fillRect(0, 0, W, H);
    // estrellas de papel: puntos crema/ámbar, sin brillo ni glow
    for (let i = 0; i < (W * H) / 260; i++) {
      const x = Math.floor(r() * W), y = Math.floor(r() * (groundY - 6));
      const c = r();
      g.fillStyle = c < 0.7 ? '#3a3631' : c < 0.92 ? P.cream[2] : P.amber[1];
      g.fillRect(x, y, 1, 1);
      if (c > 0.985) { g.fillRect(x - 1, y, 3, 1); g.fillRect(x, y - 1, 1, 3); }
    }
    // planeta de papel recortado
    const pr = Math.round(Math.min(W, H) * 0.16), px = Math.round(W * 0.8), py = Math.round(H * 0.24);
    disc(g, px, py, pr, P.orange[2]);
    disc(g, px - 1, py - 1, pr - 1, P.orange[1]);
    for (let k = -pr; k < pr; k += 4) { g.fillStyle = P.orange[2]; g.fillRect(px - pr + 2 + ((k * 7) & 15), py + k, 3, 1); }
    ring(g, px, py, pr + 4, P.cream[2], 0.32);
  } else if (kind === 'papel') {
    g.fillStyle = P.cream[1]; g.fillRect(0, 0, W, H);
    for (let i = 0; i < (W * H) / 90; i++) {
      g.fillStyle = r() < 0.5 ? P.cream[2] : P.cream[0];
      g.fillRect(Math.floor(r() * W), Math.floor(r() * H), 1, 1);
    }
  } else if (kind === 'taller') {
    g.fillStyle = '#161616'; g.fillRect(0, 0, W, H);
    g.fillStyle = '#1f1e1c';
    for (let x = 0; x < W; x += 12) g.fillRect(x, 0, 1, groundY);
    for (let y = groundY; y > 0; y -= 12) g.fillRect(0, y, W, 1);
  } else if (/^#/.test(kind)) {
    g.fillStyle = kind; g.fillRect(0, 0, W, H);
  }
  // suelo: capas de cartón con borde cortado
  g.fillStyle = P.kraft[2]; g.fillRect(0, groundY, W, H - groundY);
  g.fillStyle = P.kraft[1]; g.fillRect(0, groundY, W, 3);
  g.fillStyle = P.cream[1]; g.fillRect(0, groundY, W, 1);
  for (let x = 0; x < W; x += 1) {
    if (r() < 0.06) { g.fillStyle = P.kraft[3]; g.fillRect(x, groundY + 4 + Math.floor(r() * (H - groundY - 4)), 1, 1); }
  }
  for (let x = 0; x < W; x += 3) if (r() < 0.25) { g.fillStyle = P.kraft[0]; g.fillRect(x, groundY + 1, 2, 1); }
}
function disc(g, cx, cy, rad, col) {
  g.fillStyle = col;
  for (let y = -rad; y <= rad; y++) {
    const w = Math.floor(Math.sqrt(rad * rad - y * y));
    g.fillRect(cx - w, cy + y, w * 2 + 1, 1);
  }
}
function ring(g, cx, cy, rad, col, flat) {
  g.fillStyle = col;
  for (let a = 0; a < Math.PI * 2; a += 0.02) {
    const x = Math.round(cx + Math.cos(a) * rad * 1.6), y = Math.round(cy + Math.sin(a) * rad * flat);
    if (Math.sin(a) > 0 || Math.abs(Math.cos(a) * rad * 1.6) > rad) g.fillRect(x, y, 1, 1);
  }
}

// Burbuja de diálogo (en resolución de salida, tipografía Outfit 700, papel/tinta como el juice)
export function drawSay(g, text, x, y, scale) {
  const fs = Math.round(7 * scale);
  g.font = `700 ${fs}px Outfit`;
  const tw = g.measureText(text).width;
  const pad = Math.round(4 * scale), h = fs + pad * 2, w = tw + pad * 2.6;
  const bx = Math.round(x + 2 * scale), by = Math.round(y - h - 5 * scale);
  g.fillStyle = 'rgba(0,0,0,.35)';
  roundRect(g, bx + scale, by + scale * 1.5, w, h, 4 * scale); g.fill();
  g.fillStyle = P.cream[1];
  roundRect(g, bx, by, w, h, 4 * scale); g.fill();
  g.beginPath(); g.moveTo(bx + 4 * scale, by + h - 1); g.lineTo(bx + 4 * scale, by + h + 4 * scale); g.lineTo(bx + 9 * scale, by + h - 1); g.fill();
  g.fillStyle = P.ink[1];
  g.textBaseline = 'middle';
  g.fillText(text, bx + pad * 1.3, by + h / 2 + scale * 0.4);
}
function roundRect(g, x, y, w, h, r) {
  g.beginPath();
  g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r);
  g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath();
}

export const FORMATS = {
  '16:9': { w: 320, h: 180, scale: 6 },
  '9:16': { w: 180, h: 320, scale: 6 },
  '1:1': { w: 270, h: 270, scale: 4 },
  '4:5': { w: 216, h: 270, scale: 5 },
};
export { createCanvas };
export const hasDist = () => existsSync(`${ROOT}dist/sprites/64/moki-64-right.json`);
