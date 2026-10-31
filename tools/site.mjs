#!/usr/bin/env node
// Arma el sitio estático para moki.jorgesuarez.com.mx/pixel/ en site-build/pixel/
import { cpSync, mkdirSync, rmSync, writeFileSync, existsSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { createCanvas, ImageData } from '@napi-rs/canvas';
import { renderPose } from '../src/core/render.js';
import { sampleClip } from '../src/anim/sample.js';
import { CLIPS } from '../src/anim/clips.js';

const OUT = 'site-build/pixel';
rmSync('site-build', { recursive: true, force: true });
mkdirSync(OUT, { recursive: true });
for (const f of ['index.html', 'site.js', 'site.css']) cpSync(`site/${f}`, `${OUT}/${f}`);
mkdirSync(`${OUT}/fonts`, { recursive: true });
for (const f of ['Outfit-Bold.woff2', 'Inter-Regular.woff2', 'Outfit-OFL.txt', 'Inter-OFL.txt']) cpSync(`assets/fonts/${f}`, `${OUT}/fonts/${f}`);

// favicon: Moki 32 px de frente
{
  const f = renderPose(sampleClip(CLIPS.idle, 0, 0), { size: 32 });
  const c = createCanvas(64, 64); const g = c.getContext('2d'); g.imageSmoothingEnabled = false;
  const t = createCanvas(32, 32); t.getContext('2d').putImageData(new ImageData(f.data, 32, 32), 0, 0);
  g.drawImage(t, 0, -2, 64, 64);
  writeFileSync(`${OUT}/favicon.png`, c.toBuffer('image/png'));
}
// og.png 1200x630
execSync(`node tools/scene.mjs scenes/og.json --still 2.2 --out ${OUT}/og.png`, { stdio: 'inherit' });

// dist completo (sin el zip anterior) + zip del kit
cpSync('dist', `${OUT}/dist`, { recursive: true, filter: (s) => !s.endsWith('.zip') });
execSync(`rm -f ${OUT}/dist/moki-pixel-kit.zip && zip -qr ${process.cwd()}/${OUT}/dist/moki-pixel-kit.zip dist docs README.md LICENSE LICENSE-ART.md -x 'dist/*.zip'`, { stdio: 'inherit' });
writeFileSync(`${OUT}/_headers`, `/pixel/*\n  X-Content-Type-Options: nosniff\n  Referrer-Policy: strict-origin-when-cross-origin\n/pixel/dist/*\n  Access-Control-Allow-Origin: *\n  Cache-Control: public, max-age=3600\n`);
cpSync(`${OUT}/_headers`, 'site-build/_headers');
rmSync(`${OUT}/_headers`);
console.log('Sitio →', OUT, existsSync(`${OUT}/dist/moki-pixel-kit.zip`) ? '(con kit ZIP)' : '');
