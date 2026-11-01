#!/usr/bin/env node
// Exporta el pack Moki HD: cada clip × vista en video con transparencia (WebM), MP4 sobre crema,
// GIF, hoja de cuadros (WebP) con su JSON y póster PNG. Usa el mismo modelo y animaciones que Moki Pixel.
// Uso: node tools/hd.mjs [--clips idle,wave|core|all] [--facings right,front,left] [--size 512] [--workers 6] [--out dist-hd]
// Requiere ffmpeg en el PATH para videos, GIF y WebP.
import { Worker, isMainThread, parentPort, workerData } from 'node:worker_threads';
import { mkdirSync, writeFileSync, rmSync, readdirSync, statSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { cpus } from 'node:os';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const FPS = 12;
export const CORE = ['idle', 'walk', 'run', 'jump', 'wave', 'celebrate', 'think', 'idea', 'dance', 'sleep', 'point', 'sit'];

function args() {
  const a = process.argv.slice(2), o = {};
  for (let i = 0; i < a.length; i += 2) o[a[i].replace(/^--/, '')] = a[i + 1];
  return o;
}

async function renderJob({ clip, facing, size, tmp }) {
  const { createCanvas } = await import('@napi-rs/canvas');
  const { renderPoseHD } = await import(path.join(ROOT, 'src/hd/render-hd.js'));
  const { sampleClip } = await import(path.join(ROOT, 'src/anim/sample.js'));
  const { CLIPS, FACINGS } = await import(path.join(ROOT, 'src/anim/clips.js'));
  const c = CLIPS[clip];
  const n = Math.max(1, Math.round(c.dur * FPS));
  const count = c.loop ? n : n + 1;
  const S = size / 512;
  const opts = { w: size, h: size, s: 0.4 * S, ground: size - 22 * S, cx: size / 2, ss: 2 };
  const frames = [];
  const canvas = createCanvas(size, size);
  const g = canvas.getContext('2d');
  for (let i = 0; i < count; i++) {
    const t = i / FPS;
    const pose = sampleClip(c, t, FACINGS[facing]);
    const air = Math.max(0, pose.root[1]);
    pose.root = [pose.root[0], pose.root[1] - air, pose.root[2]];
    const r = renderPoseHD(pose, opts);
    const img = g.createImageData(size, size);
    img.data.set(r.data);
    g.clearRect(0, 0, size, size);
    g.putImageData(img, 0, 0);
    const f = path.join(tmp, `f${String(i).padStart(4, '0')}.png`);
    writeFileSync(f, canvas.toBuffer('image/png'));
    const ev = (c.events || []).filter((e) => e.t >= t - 1e-6 && e.t < t + 1 / FPS - 1e-6).map((e) => e.name);
    frames.push({ i, t: +t.toFixed(4), air: Math.round(air * opts.s), events: ev });
  }
  return { clip, facing, loop: !!c.loop, frames };
}

function ff(argv) { execFileSync('ffmpeg', ['-loglevel', 'error', '-y', ...argv], { stdio: 'inherit' }); }

function encode(job, res, out, size) {
  const base = `${job.clip}-${job.facing}`;
  const dir = path.join(out, job.clip);
  mkdirSync(dir, { recursive: true });
  const inp = path.join(job.tmp, 'f%04d.png');
  const n = res.frames.length;
  // WebM con alfa (web y juegos), MP4 sobre crema (redes), GIF chico, póster
  ff(['-framerate', String(FPS), '-i', inp, '-c:v', 'libvpx-vp9', '-pix_fmt', 'yuva420p', '-b:v', '0', '-crf', '30', '-row-mt', '1', path.join(dir, `${base}.webm`)]);
  ff(['-framerate', String(FPS), '-i', inp, '-filter_complex', `color=c=0xF4E8D5:s=${size}x${size}:r=${FPS}[bg];[bg][0:v]overlay=shortest=1,format=yuv420p`, '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '20', '-movflags', '+faststart', path.join(dir, `${base}.mp4`)]);
  const gs = Math.round(size / 2);
  ff(['-framerate', String(FPS), '-i', inp, '-filter_complex', `color=c=0xF4E8D5:s=${size}x${size}:r=${FPS}[bg];[bg][0:v]overlay=shortest=1,scale=${gs}:${gs}:flags=lanczos,split[a][b];[a]palettegen=max_colors=128[p];[b][p]paletteuse=dither=bayer:bayer_scale=3`, '-loop', '0', path.join(dir, `${base}.gif`)]);
  // Hoja de cuadros WebP (columnas fijas) para motores 2D
  const cols = Math.min(8, n), rows = Math.ceil(n / cols);
  ff(['-framerate', String(FPS), '-i', inp, '-vf', `tile=${cols}x${rows}:padding=0:color=0x00000000`, '-frames:v', '1', '-c:v', 'libwebp', '-lossless', '0', '-q:v', '88', '-pix_fmt', 'yuva420p', path.join(dir, `${base}-sheet.webp`)]);
  const mid = Math.floor(n / 2);
  ff(['-i', path.join(job.tmp, `f${String(mid).padStart(4, '0')}.png`), '-frames:v', '1', path.join(dir, `${base}-poster.png`)]);
  const meta = {
    clip: job.clip, facing: job.facing, fps: FPS, loop: res.loop, size, frames: n,
    sheet: { file: `${base}-sheet.webp`, cols, rows, frameW: size, frameH: size },
    files: { webm: `${base}.webm`, mp4: `${base}.mp4`, gif: `${base}.gif`, poster: `${base}-poster.png` },
    air: res.frames.map((f) => f.air), events: res.frames.filter((f) => f.events.length).map((f) => ({ frame: f.i, names: f.events })),
  };
  writeFileSync(path.join(dir, `${base}.json`), JSON.stringify(meta, null, 1));
  return meta;
}

if (!isMainThread) {
  parentPort.on('message', async (job) => {
    try { parentPort.postMessage({ ok: true, res: await renderJob(job), job }); }
    catch (e) { parentPort.postMessage({ ok: false, err: String(e && e.stack || e), job }); }
  });
} else {
  const o = args();
  const { CLIPS } = await import(path.join(ROOT, 'src/anim/clips.js'));
  const clipList = !o.clips || o.clips === 'core' ? CORE : o.clips === 'all' ? Object.keys(CLIPS) : o.clips.split(',');
  const facings = (o.facings || 'right,front,left').split(',');
  const size = +(o.size || 512);
  const out = path.resolve(o.out || path.join(ROOT, 'dist-hd'));
  const tmpRoot = path.join(out, '.tmp');
  const W = Math.max(1, Math.min(+(o.workers || cpus().length - 1), 12));
  mkdirSync(tmpRoot, { recursive: true });
  const jobs = [];
  for (const clip of clipList) {
    if (!CLIPS[clip]) { console.error('no existe el clip', clip); continue; }
    const allowed = CLIPS[clip].facings || ['right', 'left', 'front'];
    for (const facing of facings) if (allowed.includes(facing)) {
      const tmp = path.join(tmpRoot, `${clip}-${facing}`);
      mkdirSync(tmp, { recursive: true });
      jobs.push({ clip, facing, size, tmp });
    }
  }
  console.log(`Moki HD: ${jobs.length} trabajos (${clipList.length} clips) con ${W} hilos → ${out}`);
  const t0 = Date.now();
  const metas = [];
  let next = 0, done = 0;
  await new Promise((resolve, reject) => {
    const pool = [];
    const feed = (w) => { if (next < jobs.length) w.postMessage(jobs[next++]); else { w.terminate(); if (done === jobs.length) resolve(); } };
    for (let i = 0; i < Math.min(W, jobs.length); i++) {
      const w = new Worker(fileURLToPath(import.meta.url));
      w.on('message', (m) => {
        if (!m.ok) { reject(new Error(m.err)); return; }
        metas.push(encode(m.job, m.res, out, size));
        rmSync(m.job.tmp, { recursive: true, force: true });
        done++;
        console.log(`  ${done}/${jobs.length} ${m.job.clip}-${m.job.facing} (${m.res.frames.length} cuadros, ${((Date.now() - t0) / 1000).toFixed(0)} s)`);
        if (done === jobs.length) { pool.forEach((p) => p.terminate()); resolve(); } else feed(w);
      });
      w.on('error', reject);
      pool.push(w);
      feed(w);
    }
  });
  rmSync(tmpRoot, { recursive: true, force: true });
  // Manifiesto del pack (se fusiona con lo que ya hubiera)
  const manPath = path.join(out, 'manifest.json');
  let man = { name: 'Moki HD', version: '0.1.0', fps: FPS, size, clips: {} };
  if (existsSync(manPath)) try { man = { ...man, ...JSON.parse((await import('node:fs')).readFileSync(manPath, 'utf8')) }; } catch {}
  for (const m of metas) { (man.clips[m.clip] ||= {})[m.facing] = `${m.clip}/${m.clip}-${m.facing}.json`; }
  man.generated = new Date().toISOString();
  writeFileSync(manPath, JSON.stringify(man, null, 1));
  let bytes = 0;
  const walk = (d) => { for (const f of readdirSync(d)) { const p = path.join(d, f); const st = statSync(p); st.isDirectory() ? walk(p) : (bytes += st.size); } };
  walk(out);
  console.log(`Listo en ${((Date.now() - t0) / 1000).toFixed(0)} s · ${(bytes / 1e6).toFixed(1)} MB`);
}
