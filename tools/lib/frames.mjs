// Genera los cuadros de un clip en un tamaño y vista: muestreo, render y holds automáticos.
import { renderPose } from '../../src/core/render.js';
import { sampleClip } from '../../src/anim/sample.js';
import { CLIPS, FACINGS } from '../../src/anim/clips.js';
import { SIZES } from '../../src/core/render.js';

export const EXPORT_FPS = 12; // «en dos» (on twos): estándar pixel art. Timeline autorizado en segundos.

function sameBuf(a, b) {
  if (!a || a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
  return true;
}

export function clipFrames(name, facing, size, fps = EXPORT_FPS) {
  const clip = CLIPS[name];
  const n = Math.max(1, Math.round(clip.dur * fps));
  const count = clip.loop ? n : n + 1;
  const s = SIZES[size].s;
  const frames = [];
  for (let i = 0; i < count; i++) {
    const t = i / fps;
    const pose = sampleClip(clip, t, FACINGS[facing]);
    // Root motion vertical positiva (aire) sale del cuadro: el juego/runtime la aplica.
    const air = Math.max(0, pose.root[1]);
    pose.root = [pose.root[0], pose.root[1] - air, pose.root[2]];
    const r = renderPose(pose, { size });
    const airPx = Math.round(air * s);
    const ev = (clip.events || []).filter((e) => e.t >= t - 1e-6 && e.t < t + 1 / fps - 1e-6).map((e) => e.name);
    const prev = frames[frames.length - 1];
    if (prev && sameBuf(prev.data, r.data) && prev.air === airPx && !ev.length) {
      prev.duration += 1000 / fps; // hold automático: mismo dibujo, más tiempo
      continue;
    }
    frames.push({ data: r.data, w: r.w, h: r.h, anchors: r.anchors, air: airPx, duration: 1000 / fps, events: ev, t });
  }
  // Duraciones enteras en ms sin perder el total
  let acc = 0, accR = 0;
  for (const f of frames) { acc += f.duration; const r = Math.round(acc); f.duration = r - accR; accR = r; }
  return frames;
}

export function clipsForFacing(facing) {
  return Object.keys(CLIPS).filter((k) => (CLIPS[k].facings || ['right', 'left', 'front']).includes(facing));
}
