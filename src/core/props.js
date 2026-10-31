// Props: objetos que Moki sostiene o usa. Son piezas aparte del emblema del pecho (C04).
// Se cuelgan de los sockets propL/propR (mano izquierda/derecha anatómica).
const solid = (m) => () => m;

function gamepadMat(p) {
  // botones y cruceta en la cara superior (y local > 18)
  if (p[1] > 14) {
    if (Math.abs(p[0] + 52) < 10 && Math.abs(p[2]) < 26) return 'ink';
    if (Math.abs(p[2]) < 10 && Math.abs(p[0] + 52) < 26) return 'ink';
    if (Math.hypot(p[0] - 50, p[2] - 12) < 11) return 'orange';
    if (Math.hypot(p[0] - 70, p[2] + 8) < 11) return 'amber';
  }
  return 'cream';
}

function laptopScreenMat(p) {
  // Pantalla: cara frontal (z > 0) de la tapa
  if (p[2] > 4 && Math.abs(p[0]) < 120 && p[1] > 14 && p[1] < 150) {
    const line = Math.floor((p[1] - 20) / 22);
    if (line >= 0 && line < 5 && (p[0] + 100) < 40 + ((line * 37) % 140)) return 'screenOn';
    return 'screen';
  }
  return 'kraft';
}

function crateMat(p) {
  // cartón con cinta crema en cruz
  if (Math.abs(p[0]) < 16 || Math.abs(p[1] - 150) < 16) return 'cream';
  return 'kraft';
}

export const PROPS = {
  // Control genérico sostenido con dos manos (va en la mano derecha; la izquierda lo alcanza)
  gamepad: [
    { bone: 'propR', type: 'rbox', c: [-80, 10, 10], h: [125, 26, 62], k: 24, mat: gamepadMat },
    { bone: 'propR', type: 'ellipsoid', c: [-175, 0, 0], r: [52, 34, 58], mat: solid('cream') },
    { bone: 'propR', type: 'ellipsoid', c: [15, 0, 0], r: [52, 34, 58], mat: solid('cream') },
  ],
  // Laptop de cartón (en el suelo frente a Moki, anclada al root)
  laptop: [
    { bone: 'root', type: 'rbox', c: [0, 18, 260], h: [150, 18, 105], k: 10, mat: solid('kraft') },
    { bone: 'root', type: 'rbox', c: [0, 110, 168], h: [150, 100, 12], k: 8, mat: laptopScreenMat, flipY: true },
  ],
  // Martillo (mano derecha)
  hammer: [
    { bone: 'propR', type: 'capsule', a: [0, 40, -10], b: [0, -150, -10], r: 18, mat: solid('wood') },
    { bone: 'propR', type: 'rbox', c: [0, -175, -10], h: [36, 34, 85], k: 12, mat: solid('steel') },
  ],
  // Bolas de malabar: la pose decide su posición mediante offsets del root
  ball1: [{ bone: 'root', type: 'sphere', c: [0, 900, 160], rad: 42, mat: solid('orange'), dyn: 'ball1' }],
  ball2: [{ bone: 'root', type: 'sphere', c: [0, 900, 160], rad: 42, mat: solid('cream'), dyn: 'ball2' }],
  ball3: [{ bone: 'root', type: 'sphere', c: [0, 900, 160], rad: 42, mat: solid('amber'), dyn: 'ball3' }],
  // Bandera de logro (mano izquierda)
  flag: [
    { bone: 'propL', type: 'capsule', a: [0, 60, 0], b: [0, -230, 0], r: 12, mat: solid('kraft') },
    { bone: 'propL', type: 'rbox', c: [0, -180, 80], h: [8, 55, 80], k: 4, mat: solid('orange') },
  ],
  // Taza de café (mano derecha)
  mug: [
    { bone: 'propR', type: 'cylY', c: [0, 0, 0], r: 46, y0: -40, y1: 60, mat: solid('cream') },
    { bone: 'propR', type: 'cylZ', c: [52, 10, 0], r: 26, z0: -8, z1: 8, mat: solid('cream') },
  ],
  // Hilo para colgar (de la mochila hacia arriba)
  string: [{ bone: 'pack', type: 'capsule', a: [0, 100, -60], b: [0, 1400, -60], r: 7, mat: solid('kraft') }],
  // Caja grande para empujar
  crate: [{ bone: 'root', type: 'rbox', c: [0, 150, 400], h: [140, 150, 110], k: 14, mat: crateMat }],
  // Bloque de nivel (para construir), anclado al root
  block: [{ bone: 'root', type: 'rbox', c: [0, 60, 300], h: [80, 60, 80], k: 10, mat: solid('kraft') }],
};

// Devuelve primitivas activas. props: ['gamepad', {name:'ball1', at:[x,y,z]}, ...]
export function propPrims(list) {
  const out = [];
  for (const it of list) {
    const name = typeof it === 'string' ? it : it.name;
    const def = PROPS[name];
    if (!def) continue;
    for (const d of def) {
      const pr = { ...d, layer: 'prop_' + name };
      if (typeof it === 'object' && it.at && pr.type === 'sphere') pr.c = it.at;
      if (typeof it === 'object' && it.off) {
        const o = it.off, sh = (v) => [v[0] + o[0], v[1] + o[1], v[2] + o[2]];
        if (pr.c) pr.c = sh(pr.c);
        if (pr.a) { pr.a = sh(pr.a); pr.b = sh(pr.b); }
        if (pr.x0 !== undefined) { pr.x0 += o[0]; pr.x1 += o[0]; }
        if (pr.y0 !== undefined) { pr.y0 += o[1]; pr.y1 += o[1]; }
        if (pr.z0 !== undefined) { pr.z0 += o[2]; pr.z1 += o[2]; }
      }
      out.push(pr);
    }
  }
  return out;
}
