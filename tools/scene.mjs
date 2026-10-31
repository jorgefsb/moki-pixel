#!/usr/bin/env node
// Moki Scene: videos programáticos a partir de un guion JSON (pensado para que Claude u otro agente los escriba).
// Uso: node tools/scene.mjs escenas/hola.json [--out salida.mp4] [--still 2.5]
// Salidas: .mp4 (H.264), .webm (VP9), .gif, .png (un cuadro con --still)
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { spawn } from 'node:child_process';
import gifenc from 'gifenc';
import { loadAtlas, frameAt, clipLength, drawMoki, drawEmote, drawSay, drawFx, drawBackground, FORMATS, createCanvas } from './lib/compose.mjs';

const { GIFEncoder, quantize, applyPalette } = gifenc;
const arg = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : d; };
const file = process.argv[2];
if (!file || file.startsWith('--')) {
  console.log('Uso: node tools/scene.mjs guion.json [--out video.mp4] [--still segundos]');
  process.exit(1);
}
const S = JSON.parse(readFileSync(file, 'utf8'));
const out = arg('--out', S.out || file.replace(/\.json$/, '.mp4'));
const still = arg('--still', null);

export async function renderScene(S, out, still = null) {
  const fmt = FORMATS[S.format || '16:9'];
  const W = S.width || fmt.w, H = S.height || fmt.h, SC = S.scale || fmt.scale;
  const size = S.size || 64;
  const fps = S.fps || 24;
  const groundY = S.ground ?? H - Math.round(H * 0.16);
  const dur = S.duration || 6;
  const facings = {};
  for (const f of ['right', 'left', 'front', 'back']) facings[f] = await loadAtlas(size, f);

  // Estado de Moki
  const ev = [...(S.timeline || [])].sort((a, b) => a.at - b.at);
  const st = { x: S.start?.x ?? Math.round(W * 0.3), facing: S.start?.facing || 'right', clip: S.start?.clip || 'idle', t0: 0, target: null, says: [], emotes: [], fx: [], captions: [] };
  let evi = 0;
  const atlas = () => facings[st.facing] || facings.right;
  const play = (clip, t) => {
    if (!atlas().tags[clip]) { st.facing = 'right'; }
    st.clip = clip; st.t0 = t;
  };

  const frames = Math.round(dur * fps);
  const tsteps = still !== null ? [Number(still)] : [...Array(frames).keys()].map((i) => i / fps);
  const base = createCanvas(W, H);
  const g = base.getContext('2d');
  g.imageSmoothingEnabled = false;
  const big = createCanvas(W * SC, H * SC);
  const bg = big.getContext('2d');
  bg.imageSmoothingEnabled = false;

  let enc = null, ff = null, gif = null;
  if (still === null) {
    mkdirSync(dirname(out) || '.', { recursive: true });
    if (out.endsWith('.gif')) gif = GIFEncoder();
    else {
      const vargs = out.endsWith('.webm')
        ? ['-c:v', 'libvpx-vp9', '-b:v', '0', '-crf', '32', '-row-mt', '1', '-deadline', 'realtime', '-cpu-used', '8']
        : ['-c:v', 'libx264', '-preset', 'veryfast', '-crf', '18', '-pix_fmt', 'yuv420p', '-movflags', '+faststart'];
      ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'rawvideo', '-pix_fmt', 'rgba', '-s', `${W * SC}x${H * SC}`, '-r', String(fps), '-i', '-', ...vargs, out], { stdio: ['pipe', 'inherit', 'inherit'] });
    }
  }
  let lastT = 0;
  for (const t of tsteps) {
    // procesar eventos hasta t
    while (evi < ev.length && ev[evi].at <= t) {
      const e = ev[evi++];
      if (e.facing) st.facing = e.facing;
      if (e.x !== undefined && e.walk_to === undefined && e.run_to === undefined) st.x = e.x;
      if (e.play) { play(e.play, e.at); st.target = null; }
      if (e.walk_to !== undefined || e.run_to !== undefined) {
        const to = e.walk_to ?? e.run_to;
        st.target = to; st.facing = to >= st.x ? 'right' : 'left';
        play(e.walk_to !== undefined ? 'walk' : 'run', e.at);
      }
      if (e.say) st.says.push({ text: e.say, from: e.at, to: e.at + (e.for || 1.8) });
      if (e.emote) st.emotes.push({ name: e.emote, from: e.at, to: e.at + (e.for || 1.5) });
      if (e.fx) st.fx.push({ kind: e.fx, from: e.at, x: st.x });
      if (e.caption) st.captions.push({ text: e.caption, from: e.at, to: e.at + (e.for || 2.5), pos: e.pos || 'top' });
    }
    // movimiento
    const dt = t - lastT; lastT = t;
    if (st.target !== null) {
      const tag = atlas().tags[st.clip];
      const v = (tag && tag.speed) || 19;
      const dir = Math.sign(st.target - st.x);
      st.x += dir * v * dt;
      if ((dir > 0 && st.x >= st.target) || (dir < 0 && st.x <= st.target) || dir === 0) { st.x = st.target; st.target = null; play('idle', t); }
    }
    // clip no cíclico terminado → idle
    const A = atlas();
    if (!A.tags[st.clip]) play('idle', t);
    if (!A.tags[st.clip].loop && t - st.t0 > clipLength(A, st.clip) + 0.15) play('idle', t);
    const fr = frameAt(A, st.clip, t - st.t0);

    // dibujar
    g.clearRect(0, 0, W, H);
    drawBackground(g, W, H, S.background || 'noche', groundY, S.seed || 7);
    const { headTop } = drawMoki(g, A, fr, st.x, groundY, { shadowOn: S.background !== 'transparente' });
    if (fr.events?.includes('land') || fr.events?.includes('step')) st.fx.push({ kind: 'dust', from: t, x: st.x, auto: true });
    if (fr.events?.includes('hit')) st.fx.push({ kind: 'spark', from: t, x: st.x + (st.facing === 'left' ? -14 : 14), y: groundY - 8, auto: true });
    st.fx = st.fx.filter((f) => t - f.from < 0.6);
    for (const f of st.fx) {
      const n = f.kind === 'dust' ? 4 : f.kind === 'spark' ? 3 : 5;
      const i = Math.min(n - 1, Math.floor((t - f.from) / 0.09));
      drawFx(g, f.kind, i, f.x, f.y ?? (f.kind === 'confetti' ? groundY - 40 : groundY - 3), 1);
    }
    for (const e of st.emotes) if (t >= e.from && t < e.to) drawEmote(g, e.name, t - e.from < 0.06 ? 0 : t - e.from < 0.12 ? 1 : 2, headTop, size === 128 ? 2 : 1);
    // escalar a salida y texto nítido encima
    bg.clearRect(0, 0, W * SC, H * SC);
    bg.drawImage(base, 0, 0, W * SC, H * SC);
    for (const s of st.says) if (t >= s.from && t < s.to) drawSay(bg, s.text, headTop[0] * SC, headTop[1] * SC, SC * (size === 128 ? 1.6 : 1));
    for (const c of st.captions) if (t >= c.from && t < c.to) caption(bg, c.text, W * SC, H * SC, c.pos, S.format || '16:9');
    if (S.signature !== false) signature(bg, W * SC, H * SC);

    if (still !== null) { writeFileSync(out.replace(/\.(mp4|webm|gif)$/, '.png'), big.toBuffer('image/png')); return; }
    if (gif) {
      const small = createCanvas(W * 2, H * 2); const sg = small.getContext('2d'); sg.imageSmoothingEnabled = false; sg.drawImage(big, 0, 0, W * 2, H * 2);
      const data = sg.getImageData(0, 0, W * 2, H * 2).data;
      const pal = quantize(data, 64); const idx = applyPalette(data, pal);
      gif.writeFrame(idx, W * 2, H * 2, { palette: pal, delay: Math.round(1000 / fps) });
    } else {
      const data = bg.getImageData(0, 0, W * SC, H * SC).data;
      if (!ff.stdin.write(Buffer.from(data.buffer))) await new Promise((r) => ff.stdin.once('drain', r));
    }
  }
  if (gif) { gif.finish(); writeFileSync(out, gif.bytes()); }
  if (ff) { ff.stdin.end(); await new Promise((r) => ff.on('close', r)); }
}

// Texto grande con reservas de zona segura (brief P15: márgenes 8 %, vertical 12 % arriba / 18 % abajo)
function caption(g, text, W, H, pos, format) {
  const vertical = format === '9:16';
  const fs = Math.round(Math.min(W, H) * (vertical ? 0.058 : 0.07));
  g.font = `700 ${fs}px Outfit`;
  g.textAlign = 'center'; g.textBaseline = 'middle';
  const y = pos === 'bottom' ? H * (vertical ? 0.78 : 0.93) : H * (vertical ? 0.17 : 0.13);
  const lines = wrap(g, text, W * 0.84);
  lines.forEach((ln, i) => {
    const yy = y + (i - (lines.length - 1) / 2) * fs * 1.15;
    g.fillStyle = 'rgba(0,0,0,.45)'; g.fillText(ln, W / 2 + fs * 0.05, yy + fs * 0.07);
    g.fillStyle = '#F4E8D5'; g.fillText(ln, W / 2, yy);
  });
  g.textAlign = 'left';
}
function wrap(g, text, maxW) {
  const words = text.split(' '); const lines = []; let cur = '';
  for (const w of words) { const t = cur ? cur + ' ' + w : w; if (g.measureText(t).width > maxW && cur) { lines.push(cur); cur = w; } else cur = t; }
  if (cur) lines.push(cur);
  return lines;
}
function signature(g, W, H) {
  const fs = Math.max(12, Math.round(Math.min(W, H) * 0.022));
  g.font = `400 ${fs}px Inter`;
  g.textAlign = 'right'; g.textBaseline = 'bottom';
  g.fillStyle = 'rgba(244,232,213,.72)';
  g.fillText('moki.jorgesuarez.com.mx', W - fs, H - fs * 0.8);
  g.textAlign = 'left';
}

await renderScene(S, out, still);
console.log(still !== null ? `Cuadro → ${out.replace(/\.(mp4|webm|gif)$/, '.png')}` : `Video → ${out}`);
