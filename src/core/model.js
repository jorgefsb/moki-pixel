// Modelo proxy de Moki para render pixel art.
// Unidades: H = 1000 u (suela a corona), según Moki Production Brief 0.1 (P01, propuesto).
// Ejes locales del personaje: +x = IZQUIERDA anatómica, +y = arriba, +z = frente.
// (Así la matriz de giro es una rotación pura y nunca hay espejo.)
// Lado derecho anatómico = x negativa. El parche MOKI vive solo ahí (canon C03, aprobado).

export const SIDE = { L: 1, R: -1 };

// ---------- Bitmaps de decals (se leen sobre la superficie, nunca se espejan) ----------
// MOKI en 15x5: M(5) O(3) K(3) I(1) con 1 px de aire.
const MOKI = [
  '10001.111.101.1',
  '11011.101.101.1',
  '10101.101.110.1',
  '10001.101.101.1',
  '10001.111.101.1',
];

// Emblema de mando a 128 px (14x8, 1 pixel de bitmap = 1 pixel de pantalla de frente)
const GAMEPAD = [
  '..............',
  '..##########..',
  '.#..#.....#.#.',
  '.#.###...#.##.',
  '.#..#.....#.#.',
  '.#..........#.',
  '..###....###..',
  '..............',
];
// A 64 px (7x4): cruceta a la izquierda, botones a la derecha; asimétrico para que no lea como cara
const GAMEPAD_S = [
  '.#.....',
  '###..#.',
  '.#..#..',
  '.......',
];

function bitAt(rows, u, v) {
  if (u < 0 || u >= 1 || v < 0 || v >= 1) return false;
  const r = rows[Math.floor(v * rows.length)];
  const ch = r[Math.floor(u * r.length)];
  return ch === '1' || ch === '#';
}

// ---------- Esqueleto (posición de reposo en el espacio del padre) ----------
// rest: rotación de reposo; side: 1 izq, -1 der (las rotaciones se espejan para que
// los mismos números produzcan poses simétricas).
export const BONES = [
  { name: 'root', parent: null, offset: [0, 0, 0] },
  { name: 'hips', parent: 'root', offset: [0, 265, 0] },
  { name: 'spine', parent: 'hips', offset: [0, 5, 0] },
  { name: 'head', parent: 'spine', offset: [0, 270, 0] },
  { name: 'pack', parent: 'spine', offset: [0, 140, -100] },
  { name: 'armL', parent: 'spine', offset: [178, 200, 0], side: 1, rest: [0, 0, 10] },
  { name: 'foreL', parent: 'armL', offset: [0, -112, 0], side: 1 },
  { name: 'handL', parent: 'foreL', offset: [0, -96, 0], side: 1 },
  { name: 'armR', parent: 'spine', offset: [-178, 200, 0], side: -1, rest: [0, 0, 10] },
  { name: 'foreR', parent: 'armR', offset: [0, -112, 0], side: -1 },
  { name: 'handR', parent: 'foreR', offset: [0, -96, 0], side: -1 },
  { name: 'thighL', parent: 'hips', offset: [88, 0, 0], side: 1 },
  { name: 'shinL', parent: 'thighL', offset: [0, -90, 0], side: 1 },
  { name: 'footL', parent: 'shinL', offset: [0, -75, 0], side: 1 },
  { name: 'thighR', parent: 'hips', offset: [-88, 0, 0], side: -1 },
  { name: 'shinR', parent: 'thighR', offset: [0, -90, 0], side: -1 },
  { name: 'footR', parent: 'shinR', offset: [0, -75, 0], side: -1 },
  // Sockets para props (hijos de la mano, no deforman)
  { name: 'propL', parent: 'handL', offset: [0, -42, 30], side: 1 },
  { name: 'propR', parent: 'handR', offset: [0, -42, 30], side: -1 },
];

// ---------- Materiales por pieza ----------
// Cada función recibe el punto local p (espacio del hueso), y ctx { px: tamaño de pixel en u }.
// Visor: calcomanía sobre el casco (envuelve la curvatura, se ve en perfil como en la referencia)
const VISOR_C = [0, 205, 0];
const VISOR_R = [222, 125];
const HELM_C = [0, 228, 0];
const HELM_R = [262, 232, 220];

function visorField(p) {
  const x = (p[0] - VISOR_C[0]) / VISOR_R[0];
  const y = (p[1] - VISOR_C[1]) / VISOR_R[1];
  return Math.sqrt(x * x + y * y);
}
function helmetMat(p, ctx) {
  const qx = p[0] - HELM_C[0], qy = p[1] - HELM_C[1], qz = p[2] - HELM_C[2];
  // Visor y su borde de papel (solo hemisferio frontal)
  if (p[2] > 30) {
    const vd = visorField(p);
    if (vd < 1) return visorMat(p, ctx);
    const rimOuter = 1 + 34 / VISOR_R[1];
    if (vd < rimOuter + (ctx.px * 0.9) / VISOR_R[1] && vd >= rimOuter && ctx.detail > 0) return 'kraft';
    if (vd < rimOuter) return 'cream';
  }
  const inRim = false;
  // Parche MOKI: lado derecho anatómico (x negativa), sobre la orejera.
  if (qx < -168) {
    const u = (qz - (-48 - 92)) / 184; // hacia el frente = derecha en pantalla mirando a la derecha
    const v = (qy - (104 + 36)) / -72;
    if (u >= 0 && u < 1 && v >= 0 && v < 1) {
      const edge = ctx.px / 184;
      if (u < edge || u > 1 - edge || v < ctx.px / 72 || v > 1 - ctx.px / 72) return 'kraft';
      if (ctx.detail > 1) {
        // texto con margen
        const tu = (u - 0.08) / 0.84, tv = (v - 0.12) / 0.76;
        if (bitAt(MOKI, tu, tv)) return 'ink';
      } else if (ctx.detail === 1) {
        // a 64 px el texto se sugiere con dos trazos de tinta
        if (v > 0.3 && v < 0.7 && ((u > 0.18 && u < 0.42) || (u > 0.55 && u < 0.82))) return 'ink';
      }
      return 'label';
    }
  }
  if (!inRim && Math.abs(qx) < 60) return 'orange';
  return 'cream';
}

function visorMat(p, ctx) {
  const x = (p[0] - VISOR_C[0]) / VISOR_R[0];
  const y = (p[1] - VISOR_C[1]) / VISOR_R[1];
  // Brillo de papel recortado en el lado izquierdo anatómico (+x), arriba. Nunca es un ojo.
  const hx = (x - 0.48) / 0.19, hy = (y - 0.38) / 0.24;
  if (hx * hx + hy * hy < 1) return 'visorHi';
  // A 64 px las motas solo van en la mitad baja del visor: dos motas alineadas arriba leerían como ojos (C06).
  if (ctx.detail === 1 && y > -0.25) return 'visor';
  if (speck(p, ctx, ctx.detail === 1 ? 0.05 : 0.03)) return 'speck';
  return 'visor';
}

function earcupMat(side) {
  return (p, ctx) => {
    const ax = p[0] * side; // hacia afuera
    const r = Math.hypot(p[1] - 205, p[2] + 5);
    if (ax > 300 - ctx.px * 0.5) {
      if (r < 44) return 'orange';
      if (r < 76) return 'charcoal';
      return 'cream';
    }
    if (ax > 285) return 'cream';
    return 'charcoal';
  };
}

const EMBLEM = { cx: 0, cy: 165, hw: 70, hh: 40 };
function torsoMat(p, ctx) {
  const ax = Math.abs(p[0]);
  // Cinturón y hebilla (arnés petróleo, hebilla crema)
  if (Math.abs(p[1] - 62) < 24) {
    if (p[2] > 40 && ax < 44) return Math.abs(p[1] - 62) < 24 - ctx.px ? 'cream' : 'kraft';
    return 'petrol';
  }
  // Emblema de mando fijo en el pecho (C04). Bitmap sin espejo: +x (izq anatómica) = derecha en pantalla de frente.
  if (p[2] > 30) {
    const u = (p[0] - (EMBLEM.cx - EMBLEM.hw)) / (EMBLEM.hw * 2);
    const v = (EMBLEM.cy + EMBLEM.hh - p[1]) / (EMBLEM.hh * 2);
    if (u >= 0 && u < 1 && v >= 0 && v < 1) {
      if (ctx.detail > 0) {
        const uu = 1 - u; // el bitmap se escribe de izquierda a derecha visto de frente
        if (bitAt(ctx.detail > 1 ? GAMEPAD : GAMEPAD_S, uu, v)) return 'ink';
      }
      return 'cream';
    }
  }
  // Tirantes del arnés (pasan sobre hombros, frente y espalda)
  if (p[1] > 62 && Math.abs(ax - 96) < 24) return 'petrol';
  return 'orange';
}

function packMat(p, ctx) {
  // caja centrada en (0,0,-55)
  const z = p[2] + 55;
  if (z < -40 && Math.abs(p[0]) < 72 && Math.abs(p[1]) < 62) {
    return Math.hypot(p[0], p[1] + 6) < 24 ? 'charcoal' : 'cream';
  }
  if (Math.abs(p[0]) > 100 && Math.abs(z) < 34 && Math.abs(p[1]) < 58) {
    return Math.hypot(z, p[1]) < 21 ? 'charcoal' : 'cream';
  }
  return 'petrol';
}

function upperArmMat(side) {
  return (p) => {
    const out = p[0] * side;
    const d = Math.hypot(p[1] + 18, p[2]);
    if (out > 20 && d < 36) return d < 18 ? 'charcoal' : 'cream';
    return 'orange';
  };
}

function shinMat(p) {
  if (p[2] > 12 && Math.hypot(p[0], p[1] - 4) < 58) return 'cream';
  return 'orange';
}

function bootMat(p, ctx) {
  if (p[1] < -48 - 52 + 26) return 'cream';
  if (speck(p, ctx, 0.04)) return 'speck';
  return 'charcoal';
}

function speck(p, ctx, cov) {
  if (ctx.detail < 1) return false;
  const c = ctx.px * (ctx.detail > 1 ? 1.4 : 1.0);
  return hashCell(Math.floor(p[0] / c), Math.floor(p[1] / c), Math.floor(p[2] / c)) < cov;
}
function hashCell(x, y, z) {
  let h = (x * 374761393 + y * 668265263 + z * 1274126177) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967295;
}

const solid = (m) => () => m;

// ---------- Primitivas por hueso ----------
// type: ellipsoid {c, r} · rbox {c, h, k} · capsule {a, b, r} · cylX {c, r, x0, x1} · cylY {c, r, y0, y1}
export function buildPrims() {
  const P = [];
  const add = (bone, type, params, mat, layer) => P.push({ bone, type, ...params, mat, layer: layer || bone });

  // Cabeza / casco (rígido: nunca se aplasta)
  add('head', 'ellipsoid', { c: HELM_C, r: HELM_R }, helmetMat, 'helmet');
  add('head', 'cylX', { c: [0, 205, -5], r: 98, x0: 200, x1: 318 }, earcupMat(1), 'earL');
  add('head', 'cylX', { c: [0, 205, -5], r: 98, x0: -318, x1: -200 }, earcupMat(-1), 'earR');

  // Torso, cadera, mochila
  add('spine', 'rbox', { c: [0, 128, 0], h: [150, 124, 100], k: 82 }, torsoMat, 'torso');
  add('hips', 'rbox', { c: [0, 28, 0], h: [148, 52, 94], k: 50 }, solid('orange'), 'torso');
  add('pack', 'rbox', { c: [0, 0, -55], h: [122, 102, 56], k: 26 }, packMat, 'pack');

  for (const s of ['L', 'R']) {
    const sd = SIDE[s];
    add('arm' + s, 'capsule', { a: [0, 0, 0], b: [0, -112, 0], r: 50 }, upperArmMat(sd), 'arm' + s);
    add('fore' + s, 'capsule', { a: [0, 0, 0], b: [0, -86, 0], r: 46 }, solid('orange'), 'arm' + s);
    add('fore' + s, 'cylY', { c: [0, 0, 0], r: 54, y0: -100, y1: -66 }, solid('cream'), 'arm' + s);
    add('hand' + s, 'ellipsoid', { c: [0, -40, 4], r: [56, 60, 54] }, solid('charcoal'), 'hand' + s);
    add('hand' + s, 'ellipsoid', { c: [-sd * 30, -26, 44], r: [24, 30, 24] }, solid('charcoal'), 'hand' + s);
    add('thigh' + s, 'capsule', { a: [0, 0, 0], b: [0, -90, 0], r: 70 }, solid('orange'), 'leg' + s);
    add('shin' + s, 'capsule', { a: [0, 0, 0], b: [0, -70, 0], r: 64 }, shinMat, 'leg' + s);
    add('foot' + s, 'rbox', { c: [0, -48, 30], h: [98, 52, 118], k: 44 }, bootMat, 'foot' + s);
  }
  return P;
}

// Puntos de anclaje exportados por cuadro (para juegos: emotes, props, partículas).
export const ANCHORS = {
  head_top: ['head', [0, 470, 0]],
  visor: ['head', [0, 205, 230]],
  hand_L: ['handL', [0, -40, 4]],
  hand_R: ['handR', [0, -40, 4]],
  chest: ['spine', [0, 165, 100]],
  pack: ['pack', [0, 0, -110]],
  foot_L: ['footL', [0, -100, 30]],
  foot_R: ['footR', [0, -100, 30]],
  root: ['root', [0, 0, 0]],
};
