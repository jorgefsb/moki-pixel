// Genera íconos de la app y de la bandeja desde el render de Moki
import { writeFileSync } from 'node:fs';
import { createCanvas, ImageData } from '@napi-rs/canvas';
import { renderPose } from '../../src/core/render.js';
import { sampleClip } from '../../src/anim/sample.js';
import { CLIPS } from '../../src/anim/clips.js';
const draw = (size, out, px, tight = true, mono = false) => {
  const f = renderPose(sampleClip(CLIPS.idle, 0, 30), { size });
  const t = createCanvas(size, size); t.getContext('2d').putImageData(new ImageData(f.data, size, size), 0, 0);
  const c = createCanvas(px, px); const g = c.getContext('2d'); g.imageSmoothingEnabled = false;
  if (!tight) { g.fillStyle = '#0A0A0A'; g.beginPath(); g.roundRect(0, 0, px, px, px * 0.22); g.fill(); }
  const k = Math.floor((px * (tight ? 1.25 : 0.95)) / size);
  const dw = size * k;
  g.drawImage(t, (px - dw) / 2, (px - dw) / 2 + (tight ? px * 0.06 : px * 0.04), dw, dw);
  if (mono) { const d = g.getImageData(0, 0, px, px); for (let i = 0; i < d.data.length; i += 4) { d.data[i] = d.data[i + 1] = d.data[i + 2] = 0; } g.putImageData(d, 0, 0); }
  writeFileSync(out, c.toBuffer('image/png'));
};
draw(128, new URL('../build/icon.png', import.meta.url).pathname, 1024, false);
draw(32, new URL('../build/tray.png', import.meta.url).pathname, 32, true);
draw(32, new URL('../build/trayTemplate.png', import.meta.url).pathname, 32, true, true);
draw(32, new URL('../build/trayTemplate@2x.png', import.meta.url).pathname, 64, true, true);
console.log('Íconos listos en desktop/build');
