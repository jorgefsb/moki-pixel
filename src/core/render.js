// Rasterizador pixel art de Moki: raymarching ortográfico de un proxy SDF,
// sombreado por bandas con rampas cerradas, contorno selectivo y líneas de traslape.
// Corre igual en Node y en navegador (sin dependencias).
import { euler, mul, apply, applyT } from './math.js';
import { BONES, buildPrims, ANCHORS } from './model.js';
import { RAMPS, OUTLINE, hexToRgb } from './palette.js';
import { propPrims } from './props.js';

const BASE_PRIMS = buildPrims();
const BONE_INDEX = Object.fromEntries(BONES.map((b, i) => [b.name, i]));

// Tamaños oficiales del kit (pixel por unidad = escala). H visible ≈ 1000u * s.
export const SIZES = {
  32: { w: 32, h: 32, s: 0.025, ground: 30, detail: 0 },
  64: { w: 64, h: 64, s: 0.05, ground: 61, detail: 1 },
  128: { w: 128, h: 128, s: 0.1, ground: 122, detail: 2 },
};

const LIGHT = norm([-0.55, 0.62, 0.56]);
function norm(v) {
  const l = Math.hypot(v[0], v[1], v[2]);
  return [v[0] / l, v[1] / l, v[2] / l];
}

const RGB = {};
for (const [k, r] of Object.entries(RAMPS)) RGB[k] = r.map(hexToRgb);
const OUT_RGB = hexToRgb(OUTLINE);

// ---------------- Pose → transformaciones de huesos ----------------
const SQUASH_CHAIN = new Set(['hips', 'thighL', 'thighR', 'shinL', 'shinR', 'footL', 'footR']);

export function solvePose(pose = {}) {
  const yaw = pose.yaw || 0;
  const rot = pose.bones || {};
  const squash = Math.max(-0.03, Math.min(0.03, pose.squash || 0)); // canon: ≤ 3 % de cuerpo
  const world = new Array(BONES.length);
  for (let i = 0; i < BONES.length; i++) {
    const b = BONES[i];
    const sd = b.side || 1;
    const rest = b.rest || [0, 0, 0];
    const pr = rot[b.name] || [0, 0, 0];
    // Espejo lógico de rotaciones del lado derecho: mismos números, pose simétrica.
    let R = euler(rest[0], rest[1] * sd, rest[2] * sd);
    R = mul(R, euler(pr[0], (pr[1] || 0) * sd, (pr[2] || 0) * sd));
    let off = b.offset.slice();
    if (SQUASH_CHAIN.has(b.name)) off[1] *= 1 - squash;
    if (b.name === 'spine') off[1] *= 1 - squash;
    if (b.name === 'root') {
      R = mul(euler(0, yaw, 0), euler(pr[0], pr[1] || 0, pr[2] || 0));
      const t = pose.root || [0, 0, 0];
      // La traslación del root se escribe en ejes del personaje (x izq, z frente).
      world[i] = { R, t: apply(euler(0, yaw, 0), [t[0] || 0, t[1] || 0, t[2] || 0]) };
      continue;
    }
    if (pose.offsets && pose.offsets[b.name]) {
      const o = pose.offsets[b.name];
      off = [off[0] + o[0] * sd, off[1] + o[1], off[2] + o[2]];
    }
    const p = world[BONE_INDEX[b.parent]];
    world[i] = { R: mul(p.R, R), t: add3(p.t, apply(p.R, off)) };
  }
  return world;
}
const add3 = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];

// ---------------- SDFs ----------------
function sdEllipsoid(x, y, z, r) {
  const k0 = Math.sqrt((x * x) / (r[0] * r[0]) + (y * y) / (r[1] * r[1]) + (z * z) / (r[2] * r[2]));
  const k1 = Math.sqrt((x * x) / r[0] ** 4 + (y * y) / r[1] ** 4 + (z * z) / r[2] ** 4);
  if (k1 === 0) return -Math.min(r[0], r[1], r[2]);
  return (k0 * (k0 - 1)) / k1;
}
function sdRBox(x, y, z, h, k) {
  const qx = Math.abs(x) - (h[0] - k), qy = Math.abs(y) - (h[1] - k), qz = Math.abs(z) - (h[2] - k);
  const ox = Math.max(qx, 0), oy = Math.max(qy, 0), oz = Math.max(qz, 0);
  return Math.sqrt(ox * ox + oy * oy + oz * oz) + Math.min(Math.max(qx, qy, qz), 0) - k;
}
function sdCapsule(x, y, z, a, b, r) {
  const pax = x - a[0], pay = y - a[1], paz = z - a[2];
  const bax = b[0] - a[0], bay = b[1] - a[1], baz = b[2] - a[2];
  let h = (pax * bax + pay * bay + paz * baz) / (bax * bax + bay * bay + baz * baz);
  h = h < 0 ? 0 : h > 1 ? 1 : h;
  const dx = pax - bax * h, dy = pay - bay * h, dz = paz - baz * h;
  return Math.sqrt(dx * dx + dy * dy + dz * dz) - r;
}
function sdCyl(axial, ra, rb, r, a0, a1) {
  const mid = (a0 + a1) / 2, half = (a1 - a0) / 2;
  const dr = Math.hypot(ra, rb) - r;
  const da = Math.abs(axial - mid) - half;
  return Math.min(Math.max(dr, da), 0) + Math.hypot(Math.max(dr, 0), Math.max(da, 0));
}

export function primDist(pr, x, y, z) {
  switch (pr.type) {
    case 'ellipsoid':
      return sdEllipsoid(x - pr.c[0], y - pr.c[1], z - pr.c[2], pr.r);
    case 'sphere':
      return Math.hypot(x - pr.c[0], y - pr.c[1], z - pr.c[2]) - pr.rad;
    case 'rbox':
      return sdRBox(x - pr.c[0], y - pr.c[1], z - pr.c[2], pr.h, pr.k);
    case 'capsule':
      return sdCapsule(x, y, z, pr.a, pr.b, pr.r);
    case 'cylX':
      return sdCyl(x, y - pr.c[1], z - pr.c[2], pr.r, pr.x0, pr.x1);
    case 'cylY':
      return sdCyl(y, x - pr.c[0], z - pr.c[2], pr.r, pr.y0, pr.y1);
    case 'cylZ':
      return sdCyl(z, x - pr.c[0], y - pr.c[1], pr.r, pr.z0, pr.z1);
  }
  return 1e9;
}
export function primBound(pr) {
  switch (pr.type) {
    case 'ellipsoid':
      return [pr.c, Math.max(...pr.r)];
    case 'sphere':
      return [pr.c, pr.rad];
    case 'rbox':
      return [pr.c, Math.hypot(...pr.h)];
    case 'capsule':
      return [
        [(pr.a[0] + pr.b[0]) / 2, (pr.a[1] + pr.b[1]) / 2, (pr.a[2] + pr.b[2]) / 2],
        Math.hypot(pr.b[0] - pr.a[0], pr.b[1] - pr.a[1], pr.b[2] - pr.a[2]) / 2 + pr.r,
      ];
    case 'cylX':
      return [[(pr.x0 + pr.x1) / 2, pr.c[1], pr.c[2]], Math.hypot((pr.x1 - pr.x0) / 2, pr.r)];
    case 'cylY':
      return [[pr.c[0], (pr.y0 + pr.y1) / 2, pr.c[2]], Math.hypot((pr.y1 - pr.y0) / 2, pr.r)];
    case 'cylZ':
      return [[pr.c[0], pr.c[1], (pr.z0 + pr.z1) / 2], Math.hypot((pr.z1 - pr.z0) / 2, pr.r)];
  }
}

// ---------------- Render ----------------
// opts: { size: 32|64|128, w, h, s, ground, cx, detail, outline: true, lines: true, hide: Set(layer) }
export function renderPose(pose = {}, opts = {}) {
  const base = SIZES[opts.size || 64];
  const W = opts.w || base.w, H = opts.h || base.h;
  const s = opts.s || base.s;
  const ground = opts.ground ?? base.ground;
  const cx = opts.cx ?? W / 2;
  const detail = opts.detail ?? base.detail;
  const px = 1 / s;
  const ctx = { px, detail };

  const world = solvePose(pose);
  const prims = BASE_PRIMS.concat(propPrims(pose.props || [])).filter((p) => !(opts.hide && opts.hide.has(p.layer)));

  // Precálculo por primitiva: transformación y caja en pantalla
  const live = [];
  for (const pr of prims) {
    const bw = world[BONE_INDEX[pr.bone]];
    if (!bw) continue;
    const [bc, br] = primBound(pr);
    const wc = add3(bw.t, apply(bw.R, bc));
    const R = br + 2;
    live.push({
      pr, R: bw.R, t: bw.t,
      x0: Math.floor(cx + (wc[0] - R) * s) - 1,
      x1: Math.ceil(cx + (wc[0] + R) * s) + 1,
      y0: Math.floor(ground - (wc[1] + R) * s) - 1,
      y1: Math.ceil(ground - (wc[1] - R) * s) + 1,
      ztop: wc[2] + R,
      zbot: wc[2] - R,
    });
  }

  const N = W * H;
  const mat = new Array(N).fill(null);
  const shade = new Int8Array(N).fill(-1);
  const depth = new Float32Array(N).fill(-1e9);
  const layer = new Array(N).fill(null);

  const local = (lv, x, y, z) => applyT(lv.R, [x - lv.t[0], y - lv.t[1], z - lv.t[2]]);
  const sceneD = (cands, x, y, z) => {
    let best = 1e9, bi = -1;
    for (let i = 0; i < cands.length; i++) {
      const lv = cands[i];
      if (z > lv.ztop + 4 || z < lv.zbot - 4) {
        const dz = z > lv.ztop ? z - lv.ztop : lv.zbot - z;
        if (dz < best) { best = dz; }
        continue;
      }
      const p = local(lv, x, y, z);
      const d = primDist(lv.pr, p[0], p[1], p[2]);
      if (d < best) { best = d; bi = i; }
    }
    return [best, bi];
  };

  for (let py = 0; py < H; py++) {
    for (let pxi = 0; pxi < W; pxi++) {
      const cands = [];
      for (const lv of live) if (pxi >= lv.x0 && pxi <= lv.x1 && py >= lv.y0 && py <= lv.y1) cands.push(lv);
      if (!cands.length) continue;
      // centro del pixel
      const X = (pxi + 0.5 - cx) / s;
      const Y = (ground - (py + 0.5)) / s;
      let z = -1e9;
      for (const c of cands) if (c.ztop > z) z = c.ztop;
      const zmin = Math.min(...cands.map((c) => c.zbot));
      let hit = -1;
      for (let it = 0; it < 96 && z > zmin; it++) {
        const [d, bi] = sceneD(cands, X, Y, z);
        if (d < 0.6) { hit = bi; break; }
        z -= Math.max(d * 0.85, 0.5);
      }
      if (hit < 0) continue;
      // Normal por diferencias centrales
      const e = 1.5;
      const nx = sceneD(cands, X + e, Y, z)[0] - sceneD(cands, X - e, Y, z)[0];
      const ny = sceneD(cands, X, Y + e, z)[0] - sceneD(cands, X, Y - e, z)[0];
      const nz = sceneD(cands, X, Y, z + e)[0] - sceneD(cands, X, Y, z - e)[0];
      const nl = Math.hypot(nx, ny, nz) || 1;
      const lam = (nx * LIGHT[0] + ny * LIGHT[1] + nz * LIGHT[2]) / nl;
      const lv = cands[hit];
      const lp = local(lv, X, Y, z);
      const m = lv.pr.mat(lp, ctx) || 'orange';
      let si = lam > 0.6 ? 0 : lam > 0.12 ? 1 : lam > -0.32 ? 2 : 3;
      if (m === 'ink' || m === 'kraft') si = 1;
      if (m === 'label') si = Math.min(si, 1);
      if (m === 'speck' || m === 'visorHi') si = Math.max(0, Math.min(si, 2));
      const i = py * W + pxi;
      mat[i] = m; shade[i] = si; depth[i] = z; layer[i] = lv.pr.layer;
    }
  }

  // Líneas de traslape: el pixel lejano junto a una pieza más cercana se oscurece.
  const lines = opts.lines !== false;
  const thr = 70;
  const out = new Uint8ClampedArray(N * 4);
  for (let py = 0; py < H; py++) {
    for (let x = 0; x < W; x++) {
      const i = py * W + x;
      if (!mat[i]) continue;
      let si = shade[i];
      if (lines) {
        const nb = [i - 1, i + 1, i - W, i + W];
        const ok = [x > 0, x < W - 1, py > 0, py < H - 1];
        for (let k = 0; k < 4; k++) {
          if (!ok[k]) continue;
          const j = nb[k];
          if (mat[j] && depth[j] - depth[i] > thr && layer[j] !== layer[i]) { si = 3; break; }
        }
      }
      const c = (RGB[mat[i]] || RGB.orange)[si];
      out[i * 4] = c[0]; out[i * 4 + 1] = c[1]; out[i * 4 + 2] = c[2]; out[i * 4 + 3] = 255;
    }
  }

  // Contorno exterior selectivo (sel-out): tinta abajo/derecha, rampa profunda arriba/izquierda.
  if (opts.outline !== false) {
    const filled = (j) => mat[j] !== null;
    const extra = [];
    for (let py = 0; py < H; py++) {
      for (let x = 0; x < W; x++) {
        const i = py * W + x;
        if (filled(i)) continue;
        let src = -1, dir = '';
        if (x < W - 1 && filled(i + 1)) { src = i + 1; dir = 'l'; }
        else if (py < H - 1 && filled(i + W)) { src = i + W; dir = 't'; }
        else if (x > 0 && filled(i - 1)) { src = i - 1; dir = 'r'; }
        else if (py > 0 && filled(i - W)) { src = i - W; dir = 'b'; }
        if (src < 0) continue;
        let c = OUT_RGB;
        const m = mat[src];
        const darkMat = m === 'charcoal' || m === 'visor' || m === 'ink' || m === 'petrol' || m === 'speck';
        if ((dir === 'l' || dir === 't') && !darkMat && opts.selout !== false) c = RGB[m][3];
        extra.push([i, c]);
      }
    }
    for (const [i, c] of extra) {
      out[i * 4] = c[0]; out[i * 4 + 1] = c[1]; out[i * 4 + 2] = c[2]; out[i * 4 + 3] = 255;
    }
  }

  // Anclas en pantalla
  const anchors = {};
  for (const [k, [bone, p]] of Object.entries(ANCHORS)) {
    const bw = world[BONE_INDEX[bone]];
    const wp = add3(bw.t, apply(bw.R, p));
    anchors[k] = [Math.round(cx + wp[0] * s), Math.round(ground - wp[1] * s), Math.round(wp[2])];
  }
  return { w: W, h: H, data: out, anchors };
}
