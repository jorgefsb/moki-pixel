// Muestreo de clips → poses. Interpolación por canal con easing por llave,
// capa procedural opcional y follow-through automático de la mochila.
import { ease } from './ease.js';

export const BONE_KEYS = [
  'hips', 'spine', 'head', 'pack',
  'armL', 'foreL', 'handL', 'armR', 'foreR', 'handR',
  'thighL', 'shinL', 'footL', 'thighR', 'shinR', 'footR',
];

export const BASE_POSE = {
  bones: {
    armL: [0, 0, 4], foreL: [-10, 0, 0],
    armR: [0, 0, 4], foreR: [-10, 0, 0],
  },
  root: [0, 0, 0],
  rootRot: [0, 0, 0],
  squash: 0,
  yaw: 0,
  props: [],
};

function clone(p) {
  const b = {};
  for (const k of BONE_KEYS) b[k] = (p.bones[k] || [0, 0, 0]).slice();
  return {
    bones: b,
    root: (p.root || [0, 0, 0]).slice(),
    rootRot: (p.rootRot || [0, 0, 0]).slice(),
    squash: p.squash || 0,
    yaw: p.yaw || 0,
    props: p.props || [],
  };
}

// Combina una llave parcial sobre una pose completa.
export function merge(base, partial) {
  const p = clone(base);
  for (const [k, v] of Object.entries(partial)) {
    if (k === 'root' || k === 'rootRot') p[k] = v.slice();
    else if (k === 'squash' || k === 'yaw') p[k] = v;
    else if (k === 'props') p.props = v;
    else if (BONE_KEYS.includes(k)) p.bones[k] = v.slice();
  }
  return p;
}

const lerpArr = (a, b, t) => a.map((v, i) => v + (b[i] - v) * t);

function interp(a, b, t) {
  const p = clone(a);
  for (const k of BONE_KEYS) p.bones[k] = lerpArr(a.bones[k], b.bones[k], t);
  p.root = lerpArr(a.root, b.root, t);
  p.rootRot = lerpArr(a.rootRot, b.rootRot, t);
  p.squash = a.squash + (b.squash - a.squash) * t;
  p.yaw = a.yaw + (b.yaw - a.yaw) * t;
  p.props = t < 1 ? a.props : b.props;
  return p;
}

// Prepara llaves acumuladas (cada llave hereda lo no especificado de la anterior).
export function compile(clip) {
  if (clip._compiled) return clip;
  let acc = merge(BASE_POSE, clip.base || {});
  const keys = (clip.keys || [[0, {}]]).map(([t, part, e]) => {
    acc = merge(acc, part || {});
    return { t, pose: acc, ease: ease(e) };
  });
  clip._keys = keys;
  clip._compiled = true;
  return clip;
}

function rawSample(clip, t) {
  const keys = clip._keys;
  let pose;
  if (t <= keys[0].t) pose = keys[0].pose;
  else if (t >= keys[keys.length - 1].t) pose = keys[keys.length - 1].pose;
  else {
    let i = 0;
    while (i < keys.length - 1 && keys[i + 1].t <= t) i++;
    const a = keys[i], b = keys[i + 1];
    const u = (t - a.t) / (b.t - a.t || 1);
    pose = interp(a.pose, b.pose, b.ease(u));
  }
  pose = clone(pose);
  if (clip.fn) clip.fn(t, pose, clip);
  return pose;
}

// t en segundos. Devuelve pose lista para renderPose (yaw de la vista se suma afuera).
export function sampleClip(clip, t, facingYaw = 0) {
  compile(clip);
  const dur = clip.dur;
  const wrap = (x) => (clip.loop ? ((x % dur) + dur) % dur : Math.max(0, Math.min(dur, x)));
  const tt = wrap(t);
  const pose = rawSample(clip, tt);
  // Follow-through y acción secundaria (principios 5 y 8): la mochila llega 2-3 cuadros tarde.
  const lag = 2.5 / 24;
  const prev = rawSample(clip, wrap(t - lag));
  const prev2 = rawSample(clip, wrap(t - 2 * lag));
  const vy = pose.root[1] - prev.root[1];
  const ay = vy - (prev.root[1] - prev2.root[1]);
  const spineLag = prev.bones.spine[0] - pose.bones.spine[0];
  const pk = pose.bones.pack;
  pk[0] += clamp(spineLag * 0.8 - ay * 0.25 + (clip.packSwing || 0), -18, 18);
  pk[2] += clamp((prev.bones.spine[2] - pose.bones.spine[2]) * 0.6, -10, 10);
  return {
    yaw: facingYaw + pose.yaw,
    bones: { ...pose.bones, root: pose.rootRot },
    root: pose.root,
    squash: pose.squash,
    props: pose.props,
  };
}
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
