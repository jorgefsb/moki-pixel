#!/usr/bin/env node
// Arma el sitio estático para moki.jorgesuarez.com.mx/pixel/ en site-build/pixel/
import { cpSync, mkdirSync, rmSync, writeFileSync, existsSync, readFileSync } from 'node:fs';
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
writeFileSync(`${OUT}/_headers`, `/pixel/*\n  X-Content-Type-Options: nosniff\n  Referrer-Policy: strict-origin-when-cross-origin\n/pixel/dist/*\n  Access-Control-Allow-Origin: *\n  Cache-Control: public, max-age=3600\n/hd/*\n  X-Content-Type-Options: nosniff\n  Referrer-Policy: strict-origin-when-cross-origin\n/hd/dist/*\n  Access-Control-Allow-Origin: *\n  Cache-Control: public, max-age=3600\n`);
cpSync(`${OUT}/_headers`, 'site-build/_headers');
rmSync(`${OUT}/_headers`);
console.log('Sitio →', OUT, existsSync(`${OUT}/dist/moki-pixel-kit.zip`) ? '(con kit ZIP)' : '');

// ---------------- Moki HD: moki.jorgesuarez.com.mx/hd/ ----------------
if (existsSync('dist-hd/manifest.json')) {
  const HD = 'site-build/hd';
  mkdirSync(HD, { recursive: true });
  for (const f of ['index.html', 'hd.js', 'hd.css']) cpSync(`site-hd/${f}`, `${HD}/${f}`);
  mkdirSync(`${HD}/fonts`, { recursive: true });
  for (const f of ['Outfit-Bold.woff2', 'Inter-Regular.woff2', 'Outfit-OFL.txt', 'Inter-OFL.txt']) cpSync(`assets/fonts/${f}`, `${HD}/fonts/${f}`);
  cpSync('dist-hd', `${HD}/dist`, { recursive: true });
  const { GROUPS } = await import('../src/anim/clips.js');
  const man = JSON.parse(readFileSync('dist-hd/manifest.json', 'utf8'));
  const NAMES = {
    idle: ['Respira', 'Idle'], idle_look: ['Mira alrededor', 'Look around'], walk: ['Camina', 'Walk'], run: ['Corre', 'Run'],
    jump: ['Salta', 'Jump'], jump_rise: ['Sube', 'Jump rise'], jump_fall: ['Cae', 'Jump fall'], land: ['Aterriza', 'Land'],
    wave: ['Saluda', 'Wave'], point: ['Señala', 'Point'], think: ['Piensa', 'Think'], idea: ['¡Idea!', 'Idea!'], talk: ['Platica', 'Talk'],
    nod: ['Dice que sí', 'Nod'], shake_no: ['Dice que no', 'Shake no'], curious: ['Curioso', 'Curious'], decision: ['Decide', 'Decide'],
    doubt: ['Duda', 'Doubt'], celebrate: ['Celebra', 'Celebrate'], frustrated: ['Frustrado', 'Frustrated'], scared: ['Se asusta', 'Scared'],
    ay: ['¡Ay!', 'Ouch!'], hit: ['Recibe golpe', 'Hit'], typing: ['Programa', 'Typing'], building: ['Construye', 'Build'],
    juggling: ['Malabares', 'Juggle'], play: ['Juega', 'Play'], push: ['Empuja', 'Push'], carry: ['Carga', 'Carry'], pickup: ['Recoge', 'Pick up'],
    dance: ['Baila', 'Dance'], ready: ['En guardia', 'Ready'], attack: ['Ataca', 'Attack'], sit: ['Sentado', 'Sit'], sleep: ['Duerme', 'Sleep'],
    wake: ['Despierta', 'Wake up'], sit_down: ['Se sienta', 'Sit down'], stand_up: ['Se levanta', 'Stand up'], dragged: ['Lo cargan', 'Dragged'],
    falling: ['Cae del cielo', 'Falling'], hang: ['Cuelga', 'Hang'], peek: ['Se asoma', 'Peek'], turn: ['Da la vuelta', 'Turn'],
  };
  const GROUPS_EN = { locomocion: 'Movement', salto: 'Jump', gestos: 'Gestures', emociones: 'Emotions', actividades: 'Activities', descanso: 'Rest', mascota: 'Pet' };
  const clips = Object.keys(CLIPS).filter((id) => man.clips[id]).map((id) => {
    const files = {};
    for (const f of Object.keys(man.clips[id])) files[f] = `${id}/${id}-${f}`;
    const c = CLIPS[id];
    return { id, es: (NAMES[id] || [id])[0], en: (NAMES[id] || [id, id])[1], groupEs: GROUPS[c.group] || c.group, groupEn: GROUPS_EN[c.group] || c.group, note: c.note || '', files };
  });
  writeFileSync(`${HD}/dist/catalog.json`, JSON.stringify({ version: man.version, generated: man.generated, clips }, null, 1));
  // favicon y og a partir de los pósters
  const posters = clips.flatMap((c) => Object.values(c.files)).map((f) => `dist-hd/${f}-poster.png`).filter((f) => existsSync(f));
  const pick = (want) => (existsSync(`dist-hd/${want}-poster.png`) ? `dist-hd/${want}-poster.png` : posters[0]);
  execSync(`ffmpeg -loglevel error -y -i ${pick('idle/idle-front')} -vf "crop=300:300:106:40,scale=64:64:flags=lanczos" ${HD}/favicon.png`);
  const og = ['wave/wave-right', 'celebrate/celebrate-front', 'think/think-left'].map((b) => `-i ${pick(b)}`).join(' ');
  execSync(`ffmpeg -loglevel error -y ${og} -filter_complex "color=c=0xF4E8D5:s=1200x630[bg];[0:v]scale=420:420[a];[1:v]scale=420:420[b];[2:v]scale=420:420[c];[bg][a]overlay=0:150[x];[x][b]overlay=390:150[y];[y][c]overlay=780:150,drawbox=x=0:y=0:w=1200:h=14:color=0xFF6B35:t=fill" -frames:v 1 ${HD}/og.png`);
  console.log('Moki HD →', HD, `(${clips.length} animaciones)`);
}
