// Moki HD: el mismo modelo, esqueleto y materiales de Moki Pixel, en alta resolución.
// Sombreado suave con la paleta canon, fibra de papel, oclusión de contacto, borde de recorte
// y sombra en el piso. Decals (parche MOKI, emblema de mando) redibujados en vector para HD.
// Canon: el parche vive solo en la oreja derecha anatómica (x negativa) y nunca se espeja,
// porque las vistas salen de rotar el modelo, igual que en el kit pixel.
// Corre igual en Node y en navegador (sin dependencias).
import { apply, applyT } from '../core/math.js';
import { BONES, buildPrims } from '../core/model.js';
import { RAMPS, OUTLINE, hexToRgb } from '../core/palette.js';
import { propPrims } from '../core/props.js';
import { solvePose, primDist, primBound } from '../core/render.js';

const BASE_PRIMS = buildPrims();
const BONE_INDEX = Object.fromEntries(BONES.map((b, i) => [b.name, i]));
const RGB = {};
for (const [k, r] of Object.entries(RAMPS)) RGB[k] = r.map(hexToRgb);
const INK = hexToRgb(OUTLINE);
const LIGHT = norm([-0.55, 0.62, 0.56]);

function norm(v) { const l = Math.hypot(v[0], v[1], v[2]); return [v[0] / l, v[1] / l, v[2] / l]; }
const add3 = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const mix = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
const sstep = (a, b, x) => { const t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

// ---------- Ruido de fibra de papel ----------
function h3(x, y, z) {
  let h = (x * 374761393 + y * 668265263 + z * 1274126177) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967295;
}
function vnoise(x, y, z) {
  const xi = Math.floor(x), yi = Math.floor(y), zi = Math.floor(z);
  const xf = x - xi, yf = y - yi, zf = z - zi;
  const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf), w = zf * zf * (3 - 2 * zf);
  let r = 0;
  for (let k = 0; k < 8; k++) {
    const dx = k & 1, dy = (k >> 1) & 1, dz = (k >> 2) & 1;
    const wgt = (dx ? u : 1 - u) * (dy ? v : 1 - v) * (dz ? w : 1 - w);
    r += wgt * h3(xi + dx, yi + dy, zi + dz);
  }
  return r;
}
// Grano de cartón: manchitas finas + fibras estiradas en x.
function paperGrain(p) {
  const fine = vnoise(p[0] / 3.5, p[1] / 3.5, p[2] / 3.5);
  const mid = vnoise(p[0] / 11, p[1] / 11, p[2] / 11);
  const fiber = vnoise(p[0] / 30, p[1] / 2.6, p[2] / 30);
  return (fine - 0.5) * 0.09 + (mid - 0.5) * 0.06 + (fiber - 0.5) * 0.06;
}

// ---------- Decals HD (vector 2D) ----------
const seg = (x, y, ax, ay, bx, by) => {
  const px = x - ax, py = y - ay, vx = bx - ax, vy = by - ay;
  const t = Math.max(0, Math.min(1, (px * vx + py * vy) / (vx * vx + vy * vy)));
  return Math.hypot(px - vx * t, py - vy * t);
};
// Letras de palo en caja 1x1 (u derecha, v abajo). Trazo redondeado tipo rotulador.
const GLYPHS = {
  M: [[0, 1, 0, 0], [0, 0, 0.5, 0.62], [0.5, 0.62, 1, 0], [1, 0, 1, 1]],
  O: 'O',
  K: [[0, 0, 0, 1], [1, 0, 0.05, 0.55], [0.32, 0.4, 1, 1]],
  I: [[0.5, 0, 0.5, 1]],
};
function textDist(u, v) {
  // MOKI en una fila: anchos M 1, O 0.95, K 0.85, I 0.3, separación 0.42
  const layout = [['M', 0, 1], ['O', 1.42, 0.95], ['K', 2.79, 0.85], ['I', 4.06, 0.3]];
  const total = 4.36;
  const x = u * total, y = v;
  let d = 9;
  for (const [g, x0, w] of layout) {
    const gx = (x - x0) / w, gy = y;
    if (g === 'O') {
      const dx = (gx - 0.5) * w, dy = gy - 0.5;
      const e = Math.hypot(dx / (w * 0.5), dy / 0.5);
      d = Math.min(d, Math.abs(e - 1) * 0.5);
      continue;
    }
    for (const s of GLYPHS[g]) d = Math.min(d, seg(gx * w, gy, s[0] * w, s[1], s[2] * w, s[3]));
  }
  return d; // en unidades de altura de letra
}
// Parche MOKI: mismas coordenadas u,v que model.js (oreja derecha anatómica).
function patchHD(qx, qy, qz) {
  if (qx >= -168) return null;
  const u = (qz - (-48 - 92)) / 184;
  const v = (qy - (104 + 36)) / -72;
  if (u < 0 || u >= 1 || v < 0 || v >= 1) return null;
  if (u < 0.025 || u > 0.975 || v < 0.06 || v > 0.94) return 'kraft';
  const tu = (u - 0.1) / 0.8, tv = (v - 0.2) / 0.6;
  if (tu >= -0.05 && tu <= 1.05 && tv >= -0.1 && tv <= 1.1 && textDist(tu, tv) < 0.11) return 'ink';
  return 'label';
}
// Emblema de mando en el pecho: mismas coordenadas que model.js, dibujado en vector.
const EMB = { cx: 0, cy: 165, hw: 70, hh: 40 };
function emblemHD(p) {
  if (p[2] <= 30) return null;
  const u = (p[0] - (EMB.cx - EMB.hw)) / (EMB.hw * 2);
  const v = (EMB.cy + EMB.hh - p[1]) / (EMB.hh * 2);
  if (u < 0 || u >= 1 || v < 0 || v >= 1) return null;
  // Visto de frente, +x anatómico queda a la derecha de la pantalla: x de pantalla = 1 - u.
  const x = (1 - u) * 1.75, y = v; // caja 1.75 x 1
  // Silueta de control: rectángulo redondeado con dos asas
  const body = (() => {
    const bx = Math.abs(x - 0.875) - 0.6, by = Math.abs(y - 0.42) - 0.2;
    const box = Math.hypot(Math.max(bx, 0), Math.max(by, 0)) + Math.min(Math.max(bx, by), 0) - 0.12;
    const gl = Math.hypot(x - 0.42, y - 0.68) - 0.2, gr = Math.hypot(x - 1.33, y - 0.68) - 0.2;
    return Math.min(box, gl, gr);
  })();
  const line = Math.abs(body) < 0.045;
  // Cruceta a la izquierda (en pantalla), dos botones a la derecha: asimétrico, nunca una cara.
  const cross = (Math.abs(x - 0.5) < 0.04 && Math.abs(y - 0.45) < 0.15) || (Math.abs(y - 0.45) < 0.04 && Math.abs(x - 0.5) < 0.15);
  const b1 = Math.hypot(x - 1.2, y - 0.38) < 0.06, b2 = Math.hypot(x - 1.36, y - 0.5) < 0.06;
  if (line || cross || b1 || b2) return 'ink';
  return 'cream';
}

function hdMaterial(pr, lp, ctx) {
  let m = pr.mat(lp, ctx) || 'orange';
  if (pr.layer === 'helmet') {
    const pm = patchHD(lp[0], lp[1] - 228, lp[2]);
    if (pm) return pm;
    if (m === 'speck') m = 'visor';
  } else if (pr.layer === 'torso' && pr.bone === 'spine') {
    const em = emblemHD(lp);
    if (em) return em;
  }
  return m;
}

// ---------------- Render HD ----------------
// opts: { w, h, s (px por unidad), ground (y del piso en px), cx, ss (supersampling 1-3), shadow, outline }
export function renderPoseHD(pose = {}, opts = {}) {
  const W = opts.w || 512, H = opts.h || 512;
  const ss = Math.max(1, Math.min(3, opts.ss || 2));
  const s = (opts.s || 0.4) * ss;
  const IW = W * ss, IH = H * ss;
  const ground = (opts.ground ?? H - 20) * ss;
  const cx = (opts.cx ?? W / 2) * ss;
  const ctx = { px: 0.6, detail: 2 };

  const world = solvePose(pose);
  const prims = BASE_PRIMS.concat(propPrims(pose.props || [])).filter((p) => !(opts.hide && opts.hide.has(p.layer)));
  const live = [];
  for (const pr of prims) {
    const bw = world[BONE_INDEX[pr.bone]];
    if (!bw) continue;
    const [bc, br] = primBound(pr);
    const wc = add3(bw.t, apply(bw.R, bc));
    const R = br + 2;
    live.push({
      pr, R: bw.R, t: bw.t,
      x0: Math.floor(cx + (wc[0] - R) * s) - 1, x1: Math.ceil(cx + (wc[0] + R) * s) + 1,
      y0: Math.floor(ground - (wc[1] + R) * s) - 1, y1: Math.ceil(ground - (wc[1] - R) * s) + 1,
      ztop: wc[2] + R, zbot: wc[2] - R,
    });
  }
  const local = (lv, x, y, z) => applyT(lv.R, [x - lv.t[0], y - lv.t[1], z - lv.t[2]]);
  const sceneD = (cands, x, y, z) => {
    let best = 1e9, bi = -1;
    for (let i = 0; i < cands.length; i++) {
      const lv = cands[i];
      if (z > lv.ztop + 4 || z < lv.zbot - 4) { const dz = z > lv.ztop ? z - lv.ztop : lv.zbot - z; if (dz < best) best = dz; continue; }
      const p = local(lv, x, y, z);
      const d = primDist(lv.pr, p[0], p[1], p[2]);
      if (d < best) { best = d; bi = i; }
    }
    return [best, bi];
  };

  const N = IW * IH;
  const col = new Float32Array(N * 3);
  const hitMask = new Uint8Array(N);
  const depth = new Float32Array(N).fill(-1e9);
  const layer = new Int16Array(N).fill(-1);
  const layerId = new Map();

  // Rejilla de candidatos por bloques de 8 px para no recorrer todas las piezas por pixel.
  const B = 8;
  const bw = Math.ceil(IW / B), bh = Math.ceil(IH / B);
  const blocks = new Array(bw * bh);
  for (let by = 0; by < bh; by++) for (let bx = 0; bx < bw; bx++) {
    const x0 = bx * B, y0 = by * B, x1 = x0 + B - 1, y1 = y0 + B - 1;
    blocks[by * bw + bx] = live.filter((lv) => lv.x1 >= x0 && lv.x0 <= x1 && lv.y1 >= y0 && lv.y0 <= y1);
  }

  for (let py = 0; py < IH; py++) {
    for (let pxi = 0; pxi < IW; pxi++) {
      const bc = blocks[((py / B) | 0) * bw + ((pxi / B) | 0)];
      if (!bc.length) continue;
      const cands = [];
      for (const lv of bc) if (pxi >= lv.x0 && pxi <= lv.x1 && py >= lv.y0 && py <= lv.y1) cands.push(lv);
      if (!cands.length) continue;
      const X = (pxi + 0.5 - cx) / s, Y = (ground - (py + 0.5)) / s;
      let z = -1e9, zmin = 1e9;
      for (const c of cands) { if (c.ztop > z) z = c.ztop; if (c.zbot < zmin) zmin = c.zbot; }
      let hit = -1;
      for (let it = 0; it < 120 && z > zmin; it++) {
        const [d, bi] = sceneD(cands, X, Y, z);
        if (d < 0.35) { hit = bi; break; }
        z -= Math.max(d * 0.9, 0.3);
      }
      if (hit < 0) continue;
      // Refinar al borde real de la superficie (evita anillos por profundidad cuantizada)
      for (let r = 0; r < 8; r++) {
        const [d, bi] = sceneD(cands, X, Y, z);
        if (bi >= 0) hit = bi;
        if (Math.abs(d) < 0.02) break;
        z -= d;
      }
      const e = 0.5;
      const nx = sceneD(cands, X + e, Y, z)[0] - sceneD(cands, X - e, Y, z)[0];
      const ny = sceneD(cands, X, Y + e, z)[0] - sceneD(cands, X, Y - e, z)[0];
      const nz = sceneD(cands, X, Y, z + e)[0] - sceneD(cands, X, Y, z - e)[0];
      const nl = Math.hypot(nx, ny, nz) || 1;
      const n = [nx / nl, ny / nl, nz / nl];
      const lv = cands[hit];
      const lp = local(lv, X, Y, z);
      const m = hdMaterial(lv.pr, lp, ctx);
      const ramp = RGB[m] || RGB.orange;
      // Papel mate: rampa canon sombra → base → luz, sin brillo especular ni luz de borde.
      const lam = n[0] * LIGHT[0] + n[1] * LIGHT[1] + n[2] * LIGHT[2];
      let c;
      if (m === 'ink') c = ramp[1];
      else {
        c = mix(ramp[3], ramp[2], sstep(-0.9, -0.45, lam));
        c = mix(c, ramp[1], sstep(-0.4, 0.15, lam));
        c = mix(c, ramp[0], sstep(0.55, 1.0, lam) * 0.55);
      }
      // Sombra de contacto solo entre piezas distintas (brazo sobre torso, casco sobre cuerpo).
      // Una pieza no se ocluye a sí misma: así no salen anillos en superficies convexas.
      let occ = 0;
      const own = lv.pr.layer;
      for (let k = 1; k <= 3; k++) {
        const dd = k * 14;
        const qx = X + n[0] * dd, qy = Y + n[1] * dd, qz = z + n[2] * dd;
        let dv = 1e9;
        for (const o of live) {
          if (o.pr.layer === own) continue;
          const q = local(o, qx, qy, qz);
          const d = primDist(o.pr, q[0], q[1], q[2]);
          if (d < dv) dv = d;
        }
        occ += Math.max(0, Math.min(1, (dd - dv) / dd)) / k;
      }
      const ao = Math.max(0.6, 1 - occ * 0.55);
      const g = m === 'ink' ? 0 : paperGrain(lp);
      const f = ao * (1 + g);
      const i = py * IW + pxi;
      col[i * 3] = Math.min(255, c[0] * f);
      col[i * 3 + 1] = Math.min(255, c[1] * f);
      col[i * 3 + 2] = Math.min(255, c[2] * f);
      hitMask[i] = 1; depth[i] = z;
      if (!layerId.has(lv.pr.layer)) layerId.set(lv.pr.layer, layerId.size);
      layer[i] = layerId.get(lv.pr.layer);
    }
  }

  // Líneas de traslape suaves (pieza cercana sobre lejana): papel encimado.
  const lineW = Math.max(1, Math.round(1.1 * ss));
  for (let py = 0; py < IH; py++) for (let x = 0; x < IW; x++) {
    const i = py * IW + x;
    if (!hitMask[i]) continue;
    let near = 0;
    for (let r = 1; r <= lineW && !near; r++) {
      for (const [dx, dy] of [[r, 0], [-r, 0], [0, r], [0, -r]]) {
        const xx = x + dx, yy = py + dy;
        if (xx < 0 || yy < 0 || xx >= IW || yy >= IH) continue;
        const j = yy * IW + xx;
        if (hitMask[j] && depth[j] - depth[i] > 45 && layer[j] !== layer[i]) { near = 1; break; }
      }
    }
    if (near) { col[i * 3] *= 0.62; col[i * 3 + 1] *= 0.6; col[i * 3 + 2] *= 0.58; }
  }

  // Contorno exterior de recorte (tinta cálida), grosor ~1.6 px de salida.
  const outW = opts.outline === false ? 0 : Math.max(1, Math.round(1.6 * ss));
  const outline = new Uint8Array(N);
  if (outW) {
    for (let py = 0; py < IH; py++) for (let x = 0; x < IW; x++) {
      const i = py * IW + x;
      if (hitMask[i]) continue;
      let found = false;
      for (let dy = -outW; dy <= outW && !found; dy++) for (let dx = -outW; dx <= outW; dx++) {
        if (dx * dx + dy * dy > outW * outW) continue;
        const xx = x + dx, yy = py + dy;
        if (xx < 0 || yy < 0 || xx >= IW || yy >= IH) continue;
        if (hitMask[yy * IW + xx]) { found = true; break; }
      }
      if (found) outline[i] = 1;
    }
  }

  // Sombra de contacto en el piso (elipse suave bajo el centro del cuerpo)
  const hips = world[BONE_INDEX.hips].t;
  const lift = Math.max(0, pose.root ? pose.root[1] : 0);
  const shX = cx + hips[0] * s, shY = ground, shRx = 230 * s * (1 - Math.min(0.5, lift / 600)), shRy = 34 * s;
  const shA = opts.shadow === false ? 0 : 0.28 * (1 - Math.min(0.7, lift / 500));

  // Bajar a resolución de salida (promedio por caja = antialias)
  const out = new Uint8ClampedArray(W * H * 4);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    let r = 0, g = 0, b = 0, a = 0;
    for (let sy = 0; sy < ss; sy++) for (let sx = 0; sx < ss; sx++) {
      const X = x * ss + sx, Y = y * ss + sy, i = Y * IW + X;
      if (hitMask[i]) { r += col[i * 3]; g += col[i * 3 + 1]; b += col[i * 3 + 2]; a += 1; }
      else if (outline[i]) { r += INK[0]; g += INK[1]; b += INK[2]; a += 1; }
      else if (shA) {
        const ex = (X + 0.5 - shX) / shRx, ey = (Y + 0.5 - shY) / shRy;
        const d = ex * ex + ey * ey;
        if (d < 1) { const sa = shA * (1 - d) * (1 - d); r += 40 * sa; g += 30 * sa; b += 20 * sa; a += sa; }
      }
    }
    const k = ss * ss;
    const o = (y * W + x) * 4;
    if (a > 0) { out[o] = r / a; out[o + 1] = g / a; out[o + 2] = b / a; out[o + 3] = Math.round((a / k) * 255); }
  }
  return { w: W, h: H, data: out };
}
