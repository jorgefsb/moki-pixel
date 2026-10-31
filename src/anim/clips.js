// Biblioteca de animaciones de Moki.
// Canon (Moki Production Brief 0.1, acting): el visor no tiene rostro; Moki actúa con
// inclinación del casco, dirección del torso, gesto de manos, apoyo de pies y ritmo.
// Casco y texto rígidos; aplastamiento de cuerpo ≤ 3 %. Mochila con 2-3 cuadros de retraso.
//
// Convenciones (grados): brazos/piernas rx<0 = hacia el frente; rz>0 = abre hacia afuera.
// Cabeza rx>0 = mira abajo; ry>0 = gira a su izquierda; rz>0 = ladea hacia su derecha.
// Root: [x izq, y arriba, z frente] en unidades u (H = 1000).

const S = Math.sin, C = Math.cos, TAU = Math.PI * 2;
const pos = (v) => Math.max(0, v);

// Posturas reutilizables
const STAND = {};
const SIT = {
  root: [0, -168, -20],
  thighL: [-86, 0, 4], thighR: [-86, 0, 4],
  shinL: [8, 0, 0], shinR: [8, 0, 0],
  footL: [72, 0, 0], footR: [72, 0, 0],
  spine: [-4, 0, 0],
};
const CROUCH = {
  root: [0, -60, 0], squash: 0.03,
  thighL: [-42, 0, 0], thighR: [-42, 0, 0],
  shinL: [78, 0, 0], shinR: [78, 0, 0],
  footL: [-36, 0, 0], footR: [-36, 0, 0],
  spine: [16, 0, 0], head: [-8, 0, 0],
};

function breathe(t, p, period = 2.4, amt = 1) {
  const b = S((t / period) * TAU);
  p.bones.spine[0] += 1.6 * b * amt;
  p.bones.head[0] -= 1.2 * b * amt;
  p.bones.armL[2] += 1.5 * b * amt;
  p.bones.armR[2] += 1.5 * b * amt;
  p.squash += 0.008 * b * amt;
}

export const CLIPS = {
  // ---------------- Locomoción ----------------
  idle: {
    group: 'locomocion', dur: 2.4, loop: true, facings: ['right', 'left', 'front', 'back'],
    note: 'Respiración sutil sin flotar (canon idle 2-4 s).',
    principles: ['slow-in-out', 'secundaria', 'timing', 'appeal'],
    fn: (t, p) => breathe(t, p, 2.4),
  },
  idle_look: {
    group: 'locomocion', dur: 3.6, loop: true, facings: ['right', 'left', 'front'],
    note: 'Mira a los lados con pausas: curiosidad sin rostro.',
    principles: ['anticipacion', 'slow-in-out', 'timing'],
    keys: [
      [0, {}],
      [0.5, {}],
      [0.85, { head: [-4, 22, 4], spine: [0, 6, 0] }, 'outBack'],
      [1.6, { head: [-4, 22, 4], spine: [0, 6, 0] }],
      [2.0, { head: [-2, -26, -6], spine: [0, -5, 0] }, 'outBack'],
      [2.9, { head: [-2, -26, -6], spine: [0, -5, 0] }],
      [3.3, { head: [0, 0, 0], spine: [0, 0, 0] }, 'inOut'],
      [3.6, {}],
    ],
    fn: (t, p) => breathe(t, p, 1.8, 0.7),
  },
  walk: {
    group: 'locomocion', dur: 1.0, loop: true, facings: ['right', 'left', 'front', 'back'], speed: 380,
    note: 'Ciclo de 1 s (canon). Contacto bajo, paso alto; brazos opuestos a piernas.',
    principles: ['arcos', 'timing', 'secundaria', 'squash'],
    events: [{ t: 0.25, name: 'step' }, { t: 0.75, name: 'step' }],
    fn: (t, p) => {
      const f = (t / 1.0) * TAU;
      const sf = S(f);
      p.bones.thighL[0] = -30 * sf;
      p.bones.thighR[0] = 30 * sf;
      p.bones.shinL[0] = 48 * pos(C(f)) ** 1.4;
      p.bones.shinR[0] = 48 * pos(-C(f)) ** 1.4;
      p.bones.footL[0] = -(p.bones.thighL[0] + p.bones.shinL[0]) * 0.9;
      p.bones.footR[0] = -(p.bones.thighR[0] + p.bones.shinR[0]) * 0.9;
      p.root[1] = 12 * C(2 * f);
      p.squash = -0.014 * C(2 * f);
      p.bones.hips[1] = 6 * sf;
      p.bones.spine[1] = -9 * sf;
      p.bones.spine[0] = 5;
      p.bones.head[0] = -3 - 2 * C(2 * f);
      p.bones.head[1] = 3 * sf;
      p.bones.armL[0] = 22 * sf;
      p.bones.armR[0] = -22 * sf;
      p.bones.foreL[0] = -18 - 14 * pos(-sf);
      p.bones.foreR[0] = -18 - 14 * pos(sf);
    },
  },
  run: {
    group: 'locomocion', dur: 0.6, loop: true, facings: ['right', 'left', 'front', 'back'], speed: 900,
    note: 'Ciclo 0.6 s (canon 0.5-0.7). Empuje y vuelo claros; torso adelantado.',
    principles: ['arcos', 'exageracion', 'squash', 'secundaria'],
    events: [{ t: 0.15, name: 'step' }, { t: 0.45, name: 'step' }],
    fn: (t, p) => {
      const f = (t / 0.6) * TAU;
      const sf = S(f);
      p.bones.thighL[0] = -42 * sf;
      p.bones.thighR[0] = 42 * sf;
      p.bones.shinL[0] = 20 + 80 * pos(C(f)) ** 1.2;
      p.bones.shinR[0] = 20 + 80 * pos(-C(f)) ** 1.2;
      p.bones.footL[0] = -(p.bones.thighL[0] + p.bones.shinL[0]) * 0.7;
      p.bones.footR[0] = -(p.bones.thighR[0] + p.bones.shinR[0]) * 0.7;
      p.root[1] = 26 * (1 - Math.abs(sf)) - 8;
      p.squash = 0.02 * Math.abs(sf) - 0.01;
      p.bones.spine[0] = 14;
      p.bones.spine[1] = -10 * sf;
      p.bones.hips[1] = 8 * sf;
      p.bones.head[0] = -12;
      p.bones.armL[0] = 46 * sf;
      p.bones.armR[0] = -46 * sf;
      p.bones.armL[2] = 8; p.bones.armR[2] = 8;
      p.bones.foreL[0] = -85;
      p.bones.foreR[0] = -85;
    },
  },

  // ---------------- Salto (con fases para plataformas) ----------------
  jump: {
    group: 'salto', dur: 1.15, loop: false, facings: ['right', 'left', 'front'],
    note: 'Anticipación → despegue → ápice → caída → aterrizaje (canon P10).',
    principles: ['anticipacion', 'squash', 'arcos', 'slow-in-out', 'follow-through'],
    events: [{ t: 0.24, name: 'takeoff' }, { t: 0.86, name: 'land' }],
    keys: [
      [0, {}],
      [0.2, { ...CROUCH, armL: [38, 0, 10], armR: [38, 0, 10], foreL: [-30, 0, 0], foreR: [-30, 0, 0] }, 'out'],
      [0.3, { root: [0, 140, 0], squash: -0.03, spine: [-4, 0, 0], head: [-6, 0, 0],
        thighL: [-6, 0, 0], thighR: [6, 0, 0], shinL: [10, 0, 0], shinR: [10, 0, 0], footL: [20, 0, 0], footR: [20, 0, 0],
        armL: [-150, 0, 20], armR: [-150, 0, 20], foreL: [-10, 0, 0], foreR: [-10, 0, 0] }, 'out'],
      [0.52, { root: [0, 430, 0], squash: 0, thighL: [-55, 0, 0], thighR: [-40, 0, 0], shinL: [85, 0, 0], shinR: [80, 0, 0],
        footL: [-20, 0, 0], footR: [-20, 0, 0], armL: [-120, 0, 40], armR: [-120, 0, 40] }, 'out'],
      [0.62, { root: [0, 445, 0] }, 'sine'],
      [0.84, { root: [0, 20, 0], thighL: [-14, 0, 0], thighR: [-8, 0, 0], shinL: [20, 0, 0], shinR: [18, 0, 0],
        footL: [-6, 0, 0], footR: [-6, 0, 0], armL: [-40, 0, 55], armR: [-40, 0, 55], spine: [-2, 0, 0] }, 'in'],
      [0.9, { ...CROUCH, root: [0, -52, 0], armL: [-10, 0, 40], armR: [-10, 0, 40] }, 'out'],
      [1.15, { root: [0, 0, 0], squash: 0, thighL: [0, 0, 0], thighR: [0, 0, 0], shinL: [0, 0, 0], shinR: [0, 0, 0],
        footL: [0, 0, 0], footR: [0, 0, 0], spine: [0, 0, 0], head: [0, 0, 0],
        armL: [0, 0, 4], armR: [0, 0, 4], foreL: [-10, 0, 0], foreR: [-10, 0, 0] }, 'settle'],
    ],
  },
  jump_rise: {
    group: 'salto', dur: 0.4, loop: true, facings: ['right', 'left', 'front'],
    note: 'Pose sostenida de subida para motores de plataformas.',
    principles: ['staging'],
    base: { thighL: [-50, 0, 0], thighR: [-30, 0, 0], shinL: [80, 0, 0], shinR: [60, 0, 0], footL: [-20, 0, 0], footR: [-20, 0, 0],
      armL: [-140, 0, 30], armR: [-140, 0, 30], head: [-8, 0, 0] },
    fn: (t, p) => { p.bones.armL[2] += 4 * S(t * TAU / 0.4); p.bones.armR[2] -= 4 * S(t * TAU / 0.4); },
  },
  jump_fall: {
    group: 'salto', dur: 0.4, loop: true, facings: ['right', 'left', 'front'],
    note: 'Caída: piernas buscando el suelo, brazos abiertos para equilibrio.',
    principles: ['secundaria', 'staging'],
    base: { thighL: [-16, 0, 0], thighR: [-6, 0, 0], shinL: [24, 0, 0], shinR: [14, 0, 0],
      armL: [-30, 0, 70], armR: [-30, 0, 70], foreL: [-20, 0, 0], foreR: [-20, 0, 0], head: [6, 0, 0] },
    fn: (t, p) => { const w = S(t * TAU / 0.4); p.bones.armL[2] += 8 * w; p.bones.armR[2] += 8 * w; p.bones.foreL[2] = 10 * w; p.bones.foreR[2] = -10 * w; },
  },
  land: {
    group: 'salto', dur: 0.45, loop: false, facings: ['right', 'left', 'front'],
    note: 'Aterrizaje: absorbe con rodillas, rebota y regresa al control.',
    principles: ['squash', 'follow-through', 'slow-in-out'],
    events: [{ t: 0, name: 'land' }],
    keys: [
      [0, { ...CROUCH, root: [0, -56, 0], armL: [-10, 0, 45], armR: [-10, 0, 45] }],
      [0.08, { ...CROUCH, root: [0, -62, 0] }, 'out'],
      [0.45, { root: [0, 0, 0], squash: 0, thighL: [0, 0, 0], thighR: [0, 0, 0], shinL: [0, 0, 0], shinR: [0, 0, 0],
        footL: [0, 0, 0], footR: [0, 0, 0], spine: [0, 0, 0], head: [0, 0, 0], armL: [0, 0, 4], armR: [0, 0, 4] }, 'settle'],
    ],
  },

  // ---------------- Gestos ----------------
  wave: {
    group: 'gestos', dur: 1.7, loop: false, facings: ['right', 'left', 'front'],
    note: 'Saludo con mano derecha (referencia S07): anticipa, sube en «L» fuera del casco, tres vaivenes, sostiene, baja.',
    principles: ['anticipacion', 'arcos', 'follow-through', 'timing', 'staging', 'pose-a-pose'],
    keys: [
      [0, {}],
      [0.14, { armR: [10, 0, -2], foreR: [-20, 0, 0], spine: [-2, 0, -2] }, 'out'],
      [0.38, { armR: [-62, 0, 72], foreR: [-66, 0, 0], handR: [0, 0, 10], head: [-6, 0, 10], spine: [-2, 0, 5] }, 'outBack'],
      [0.55, { foreR: [-66, 0, 30] }, 'inOut'],
      [0.72, { foreR: [-66, 0, -22] }, 'inOut'],
      [0.89, { foreR: [-66, 0, 28] }, 'inOut'],
      [1.06, { foreR: [-66, 0, -6] }, 'inOut'],
      [1.38, {}],
      [1.7, { armR: [0, 0, 4], foreR: [-10, 0, 0], handR: [0, 0, 0], head: [0, 0, 0], spine: [0, 0, 0] }, 'settle'],
    ],
    fn: (t, p) => breathe(t, p, 1.7, 0.4),
  },
  point: {
    group: 'gestos', dur: 1.5, loop: false, facings: ['right', 'left', 'front'],
    note: 'Señala hacia donde mira. Peso adelante y sostén claro (0.25-0.5 s).',
    principles: ['anticipacion', 'staging', 'slow-in-out', 'pose-a-pose'],
    keys: [
      [0, {}],
      [0.16, { armL: [16, 0, 0], foreL: [-40, 0, 0], spine: [-4, -6, 0] }, 'out'],
      [0.36, { armL: [-30, 0, 84], foreL: [-4, 0, 0], handL: [0, 0, 10], spine: [4, 14, 0], head: [-6, 22, 0],
        thighL: [-10, 0, 0], shinL: [8, 0, 0], footL: [2, 0, 0], root: [0, -4, 12] }, 'outBack'],
      [0.48, { armL: [-32, 0, 88] }, 'sine'],
      [1.05, { armL: [-31, 0, 86] }],
      [1.5, { armL: [0, 0, 4], foreL: [-10, 0, 0], handL: [0, 0, 0], spine: [0, 0, 0], head: [0, 0, 0],
        thighL: [0, 0, 0], shinL: [0, 0, 0], footL: [0, 0, 0], root: [0, 0, 0] }, 'inOut'],
    ],
  },
  think: {
    group: 'gestos', dur: 2.8, loop: true, facings: ['right', 'left', 'front'],
    note: 'Mano al borde del visor, casco ladeado hacia arriba. Emote de puntos suspensivos.',
    principles: ['staging', 'timing', 'secundaria'],
    emote: { name: 'dots', t: 0.6 },
    keys: [
      [0, { armR: [-58, 0, -6], foreR: [-112, 0, 0], handR: [0, 0, 0], head: [-10, 6, 10], spine: [-3, 4, 0],
        armL: [8, 0, 12], foreL: [-60, 0, -20] }],
      [1.4, { head: [-12, 10, 12] }, 'sine'],
      [2.8, { head: [-10, 6, 10] }, 'sine'],
    ],
    fn: (t, p) => { breathe(t, p, 2.8, 0.8); p.bones.handR[0] = 10 * S((t / 0.7) * TAU) * (t % 1.4 < 0.7 ? 1 : 0); },
  },
  idea: {
    group: 'gestos', dur: 1.3, loop: false, facings: ['right', 'left', 'front'],
    note: '¡Ya caí! Salto corto, brazo arriba. Emote foco.',
    principles: ['anticipacion', 'exageracion', 'squash'],
    emote: { name: 'idea', t: 0.25 },
    keys: [
      [0, { armR: [-58, 0, -6], foreR: [-112, 0, 0], head: [-10, 6, 10] }],
      [0.14, { ...CROUCH, root: [0, -30, 0], armR: [-58, 0, -6], foreR: [-112, 0, 0] }, 'out'],
      [0.32, { root: [0, 110, 0], squash: -0.03, thighL: [-10, 0, 0], thighR: [0, 0, 0], shinL: [20, 0, 0], shinR: [10, 0, 0],
        footL: [0, 0, 0], footR: [0, 0, 0], spine: [-6, 0, 0], head: [-14, 0, -6], armR: [-10, 0, 165], foreR: [0, 0, 0] }, 'out'],
      [0.52, { ...CROUCH, root: [0, -34, 0], armR: [-10, 0, 160] }, 'in'],
      [0.9, { root: [0, 0, 0], squash: 0, thighL: [0, 0, 0], thighR: [0, 0, 0], shinL: [0, 0, 0], shinR: [0, 0, 0],
        footL: [0, 0, 0], footR: [0, 0, 0], spine: [0, 0, 0], head: [-6, 0, -4], armR: [-10, 0, 150] }, 'settle'],
      [1.3, { head: [0, 0, 0], armR: [0, 0, 4], foreR: [-10, 0, 0] }, 'inOut'],
    ],
  },
  talk: {
    group: 'gestos', dur: 1.6, loop: true, facings: ['right', 'left', 'front'],
    note: 'Gesticula mientras habla (para burbujas de texto). El visor no se mueve: habla el cuerpo.',
    principles: ['secundaria', 'arcos', 'timing'],
    fn: (t, p) => {
      const f = (t / 1.6) * TAU;
      p.bones.armR[0] = -36 + 10 * S(f * 2);
      p.bones.armR[2] = 18 + 8 * S(f);
      p.bones.foreR[0] = -60 + 18 * S(f * 2 + 1);
      p.bones.armL[0] = -16 + 8 * S(f + 2);
      p.bones.armL[2] = 14 + 6 * S(f * 2);
      p.bones.foreL[0] = -50 + 14 * S(f * 2 + 2.5);
      p.bones.head[0] = -3 + 4 * S(f * 2);
      p.bones.head[2] = 4 * S(f);
      p.bones.spine[1] = 4 * S(f);
      breathe(t, p, 1.6, 0.6);
    },
  },
  nod: {
    group: 'gestos', dur: 0.9, loop: false, facings: ['right', 'left', 'front'],
    note: 'Sí / decisión: peso adelante y dos asentimientos.',
    principles: ['anticipacion', 'timing'],
    keys: [
      [0, {}],
      [0.12, { head: [-8, 0, 0] }, 'out'],
      [0.28, { head: [18, 0, 0], spine: [5, 0, 0] }, 'out'],
      [0.44, { head: [-2, 0, 0] }, 'inOut'],
      [0.6, { head: [14, 0, 0] }, 'out'],
      [0.9, { head: [0, 0, 0], spine: [0, 0, 0] }, 'settle'],
    ],
  },
  shake_no: {
    group: 'gestos', dur: 1.0, loop: false, facings: ['right', 'left', 'front'],
    note: 'No / error: niega con el casco, manos abiertas.',
    principles: ['timing', 'exageracion'],
    emote: { name: 'bang', t: 0.05 },
    keys: [
      [0, {}],
      [0.15, { head: [4, 24, 0], armL: [-20, 0, 30], armR: [-20, 0, 30], foreL: [-40, 0, 0], foreR: [-40, 0, 0] }, 'out'],
      [0.32, { head: [4, -24, 0] }, 'inOut'],
      [0.49, { head: [4, 20, 0] }, 'inOut'],
      [0.64, { head: [4, -12, 0] }, 'inOut'],
      [1.0, { head: [0, 0, 0], armL: [0, 0, 4], armR: [0, 0, 4], foreL: [-10, 0, 0], foreR: [-10, 0, 0] }, 'settle'],
    ],
  },

  // ---------------- Emociones (canon acting.emotes) ----------------
  curious: {
    group: 'emociones', dur: 1.8, loop: false, facings: ['right', 'left', 'front'],
    note: 'Curiosidad: casco ladeado 8-12°, se acerca y explora con la mano (canon).',
    principles: ['staging', 'anticipacion', 'slow-in-out'],
    emote: { name: 'question', t: 0.4 },
    keys: [
      [0, {}],
      [0.3, { head: [-6, 0, 11], spine: [8, 0, 3], root: [0, -6, 26], thighL: [-14, 0, 0], shinL: [12, 0, 0], footL: [2, 0, 0] }, 'outBack'],
      [0.7, { armR: [-50, 0, 10], foreR: [-30, 0, 0], handR: [0, 0, -8] }, 'inOut'],
      [1.3, { head: [-6, 0, 12], armR: [-54, 0, 12] }],
      [1.8, { head: [0, 0, 0], spine: [0, 0, 0], root: [0, 0, 0], thighL: [0, 0, 0], shinL: [0, 0, 0], footL: [0, 0, 0],
        armR: [0, 0, 4], foreR: [-10, 0, 0], handR: [0, 0, 0] }, 'inOut'],
    ],
  },
  decision: {
    group: 'emociones', dur: 1.2, loop: false, facings: ['right', 'left', 'front'],
    note: 'Decisión: peso adelante y dirección clara (canon).',
    principles: ['anticipacion', 'staging'],
    keys: [
      [0, {}],
      [0.2, { spine: [-6, 0, 0], head: [-8, 0, 0], root: [0, 0, -10] }, 'out'],
      [0.45, { spine: [12, 0, 0], head: [-4, 0, 0], root: [0, -10, 28], thighL: [-22, 0, 0], shinL: [16, 0, 0], footL: [6, 0, 0],
        armR: [-30, 0, -6], foreR: [-80, 0, 0], armL: [16, 0, 8] }, 'outBack'],
      [0.85, {}],
      [1.2, { spine: [0, 0, 0], head: [0, 0, 0], root: [0, 0, 0], thighL: [0, 0, 0], shinL: [0, 0, 0], footL: [0, 0, 0],
        armR: [0, 0, 4], foreR: [-10, 0, 0], armL: [0, 0, 4] }, 'inOut'],
    ],
  },
  doubt: {
    group: 'emociones', dur: 1.6, loop: false, facings: ['right', 'left', 'front'],
    note: 'Duda: pausa, retrocede un poco y abre las manos (canon).',
    principles: ['timing', 'staging'],
    emote: { name: 'question', t: 0.3 },
    keys: [
      [0, {}],
      [0.25, {}],
      [0.55, { root: [0, 0, -20], spine: [-6, 0, 0], head: [-4, 0, -9],
        armL: [-14, 0, 34], armR: [-14, 0, 34], foreL: [-62, 0, 0], foreR: [-62, 0, 0], handL: [0, 30, 0], handR: [0, 30, 0] }, 'outBack'],
      [1.15, {}],
      [1.6, { root: [0, 0, 0], spine: [0, 0, 0], head: [0, 0, 0], armL: [0, 0, 4], armR: [0, 0, 4],
        foreL: [-10, 0, 0], foreR: [-10, 0, 0], handL: [0, 0, 0], handR: [0, 0, 0] }, 'inOut'],
    ],
  },
  celebrate: {
    group: 'emociones', dur: 1.6, loop: false, facings: ['right', 'left', 'front'],
    note: 'Logro: torso abierto, brazos arriba; el peso regresa al centro (canon).',
    principles: ['anticipacion', 'squash', 'exageracion', 'arcos', 'follow-through', 'appeal'],
    emote: { name: 'star', t: 0.35 },
    events: [{ t: 0.3, name: 'takeoff' }, { t: 0.78, name: 'land' }],
    keys: [
      [0, {}],
      [0.2, { ...CROUCH, armL: [30, 0, 20], armR: [30, 0, 20] }, 'out'],
      [0.42, { root: [0, 300, 0], squash: -0.03, spine: [-10, 0, 0], head: [-16, 0, 0],
        thighL: [-30, 0, 0], thighR: [-10, 0, 0], shinL: [60, 0, 0], shinR: [40, 0, 0], footL: [0, 0, 0], footR: [0, 0, 0],
        armL: [-10, 0, 158], armR: [-10, 0, 158], foreL: [0, 0, 6], foreR: [0, 0, 6] }, 'out'],
      [0.56, { root: [0, 320, 0] }, 'sine'],
      [0.78, { ...CROUCH, root: [0, -40, 0], armL: [-10, 0, 140], armR: [-10, 0, 140] }, 'in'],
      [1.0, { root: [0, 0, 0], squash: 0, thighL: [0, 0, 0], thighR: [0, 0, 0], shinL: [0, 0, 0], shinR: [0, 0, 0],
        footL: [0, 0, 0], footR: [0, 0, 0], spine: [-6, 0, 0], head: [-10, 0, 0], armL: [-10, 0, 150], armR: [-10, 0, 150] }, 'settle'],
      [1.3, { armR: [-10, 0, 120], foreR: [0, 0, -30] }, 'inOut'],
      [1.6, { spine: [0, 0, 0], head: [0, 0, 0], armL: [0, 0, 4], armR: [0, 0, 4], foreL: [-10, 0, 0], foreR: [-10, 0, 0] }, 'inOut'],
    ],
  },
  frustrated: {
    group: 'emociones', dur: 2.2, loop: false, facings: ['right', 'left', 'front'],
    note: 'Frustración: ritmo lento y eje bajo; sin lágrimas pintadas (canon). Regresa al control.',
    principles: ['timing', 'staging', 'slow-in-out'],
    emote: { name: 'scribble', t: 0.5 },
    keys: [
      [0, {}],
      [0.5, { head: [26, 0, 0], spine: [14, 0, 0], root: [0, -14, 0], squash: 0.02,
        armL: [-6, 0, 0], armR: [-6, 0, 0], foreL: [-4, 0, 0], foreR: [-4, 0, 0] }, 'in'],
      [1.4, { head: [28, 0, 4], spine: [15, 0, 0] }, 'sine'],
      [1.7, { head: [-6, 0, 0], spine: [-4, 0, 0], root: [0, 0, 0], squash: 0 }, 'outBack'],
      [2.2, { head: [0, 0, 0], spine: [0, 0, 0], armL: [0, 0, 4], armR: [0, 0, 4], foreL: [-10, 0, 0], foreR: [-10, 0, 0] }, 'inOut'],
    ],
  },
  scared: {
    group: 'emociones', dur: 1.0, loop: false, facings: ['right', 'left', 'front'],
    note: 'Susto: brinco atrás y brazos de defensa, luego se recompone.',
    principles: ['anticipacion', 'exageracion', 'timing'],
    emote: { name: 'bang', t: 0.0 },
    keys: [
      [0, {}],
      [0.08, { root: [0, 90, -40], squash: -0.03, spine: [-14, 0, 0], head: [-14, 0, 0],
        armL: [-70, 0, 30], armR: [-70, 0, 30], foreL: [-90, 0, 0], foreR: [-90, 0, 0], thighL: [-20, 0, 0], shinL: [40, 0, 0] }, 'out'],
      [0.26, { ...CROUCH, root: [0, -40, -50] }, 'in'],
      [0.6, { root: [0, -20, -50], squash: 0.01 }],
      [1.0, { root: [0, 0, 0], squash: 0, spine: [0, 0, 0], head: [0, 0, 0], thighL: [0, 0, 0], thighR: [0, 0, 0], shinL: [0, 0, 0],
        shinR: [0, 0, 0], footL: [0, 0, 0], footR: [0, 0, 0], armL: [0, 0, 4], armR: [0, 0, 4], foreL: [-10, 0, 0], foreR: [-10, 0, 0] }, 'settle'],
    ],
  },
  ay: {
    group: 'emociones', dur: 1.5, loop: false, facings: ['right', 'left', 'front'],
    note: '«¡Ay!» del Moki escondido (juice 1.2.0): brinca, se voltea, mueve las pompis y regresa.',
    principles: ['anticipacion', 'exageracion', 'arcos', 'secundaria'],
    emote: { name: 'ay', t: 0.05 },
    keys: [
      [0, {}],
      [0.12, { root: [0, 120, 0], squash: -0.03, armL: [-30, 0, 60], armR: [-30, 0, 60] }, 'out'],
      [0.3, { root: [0, 0, 0], squash: 0.02, yaw: 160, armL: [0, 0, 20], armR: [0, 0, 20] }, 'in'],
      [0.42, { hips: [0, 0, 14], spine: [0, 0, -10], squash: 0 }, 'inOut'],
      [0.54, { hips: [0, 0, -14], spine: [0, 0, 10] }, 'inOut'],
      [0.66, { hips: [0, 0, 14], spine: [0, 0, -10] }, 'inOut'],
      [0.78, { hips: [0, 0, -14], spine: [0, 0, 10] }, 'inOut'],
      [0.9, { hips: [0, 0, 0], spine: [0, 0, 0] }, 'inOut'],
      [1.2, { yaw: 0, armL: [0, 0, 4], armR: [0, 0, 4] }, 'inOut'],
      [1.5, {}],
    ],
  },
  hit: {
    group: 'emociones', dur: 0.6, loop: false, facings: ['right', 'left', 'front'],
    note: 'Golpe recibido: respuesta corta y legible, recuperación rápida (canon hit_react).',
    principles: ['timing', 'follow-through'],
    keys: [
      [0, {}],
      [0.06, { root: [0, 8, -40], spine: [-16, 0, 6], head: [-22, 0, 10], armL: [20, 0, 40], armR: [20, 0, 40] }, 'out'],
      [0.6, { root: [0, 0, 0], spine: [0, 0, 0], head: [0, 0, 0], armL: [0, 0, 4], armR: [0, 0, 4] }, 'settle'],
    ],
  },

  // ---------------- Actividades ----------------
  typing: {
    group: 'actividades', dur: 0.8, loop: true, facings: ['right', 'left', 'front'],
    note: 'Sentado con laptop de cartón: escribe código (como Clawd, pero con Moki).',
    principles: ['secundaria', 'timing'],
    base: { ...SIT, head: [16, 0, 0], spine: [8, 0, 0], armL: [-58, 0, -4], armR: [-58, 0, -4], foreL: [-46, 0, 0], foreR: [-46, 0, 0],
      props: [{ name: 'laptop', off: [0, 250, -40] }] },
    fn: (t, p) => {
      const f = (t / 0.8) * TAU;
      p.bones.foreL[0] += 10 * pos(S(f * 2));
      p.bones.foreR[0] += 10 * pos(S(f * 2 + Math.PI));
      p.bones.head[0] += 2 * S(f);
      p.bones.spine[0] += 1 * S(f);
    },
  },
  building: {
    group: 'actividades', dur: 1.0, loop: true, facings: ['right', 'left', 'front'],
    note: 'Construye con martillo: anticipación lenta, golpe rápido, impacto sostenido.',
    principles: ['anticipacion', 'timing', 'arcos', 'exageracion'],
    events: [{ t: 0.48, name: 'hit' }],
    base: { props: ['hammer', 'block'] },
    keys: [
      [0, { armR: [-40, 0, 0], foreR: [-50, 0, 0], spine: [6, 0, 0], head: [12, 0, 0], armL: [-20, 0, 10], foreL: [-40, 0, 0] }],
      [0.38, { armR: [-170, 0, 0], foreR: [-40, 0, 0], spine: [-8, 0, 0], head: [6, 0, 0], squash: -0.01 }, 'out'],
      [0.48, { armR: [-62, 0, 0], foreR: [-22, 0, 0], spine: [22, 0, 0], head: [16, 0, 0], squash: 0.03, root: [0, -14, 0] }, 'in3'],
      [0.62, { armR: [-58, 0, 0], foreR: [-26, 0, 0] }],
      [1.0, { armR: [-40, 0, 0], foreR: [-50, 0, 0], spine: [6, 0, 0], head: [12, 0, 0], squash: 0, root: [0, 0, 0] }, 'inOut'],
    ],
  },
  juggling: {
    group: 'actividades', dur: 1.2, loop: true, facings: ['right', 'left', 'front'],
    note: 'Malabares en cascada con 3 bolas: arcos parabólicos y manos que acompañan.',
    principles: ['arcos', 'timing', 'secundaria'],
    base: { armL: [-48, 0, 10], armR: [-48, 0, 10], foreL: [-48, 0, 0], foreR: [-48, 0, 0], head: [-14, 0, 0] },
    fn: (t, p) => {
      const P = 1.2;
      p.props = [];
      for (let b = 0; b < 3; b++) {
        const tau = (((t / P) + b / 3) % 1 + 1) % 1;
        let x, y;
        if (tau < 0.5) { const u = tau * 2; x = -120 + 240 * u; y = 420 + 4 * 340 * u * (1 - u); }
        else { const u = (tau - 0.5) * 2; x = 120 - 240 * u; y = 420 + 4 * 90 * u * (1 - u); }
        p.props.push({ name: 'ball' + (b + 1), at: [x, y, 240] });
      }
      const f = (t / P) * TAU * 1.5;
      p.bones.foreL[0] += 14 * S(f);
      p.bones.foreR[0] += 14 * S(f + Math.PI);
      p.bones.head[1] = 6 * S((t / P) * TAU);
    },
  },
  play: {
    group: 'actividades', dur: 1.2, loop: true, facings: ['right', 'left', 'front'],
    note: 'Juega con control genérico (distinto del emblema del pecho, canon C04).',
    principles: ['secundaria', 'timing'],
    base: { props: ['gamepad'], armR: [-44, 0, -12], armL: [-44, 0, -12], foreR: [-62, 0, 0], foreL: [-62, 0, 0],
      handR: [20, 0, 0], handL: [20, 0, 0], head: [14, 0, 0], spine: [6, 0, 0] },
    fn: (t, p) => {
      const f = (t / 1.2) * TAU;
      p.bones.handR[0] += 6 * pos(S(f * 4));
      p.bones.handL[0] += 6 * pos(S(f * 3 + 1));
      p.bones.spine[2] = 5 * S(f);
      p.bones.head[2] = -4 * S(f);
      p.root[1] = 6 * pos(S(f * 2));
    },
  },
  push: {
    group: 'actividades', dur: 1.0, loop: true, facings: ['right', 'left'], speed: 140,
    note: 'Empuja un bloque: inclinación fuerte y pasos cortos con peso creíble (canon push).',
    principles: ['staging', 'timing'],
    base: { props: ['crate'], spine: [24, 0, 0], head: [-10, 0, 0],
      armL: [-84, 0, -6], armR: [-84, 0, -6], foreL: [-6, 0, 0], foreR: [-6, 0, 0] },
    fn: (t, p) => {
      const f = (t / 1.0) * TAU;
      p.bones.thighL[0] = -20 + 18 * S(f);
      p.bones.thighR[0] = 10 - 18 * S(f);
      p.bones.shinL[0] = 30 + 20 * pos(C(f));
      p.bones.shinR[0] = 30 + 20 * pos(-C(f));
      p.bones.footL[0] = -(p.bones.thighL[0] + p.bones.shinL[0]) * 0.9;
      p.bones.footR[0] = -(p.bones.thighR[0] + p.bones.shinR[0]) * 0.9;
      p.root[1] = -24 + 6 * C(2 * f);
    },
  },
  carry: {
    group: 'actividades', dur: 1.0, loop: true, facings: ['right', 'left', 'front'], speed: 300,
    note: 'Carga un bloque sobre la cabeza mientras camina (canon carry).',
    principles: ['squash', 'timing', 'secundaria'],
    base: { props: [{ name: 'block', off: [0, 985, -300] }], armL: [-168, 0, 18], armR: [-168, 0, 18], foreL: [-20, 0, 0], foreR: [-20, 0, 0] },
    fn: (t, p) => {
      const f = (t / 1.0) * TAU;
      const sf = S(f);
      p.bones.thighL[0] = -18 * sf; p.bones.thighR[0] = 18 * sf;
      p.bones.shinL[0] = 36 * pos(C(f)); p.bones.shinR[0] = 36 * pos(-C(f));
      p.bones.footL[0] = -(p.bones.thighL[0] + p.bones.shinL[0]) * 0.9;
      p.bones.footR[0] = -(p.bones.thighR[0] + p.bones.shinR[0]) * 0.9;
      p.root[1] = 8 * C(2 * f) - 6;
      p.squash = -0.02 * C(2 * f) + 0.01;
    },
  },
  pickup: {
    group: 'actividades', dur: 1.3, loop: false, facings: ['right', 'left', 'front'],
    note: 'Agarrar/usar: se agacha, toma y revisa el objeto (canon grab_use).',
    principles: ['anticipacion', 'slow-in-out', 'staging'],
    keys: [
      [0, {}],
      [0.4, { ...CROUCH, root: [0, -90, 0], spine: [34, 0, 0], head: [20, 0, 0], armR: [-60, 0, 0], foreR: [-10, 0, 0] }, 'inOut'],
      [0.55, { armR: [-64, 0, 0] }],
      [0.95, { root: [0, 0, 0], squash: 0, thighL: [0, 0, 0], thighR: [0, 0, 0], shinL: [0, 0, 0], shinR: [0, 0, 0],
        footL: [0, 0, 0], footR: [0, 0, 0], spine: [0, 0, 0], head: [10, 0, 6], armR: [-70, 0, -16], foreR: [-70, 0, 0], props: ['mug'] }, 'outBack'],
      [1.3, { head: [6, 0, 4] }],
    ],
  },
  dance: {
    group: 'actividades', dur: 2.0, loop: true, facings: ['right', 'left', 'front'],
    note: 'Baile de fiesta (cuando encuentras los 5 Mokis): pasos laterales y brazos alternos.',
    principles: ['timing', 'exageracion', 'secundaria', 'arcos', 'appeal'],
    fn: (t, p) => {
      const f = (t / 2.0) * TAU * 2;
      const b = S(f);
      p.root[0] = 30 * b;
      p.root[1] = 22 * Math.abs(S(f * 2)) - 8;
      p.bones.hips[2] = 9 * b;
      p.bones.spine[2] = -11 * b;
      p.bones.head[2] = 8 * S(f - 0.6);
      p.bones.armL[2] = 30 + 110 * pos(S(f));
      p.bones.armR[2] = 30 + 110 * pos(-S(f));
      p.bones.armL[0] = -20; p.bones.armR[0] = -20;
      p.bones.foreL[2] = 30 * C(f); p.bones.foreR[2] = -30 * C(f);
      p.bones.thighL[2] = 8 * pos(b); p.bones.thighR[2] = 8 * pos(-b);
      p.bones.shinL[0] = 30 * pos(-b); p.bones.shinR[0] = 30 * pos(b);
      p.squash = 0.02 * C(f * 2);
    },
  },
  ready: {
    group: 'actividades', dur: 0.8, loop: true, facings: ['right', 'left'],
    note: 'Guardia de reto de juego: contextual, nunca agresión permanente (canon combat).',
    principles: ['anticipacion', 'timing'],
    base: { thighL: [-20, 0, 6], thighR: [14, 0, 6], shinL: [28, 0, 0], shinR: [20, 0, 0], footL: [-8, 0, 0], footR: [-20, 0, 0],
      spine: [8, -14, 0], head: [-6, 12, 0], armL: [-50, 0, 10], armR: [-30, 0, 10], foreL: [-100, 0, 0], foreR: [-110, 0, 0] },
    fn: (t, p) => { const f = (t / 0.8) * TAU; p.root[1] = -16 + 10 * S(f); p.squash = 0.012 * S(f); },
  },
  attack: {
    group: 'actividades', dur: 0.6, loop: false, facings: ['right', 'left'],
    note: 'Golpe de juego: anticipación, golpe de 2 cuadros, recuperación.',
    principles: ['anticipacion', 'timing', 'follow-through', 'exageracion'],
    events: [{ t: 0.2, name: 'hit' }],
    keys: [
      [0, { spine: [8, -14, 0], armR: [-30, 0, 10], foreR: [-110, 0, 0], armL: [-50, 0, 10], foreL: [-100, 0, 0] }],
      [0.14, { spine: [4, -26, 0], armR: [10, 0, 10], foreR: [-120, 0, 0] }, 'out'],
      [0.2, { spine: [14, 18, 0], armR: [-90, 0, 4], foreR: [-4, 0, 0], root: [0, -8, 40] }, 'in3'],
      [0.32, {}],
      [0.6, { spine: [8, -14, 0], armR: [-30, 0, 10], foreR: [-110, 0, 0], root: [0, 0, 0] }, 'inOut'],
    ],
  },

  // ---------------- Descanso ----------------
  sit: {
    group: 'descanso', dur: 2.8, loop: true, facings: ['right', 'left', 'front'],
    note: 'Sentado tranquilo.',
    principles: ['slow-in-out'],
    base: { ...SIT, armL: [-20, 0, 18], armR: [-20, 0, 18], foreL: [-30, 0, 0], foreR: [-30, 0, 0] },
    fn: (t, p) => breathe(t, p, 2.8, 1),
  },
  sleep: {
    group: 'descanso', dur: 3.2, loop: true, facings: ['right', 'left', 'front'],
    note: 'Duerme sentado: respiración lenta y profunda. Emote Zz.',
    principles: ['timing', 'slow-in-out', 'secundaria'],
    emote: { name: 'zz', t: 0, every: 1.6 },
    base: { ...SIT, head: [30, 0, 8], spine: [12, 0, 0], armL: [-10, 0, 10], armR: [-10, 0, 10], foreL: [-30, 0, 0], foreR: [-30, 0, 0] },
    fn: (t, p) => { breathe(t, p, 3.2, 2.2); p.bones.head[0] += 3 * S((t / 3.2) * TAU); },
  },
  wake: {
    group: 'descanso', dur: 1.8, loop: false, facings: ['right', 'left', 'front'],
    note: 'Despierta y se estira.',
    principles: ['anticipacion', 'exageracion', 'slow-in-out'],
    keys: [
      [0, { ...SIT, head: [30, 0, 8], spine: [12, 0, 0], armL: [-10, 0, 10], armR: [-10, 0, 10], foreL: [-30, 0, 0], foreR: [-30, 0, 0] }],
      [0.6, { head: [-20, 0, 0], spine: [-10, 0, 0], armL: [-10, 0, 165], armR: [-10, 0, 165], foreL: [0, 0, 0], foreR: [0, 0, 0] }, 'out'],
      [1.0, { head: [-24, 0, -6] }],
      [1.8, { head: [0, 0, 0], spine: [0, 0, 0], armL: [-20, 0, 18], armR: [-20, 0, 18], foreL: [-30, 0, 0], foreR: [-30, 0, 0] }, 'inOut'],
    ],
  },
  sit_down: {
    group: 'descanso', dur: 0.8, loop: false, facings: ['right', 'left', 'front'],
    note: 'Transición de pie → sentado.',
    principles: ['slow-in-out', 'squash'],
    keys: [
      [0, {}],
      [0.35, { ...CROUCH }, 'inOut'],
      [0.8, { ...SIT, squash: 0, armL: [-20, 0, 18], armR: [-20, 0, 18], foreL: [-30, 0, 0], foreR: [-30, 0, 0], head: [0, 0, 0] }, 'outBack'],
    ],
  },
  stand_up: {
    group: 'descanso', dur: 0.8, loop: false, facings: ['right', 'left', 'front'],
    note: 'Transición de sentado → de pie.',
    principles: ['anticipacion', 'slow-in-out'],
    keys: [
      [0, { ...SIT, armL: [-20, 0, 18], armR: [-20, 0, 18], foreL: [-30, 0, 0], foreR: [-30, 0, 0] }],
      [0.4, { ...CROUCH, armL: [-30, 0, 10], armR: [-30, 0, 10] }, 'inOut'],
      [0.8, { root: [0, 0, 0], squash: 0, thighL: [0, 0, 0], thighR: [0, 0, 0], shinL: [0, 0, 0], shinR: [0, 0, 0],
        footL: [0, 0, 0], footR: [0, 0, 0], spine: [0, 0, 0], head: [0, 0, 0], armL: [0, 0, 4], armR: [0, 0, 4],
        foreL: [-10, 0, 0], foreR: [-10, 0, 0] }, 'settle'],
    ],
  },

  // ---------------- Mascota (escritorio y web) ----------------
  dragged: {
    group: 'mascota', dur: 1.0, loop: true, facings: ['front', 'right', 'left'],
    note: 'Cuando lo agarras con el mouse: cuelga de la mochila y patalea con péndulo.',
    principles: ['secundaria', 'arcos', 'follow-through', 'pose-a-pose'],
    base: { root: [0, -40, 0], spine: [-6, 0, 0], head: [-12, 0, 0], armL: [-20, 0, 40], armR: [-20, 0, 40] },
    fn: (t, p) => {
      const f = (t / 1.0) * TAU;
      p.bones.thighL[0] = -16 * S(f); p.bones.thighR[0] = 16 * S(f);
      p.bones.shinL[0] = 24 + 14 * S(f + 1); p.bones.shinR[0] = 24 - 14 * S(f + 1);
      p.bones.armL[2] += 14 * S(f + 0.5); p.bones.armR[2] += 14 * S(f + 2);
      p.rootRot[2] = 6 * S(f * 0.5);
    },
  },
  falling: {
    group: 'mascota', dur: 0.5, loop: true, facings: ['front', 'right', 'left'],
    note: 'Cayendo después de soltarlo: agita brazos y piernas.',
    principles: ['exageracion', 'secundaria'],
    emote: { name: 'bang', t: 0 },
    fn: (t, p) => {
      const f = (t / 0.5) * TAU;
      p.bones.armL[2] = 120 + 30 * S(f); p.bones.armR[2] = 120 + 30 * S(f + Math.PI);
      p.bones.foreL[2] = 30 * S(f + 1); p.bones.foreR[2] = -30 * S(f + 1);
      p.bones.thighL[0] = -30 * S(f); p.bones.thighR[0] = 30 * S(f);
      p.bones.shinL[0] = 40; p.bones.shinR[0] = 40;
      p.bones.head[0] = -14;
    },
  },
  hang: {
    group: 'mascota', dur: 2.4, loop: true, facings: ['front', 'right', 'left'],
    note: 'Cuelga de un hilo (Moki escondido): se columpia con física de péndulo.',
    principles: ['arcos', 'secundaria', 'slow-in-out'],
    base: { props: ['string'], armL: [-10, 0, 30], armR: [-10, 0, 30], foreL: [-20, 0, 0], foreR: [-20, 0, 0],
      thighL: [-8, 0, 0], thighR: [4, 0, 0], shinL: [20, 0, 0], shinR: [14, 0, 0] },
    fn: (t, p) => {
      const sw = S((t / 2.4) * TAU);
      p.rootRot[2] = 9 * sw;
      p.bones.thighL[0] += 6 * S((t / 2.4) * TAU - 0.8);
      p.bones.thighR[0] += 6 * S((t / 2.4) * TAU - 1.0);
      p.bones.head[2] = -4 * sw;
    },
  },
  peek: {
    group: 'mascota', dur: 2.0, loop: true, facings: ['front', 'right', 'left'],
    note: 'Se asoma por un borde (el runtime recorta a Moki). Casco curioso.',
    principles: ['staging', 'timing'],
    keys: [
      [0, { head: [8, 0, 14] }],
      [0.8, { head: [8, 0, 14] }],
      [1.1, { head: [4, 0, -10] }, 'outBack'],
      [1.7, { head: [4, 0, -10] }],
      [2.0, { head: [8, 0, 14] }, 'inOut'],
    ],
  },
  turn: {
    group: 'mascota', dur: 1.6, loop: true, facings: ['front'],
    note: 'Vuelta completa de 360° (muestra de volumen sólido; transición).',
    principles: ['dibujo-solido'],
    fn: (t, p) => { p.yaw = (t / 1.6) * 360; breathe(t, p, 1.6, 0.5); },
  },
};

// Grupos para documentación y UI
export const GROUPS = {
  locomocion: 'Locomoción',
  salto: 'Salto',
  gestos: 'Gestos',
  emociones: 'Emociones',
  actividades: 'Actividades',
  descanso: 'Descanso',
  mascota: 'Mascota',
};

export const FACINGS = { right: 50, left: -50, front: 0, back: 180 };
