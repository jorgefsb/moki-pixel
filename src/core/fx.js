// FX y emotes en pixel art. Las expresiones de Moki viven FUERA del visor (canon C06):
// burbujas de papel sobre el casco, partículas y sombra. Nunca ojos, cejas, boca ni emoticonos en el visor.
import { RAMPS, OUTLINE, hexToRgb } from './palette.js';

const INK = hexToRgb(RAMPS.ink[1]);
const PAPER = hexToRgb(RAMPS.cream[1]);
const PAPER_SH = hexToRgb(RAMPS.cream[2]);
const ORANGE = hexToRgb(RAMPS.orange[1]);
const ORANGE_D = hexToRgb(RAMPS.orange[2]);
const AMBER = hexToRgb(RAMPS.amber[1]);
const KRAFT = hexToRgb(RAMPS.kraft[1]);
const OUT = hexToRgb(OUTLINE);

// Íconos 9x9 ('#' tinta, 'o' naranja, 'a' ámbar)
export const ICONS = {
  bang: ['...###...', '...###...', '...###...', '...###...', '....#....', '....#....', '.........', '...###...', '...###...'],
  question: ['..#####..', '.##...##.', '......##.', '.....##..', '....##...', '....#....', '.........', '....#....', '...###...'],
  dots: ['.........', '.........', '.........', '.........', '#..#..#..', '.........', '.........', '.........', '.........'],
  idea: ['...aaa...', '..aaaaa..', '.aaa.aaa.', '.aaa.aaa.', '..aa.aa..', '...aaa...', '...###...', '...###...', '....#....'],
  star: ['....o....', '....o....', '...ooo...', 'ooooooooo', '.ooooooo.', '..ooooo..', '..oo.oo..', '.oo...oo.', '.o.....o.'],
  heart: ['.........', '.oo...oo.', 'ooooooooo', 'ooooooooo', 'ooooooooo', '.ooooooo.', '..ooooo..', '...ooo...', '....o....'],
  zz: ['.........', '..#####..', '.....#...', '....#....', '...#.....', '..#####..', '......###', '.......#.', '......###'],
  scribble: ['.........', '..##..#..', '.#..##.#.', '#.##..#.#', '.#..##.#.', '#.#....#.', '.#.####..', '.........', '.........'],
  music: ['....####.', '....#..#.', '....#..#.', '....#..#.', '....#..#.', '..###.##.', '.####.##.', '.###.....', '.........'],
  check: ['.........', '........#', '.......##', '......##.', '#....##..', '##..##...', '.####....', '..##.....', '.........'],
  gear: ['...#.#...', '.#######.', '.##...##.', '###...###', '.##...##.', '###...###', '.##...##.', '.#######.', '...#.#...'],
  ay: null, // texto «¡AY!» (ver TEXT)
};

// Fuente de 3x5 para «¡AY!»
const GLYPH = {
  '¡': ['#', '.', '#', '#', '#'],
  '!': ['#', '#', '#', '.', '#'],
  A: ['.#.', '#.#', '###', '#.#', '#.#'],
  Y: ['#.#', '#.#', '.#.', '.#.', '.#.'],
};
function textBitmap(str) {
  const rows = ['', '', '', '', ''];
  [...str].forEach((ch, i) => {
    const g = GLYPH[ch];
    for (let r = 0; r < 5; r++) rows[r] += (i ? '.' : '') + g[r];
  });
  return rows;
}

function canvas(w, h) {
  return { w, h, data: new Uint8ClampedArray(w * h * 4) };
}
function px(c, x, y, rgb) {
  if (x < 0 || y < 0 || x >= c.w || y >= c.h) return;
  const i = (y * c.w + x) * 4;
  c.data[i] = rgb[0]; c.data[i + 1] = rgb[1]; c.data[i + 2] = rgb[2]; c.data[i + 3] = 255;
}
function rect(c, x0, y0, w, h, rgb) {
  for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + w; x++) px(c, x, y, rgb);
}

// Burbuja de papel con cola hacia abajo-izquierda. scale 1 (64 px) o 2 (128 px).
// stage: 0 punto, 1 burbuja vacía chica, 2 completa, 3 completa con rebote de 1 px.
export function emoteFrame(name, stage = 2, scale = 1) {
  const icon = name === 'ay' ? textBitmap('¡AY!') : ICONS[name];
  const iw = icon[0].length, ih = icon.length;
  const bw = (Math.max(iw, 9) + 6), bh = ih + 6;
  const W = bw + 2, H = bh + 5;
  const c = canvas(W * scale, H * scale);
  const S = (x, y, rgb) => rect(c, x * scale, y * scale, scale, scale, rgb);
  const oy = stage === 3 ? 0 : 1;
  if (stage === 0) {
    S(2, H - 3, OUT); S(3, H - 3, OUT); S(2, H - 4, OUT); S(3, H - 4, PAPER);
    return c;
  }
  const sw = stage === 1 ? Math.ceil(bw * 0.6) : bw, sh = stage === 1 ? Math.ceil(bh * 0.6) : bh;
  const x0 = 1, y0 = H - 4 - sh - (stage === 1 ? 0 : oy - 1);
  // cuerpo con esquinas redondeadas de 1 px
  for (let y = 0; y < sh; y++) for (let x = 0; x < sw; x++) {
    const corner = (x === 0 || x === sw - 1) && (y === 0 || y === sh - 1);
    if (corner) continue;
    const edge = x === 0 || y === 0 || x === sw - 1 || y === sh - 1 || (x === 1 && (y === 1 || y === sh - 2)) && false;
    S(x0 + x, y0 + y, edge ? OUT : y === sh - 2 ? PAPER_SH : PAPER);
  }
  // cola
  S(x0 + 2, y0 + sh - 1, PAPER); S(x0 + 3, y0 + sh - 1, PAPER);
  S(x0 + 1, y0 + sh, OUT); S(x0 + 2, y0 + sh, PAPER); S(x0 + 3, y0 + sh, OUT);
  S(x0 + 1, y0 + sh + 1, OUT); S(x0 + 2, y0 + sh + 1, OUT);
  if (stage >= 2) {
    const ix = x0 + Math.floor((sw - iw) / 2), iy = y0 + Math.floor((sh - ih) / 2);
    for (let y = 0; y < ih; y++) for (let x = 0; x < iw; x++) {
      const ch = icon[y][x];
      if (ch === '#') S(ix + x, iy + y, INK);
      else if (ch === 'o') S(ix + x, iy + y, ORANGE);
      else if (ch === 'a') S(ix + x, iy + y, AMBER);
    }
  }
  return c;
}

// Partículas (cuadros sueltos, en pixeles nativos de 64 px; scale 2 para 128)
export function dustFrame(i, scale = 1) {
  // nube de polvo de papel kraft, 4 cuadros: abre, crece, se rompe, motas
  const c = canvas(16 * scale, 8 * scale);
  const S = (x, y, rgb) => rect(c, x * scale, y * scale, scale, scale, rgb);
  const shapes = [
    [[6, 6], [7, 6], [8, 6], [9, 6], [7, 5], [8, 5]],
    [[3, 6], [4, 6], [4, 5], [5, 5], [5, 4], [10, 4], [10, 5], [11, 5], [11, 6], [12, 6], [6, 6], [9, 6]],
    [[1, 6], [2, 5], [2, 6], [3, 4], [12, 4], [13, 5], [13, 6], [14, 6]],
    [[0, 5], [3, 3], [12, 3], [15, 5]],
  ];
  for (const [x, y] of shapes[i]) S(x, y, i < 2 ? KRAFT : PAPER_SH);
  return c;
}
export function sparkFrame(i, scale = 1) {
  // chispas de impacto (martillo, golpe): naranja/ámbar, 3 cuadros
  const c = canvas(12 * scale, 12 * scale);
  const S = (x, y, rgb) => rect(c, x * scale, y * scale, scale, scale, rgb);
  const r = [2, 4, 5][i];
  const col = [AMBER, ORANGE, ORANGE_D][i];
  for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1], [0.7, 0.7], [-0.7, 0.7], [0.7, -0.7], [-0.7, -0.7]]) {
    S(Math.round(6 + dx * r), Math.round(6 + dy * r), col);
    if (i === 0) S(Math.round(6 + dx * (r - 1)), Math.round(6 + dy * (r - 1)), AMBER);
  }
  if (i === 0) S(6, 6, AMBER);
  return c;
}
export function confettiFrame(i, scale = 1) {
  const c = canvas(24 * scale, 24 * scale);
  const S = (x, y, rgb) => rect(c, x * scale, y * scale, scale, scale, rgb);
  const cols = [ORANGE, AMBER, PAPER, hexToRgb(RAMPS.petrol[0])];
  for (let k = 0; k < 14; k++) {
    const ang = (k / 14) * Math.PI * 2 + k;
    const sp = 3 + (k % 4) * 2.2;
    const x = Math.round(12 + Math.cos(ang) * sp * (i + 1) * 0.55);
    const y = Math.round(12 + Math.sin(ang) * sp * (i + 1) * 0.45 + i * i * 0.6);
    S(x, y, cols[k % 4]);
    if (k % 3 === 0) S(x + 1, y, cols[k % 4]);
  }
  return c;
}
// Sombra de contacto (capa aparte, canon P06): elipse de tinta 35 %.
export function shadow(widthPx, alpha = 90) {
  const h = Math.max(2, Math.round(widthPx / 6));
  const c = canvas(widthPx, h);
  for (let y = 0; y < h; y++) for (let x = 0; x < widthPx; x++) {
    const nx = (x + 0.5 - widthPx / 2) / (widthPx / 2), ny = (y + 0.5 - h / 2) / (h / 2);
    if (nx * nx + ny * ny <= 1) {
      const i = (y * widthPx + x) * 4;
      c.data[i] = 10; c.data[i + 1] = 10; c.data[i + 2] = 10; c.data[i + 3] = alpha;
    }
  }
  return c;
}

export const EMOTES = Object.keys(ICONS);
export const EMOTE_LABELS = {
  bang: '¡! sorpresa / alerta', question: '? duda / curiosidad', dots: '… pensando', idea: 'foco / idea',
  star: 'estrella / logro', heart: 'corazón / gracias', zz: 'Zz dormido', scribble: 'garabato / frustración',
  music: 'nota / música', check: 'palomita / listo', gear: 'engrane / construyendo', ay: '«¡Ay!» (Moki escondido)',
};
