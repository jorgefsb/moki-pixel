// Curvas de aceleración (principio 6: slow in / slow out).
const PI = Math.PI;
export const EASE = {
  linear: (t) => t,
  in: (t) => t * t,
  out: (t) => 1 - (1 - t) * (1 - t),
  inOut: (t) => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2),
  sine: (t) => -(Math.cos(PI * t) - 1) / 2,
  in3: (t) => t * t * t,
  out3: (t) => 1 - (1 - t) ** 3,
  // Exageración con rebase (principio 10)
  outBack: (t) => {
    const c1 = 1.4, c3 = c1 + 1;
    return 1 + c3 * (t - 1) ** 3 + c1 * (t - 1) ** 2;
  },
  inBack: (t) => {
    const c1 = 1.4, c3 = c1 + 1;
    return c3 * t * t * t - c1 * t * t;
  },
  // Asentamiento (follow-through): pequeño rebote amortiguado
  settle: (t) => (t === 0 ? 0 : t === 1 ? 1 : 1 - Math.cos(t * PI * 2.5) * Math.exp(-5 * t)),
  step: (t) => (t < 1 ? 0 : 1), // pose sostenida (hold)
};
export const ease = (name) => EASE[name] || EASE.inOut;
