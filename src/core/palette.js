// Paleta pixel art de Moki.
// Bases tomadas del Moki Production Brief 0.1 (palette.materials) y tokens del BrandKit.
// Estado: las bases son canon de dirección aprobada; las rampas (luz/sombra) son PROPUESTA de este kit.
// Rampa: [luz, base, sombra, profunda]. Luz desde arriba-izquierda-frente.

export const BASE = {
  orange: '#FF6B35', // traje y franja (heredado)
  cream: '#F4E8D5', // casco, puños, suelas, rodilleras (propuesto)
  charcoal: '#22211F', // visor, guantes, botas (propuesto)
  petrol: '#4C6260', // arnés (propuesto-nuevo)
  kraft: '#B99168', // bordes y fibra (propuesto)
  black: '#0A0A0A', // fondo (heredado)
  surface: '#161616', // superficie (heredado)
  amber: '#FFA500', // acento (heredado)
  white: '#FFFFFF',
};

export const RAMPS = {
  orange: ['#FF9A66', '#FF6B35', '#DE4F27', '#A8381E'],
  cream: ['#FFF7EA', '#F4E8D5', '#DCC6A6', '#B99168'],
  label: ['#FFFBF2', '#FBF1E1', '#E6D3B6', '#B99168'],
  charcoal: ['#4D4945', '#34322F', '#22211F', '#171614'],
  visor: ['#3E3B38', '#2B2927', '#1E1D1B', '#141312'],
  visorHi: ['#C9C0B3', '#A79F94', '#8C857B', '#6E6861'],
  petrol: ['#71898A', '#4C6260', '#3B4D4B', '#2A3735'],
  kraft: ['#D2AE86', '#B99168', '#97744F', '#73573A'],
  ink: ['#2C2A27', '#22211F', '#1A1917', '#121110'],
  speck: ['#FF8A50', '#E8622F', '#C24E25', '#943A1B'],
  // Props
  paper: ['#FFFFFF', '#F4E8D5', '#DCC6A6', '#B99168'],
  steel: ['#B9B4AC', '#8E8A84', '#6B6863', '#4C4A46'],
  wood: ['#C79B6B', '#A57A4E', '#82603C', '#5E452B'],
  amber: ['#FFD27A', '#FFA500', '#D98500', '#A86600'],
  screen: ['#2E4A48', '#1F3533', '#162624', '#0E1918'],
  screenOn: ['#9FE0C8', '#6CC2A6', '#4C9C84', '#2F6E5C'],
};

export const OUTLINE = '#191613';

// Paleta cerrada para GIF/Aseprite (orden estable).
export function flatPalette() {
  const set = new Set([OUTLINE]);
  for (const r of Object.values(RAMPS)) r.forEach((c) => set.add(c));
  return [...set];
}

export function hexToRgb(hex) {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
