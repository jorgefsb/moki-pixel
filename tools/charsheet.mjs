#!/usr/bin/env node
// Hoja de personaje pixel art de Moki (PNG). Uso: node tools/charsheet.mjs [salida.png]
import { writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { createCanvas, ImageData, GlobalFonts } from '@napi-rs/canvas';
import { renderPose, SIZES } from '../src/core/render.js';
import { sampleClip } from '../src/anim/sample.js';
import { CLIPS, FACINGS } from '../src/anim/clips.js';
import { RAMPS, OUTLINE } from '../src/core/palette.js';
import { emoteFrame } from '../src/core/fx.js';

const ROOT = fileURLToPath(new URL('../', import.meta.url));
GlobalFonts.registerFromPath(`${ROOT}assets/fonts/Outfit-static.ttf`, 'Outfit');
GlobalFonts.registerFromPath(`${ROOT}assets/fonts/Inter-static.ttf`, 'Inter');
const out = process.argv[2] || 'dist/moki-hoja-de-personaje.png';
const version = (await import('node:fs')).readFileSync(`${ROOT}package.json`, 'utf8').match(/"version":\s*"([^"]+)"/)[1];

const W = 2400, H = 3360;
const cv = createCanvas(W, H);
const g = cv.getContext('2d');
g.imageSmoothingEnabled = false;
const PAPER = RAMPS.cream[1], INK = RAMPS.ink[1], KRAFT = RAMPS.kraft[1], ORANGE = RAMPS.orange[1];
g.fillStyle = PAPER; g.fillRect(0, 0, W, H);
// fibra de papel
for (let i = 0; i < 26000; i++) { g.fillStyle = i % 2 ? RAMPS.cream[2] : RAMPS.cream[0]; g.fillRect((i * 7919) % W, (i * 104729) % H, 2, 2); }

const toCv = (f) => { const c = createCanvas(f.w, f.h); c.getContext('2d').putImageData(new ImageData(f.data, f.w, f.h), 0, 0); return c; };
const pose = (clip, t, yaw) => { const p = sampleClip(CLIPS[clip], t, yaw); p.root[1] = Math.min(0, p.root[1]); return p; };
const text = (s, x, y, size, { font = 'Inter', weight = 400, color = INK, align = 'left' } = {}) => {
  g.font = `${weight} ${size}px ${font}`; g.fillStyle = color; g.textAlign = align; g.textBaseline = 'alphabetic'; g.fillText(s, x, y); g.textAlign = 'left';
};
const h2 = (s, y) => { text(s, 120, y, 46, { font: 'Outfit', weight: 700 }); g.fillStyle = ORANGE; g.fillRect(120, y + 16, 90, 8); };
const card = (x, y, w, h) => { g.fillStyle = 'rgba(185,145,104,.18)'; g.fillRect(x + 6, y + 8, w, h); g.fillStyle = '#FBF3E6'; g.fillRect(x, y, w, h); g.fillStyle = KRAFT; g.fillRect(x, y, w, 2); g.fillRect(x, y + h - 2, w, 2); g.fillRect(x, y, 2, h); g.fillRect(x + w - 2, y, 2, h); };

// Encabezado
text('MOKI', 120, 190, 150, { font: 'Outfit', weight: 700 });
text('Hoja de personaje · pixel art', 120, 262, 52, { font: 'Outfit', weight: 700, color: RAMPS.orange[2] });
text(`Moki Pixel v${version} · Propuesto: adaptación pixel del diseño aprobado por Jorge (12-oct-2026). Pendiente de aprobación.`, 120, 320, 26);
text('Fuente: BrandKit JorgeSuarez.com.mx 0.6 · Moki Production Brief 0.1 · decisiones posteriores 0.6', 120, 358, 26);

// Vuelta completa
h2('Vuelta completa (128 px, vistas por geometría, sin espejo)', 470);
const turns = [[0, 'Frente'], [40, '3/4 derecha'], [90, 'Perfil der. (parche)'], [140, '3/4 espalda'], [180, 'Espalda'], [-140, '3/4 esp. izq.'], [-90, 'Perfil izq.'], [-40, '3/4 izquierda']];
turns.forEach(([yaw, label], i) => {
  const x = 120 + i * 272, y = 520;
  card(x, y, 252, 330);
  const f = renderPose(pose('idle', 0, yaw), { size: 128 });
  g.drawImage(toCv(f), x - 2, y + 6, 256, 256);
  text(label, x + 126, y + 300, 24, { align: 'center', weight: 400 });
});

// Proporciones
h2('Proporciones (H = 1000 u)', 960);
card(120, 1010, 760, 900);
{
  const sc = 6, f = renderPose(pose('idle', 0, 0), { size: 128 });
  const ox = 120 + 380 + 60 - 64 * sc, oy = 1050;
  g.drawImage(toCv(f), ox, oy, 128 * sc, 128 * sc);
  const gy = oy + 122 * sc, s = 0.1 * sc;
  [[1000, 'corona'], [535, 'base del casco'], [335, 'cintura'], [265, 'entrepierna'], [175, 'rodilla'], [95, 'bota'], [0, 'suelo']].forEach(([u, lab]) => {
    const y = Math.round(gy - u * s);
    g.fillStyle = RAMPS.orange[2]; for (let x = 140; x < 860; x += 14) g.fillRect(x, y, 8, 2);
    text(`${u} u · ${lab}`, 146, y - 8, 20, { color: RAMPS.orange[3] });
  });
}
// Tamaños oficiales
card(920, 1010, 1360, 420);
text('Tamaños oficiales (escala entera, vecino más cercano)', 950, 1060, 30, { font: 'Outfit', weight: 700 });
[[32, 8], [64, 4], [128, 2]].forEach(([sz, k], i) => {
  const f = renderPose(pose('idle', 0, 40), { size: sz });
  const x = 960 + i * 440, y = 1110;
  g.drawImage(toCv(f), x, y, sz * k, sz * k);
  text(`${sz} px × ${k} · detalle ${SIZES[sz].detail}`, x, 1400, 24, { weight: 400 });
});


// Paleta
card(920, 1470, 1360, 440);
text('Paleta y rampas (luz → profunda)', 950, 1520, 30, { font: 'Outfit', weight: 700 });
const roles = [['orange', 'Traje y franja'], ['cream', 'Casco, puños, suelas'], ['charcoal', 'Guantes y botas'], ['visor', 'Visor'], ['petrol', 'Arnés'], ['kraft', 'Bordes y fibra']];
roles.forEach(([k, lab], r) => {
  const y = 1550 + r * 58;
  RAMPS[k].forEach((hex, i) => { g.fillStyle = hex; g.fillRect(950 + i * 64, y, 58, 46); });
  text(`${lab}  ·  ${RAMPS[k].join('  ')}`, 1220, y + 32, 22);
});
g.fillStyle = OUTLINE; g.fillRect(950, 1900 - 4, 58, 4);

// Lateralidad
h2('Lateralidad: el parche vive en la oreja derecha anatómica', 2010);
card(120, 2060, 1060, 470);
card(1220, 2060, 1060, 470);
{
  const f = toCv(renderPose(pose('idle', 0, 40), { size: 128 }));
  g.drawImage(f, 150, 2070, 384, 384);
  text('Sí: geometría', 560, 2160, 40, { font: 'Outfit', weight: 700, color: '#2F6E5C' });
  text('Mirando a la derecha vemos su lado', 560, 2210, 24);
  text('derecho: orejera + parche MOKI.', 560, 2244, 24);
  text('Mirando a la izquierda se ve la orejera', 560, 2296, 24);
  text('sin parche. Cada vista sale del modelo.', 560, 2330, 24);
  g.save(); g.translate(1250 + 384, 2070); g.scale(-1, 1); g.drawImage(f, 0, 0, 384, 384); g.restore();
  g.strokeStyle = '#B23A2A'; g.lineWidth = 10; g.beginPath(); g.moveTo(1270, 2090); g.lineTo(1610, 2430); g.moveTo(1610, 2090); g.lineTo(1270, 2430); g.stroke();
  text('No: espejar', 1660, 2160, 40, { font: 'Outfit', weight: 700, color: '#B23A2A' });
  text('El parche saltaría a la oreja izquierda', 1660, 2210, 24);
  text('y el texto MOKI se invertiría.', 1660, 2244, 24);
  text('Nunca usar flipX / scaleX(-1).', 1660, 2296, 24);
}

// Expresiones con el cuerpo
h2('Expresión sin rostro: postura, gesto y ritmo (C06)', 2630);
const ex = [['curious', 0.6, 'Curiosidad', 'question'], ['decision', 0.5, 'Decisión', null], ['doubt', 0.7, 'Duda', 'question'], ['celebrate', 1.05, 'Logro', 'star'], ['frustrated', 1.0, 'Frustración', 'scribble'], ['sleep', 0.4, 'Descanso', 'zz']];
ex.forEach(([clip, t, lab, em], i) => {
  const x = 120 + i * 362, y = 2680;
  card(x, y, 340, 420);
  const r = renderPose(pose(clip, t, 40), { size: 128 });
  g.drawImage(toCv(r), x + 2, y + 50, 336, 336);
  if (em) { const e = emoteFrame(em, 2, 2); const c = toCv(e); const [hx, hy] = r.anchors.head_top; g.drawImage(c, x + 2 + (hx + 4) * 2.625, y + 50 + (hy - e.h / 2 - 2) * 2.625, c.width * 1.3, c.height * 1.3); }
  text(lab, x + 170, y + 404, 28, { font: 'Outfit', weight: 700, align: 'center' });
});

// Pie
g.fillStyle = INK; g.fillRect(0, H - 120, W, 120);
text('Hecho con amor', 120, H - 52, 30, { color: PAPER });
{ g.font = '400 30px Inter'; let x = 120 + g.measureText('Hecho con amor ').width;
  const hh = toCv(emoteFrame('heart', 2, 2)); g.drawImage(hh, 8, 6, 18, 18, x, H - 78, 30, 30);
  x += 40; text('por JorgeSuarez.com.mx para explorar y jugar con IA y videojuegos.', x, H - 52, 30, { color: PAPER }); }
text('moki.jorgesuarez.com.mx/pixel · github.com/jorgefsb/moki-pixel', W - 120, H - 52, 26, { color: RAMPS.cream[2], align: 'right' });

mkdirSync(out.split('/').slice(0, -1).join('/') || '.', { recursive: true });
writeFileSync(out, cv.toBuffer('image/png'));
console.log('Hoja →', out);
