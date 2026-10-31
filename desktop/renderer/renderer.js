import { MokiPet } from '../app/dist/runtime/moki.mjs';

const cfg = await window.mokiDesktop.config();
let wa = cfg.workArea;
const s = cfg.settings;
const base = new URL('../app/dist/', import.meta.url).href;

const opts = {
  base, size: s.size || 64, scale: s.scale || 2, juice: s.juice, sound: s.sound, greet: true, hello: '¡Hola!',
  bounds: () => ({ w: wa.width, h: wa.height }),
  origin: () => ({ x: wa.x, y: wa.y }),
};
if (cfg.mode === 'window') {
  // La ventana se mueve; Moki se queda dibujado abajo al centro de la ventana.
  const W = innerWidth, H = innerHeight;
  opts.place = (pet, { x, y, w, h }) => {
    const cv = pet.canvas;
    cv.style.left = Math.round(W / 2 - w / 2) + 'px';
    cv.style.bottom = '0px';
    const [hx, hy] = pet.player.anchor('head_top');
    pet.bubble.style.left = Math.round(W / 2 - w / 2 + hx + 6) + 'px';
    pet.bubble.style.bottom = Math.round(h - hy + 6) + 'px';
    window.mokiDesktop.move(wa.x + x - W / 2, wa.y + wa.height - H - y + (s.scale || 2) * 3);
  };
}
const pet = new MokiPet(opts);
window.MokiPixel = { pet };

// Overlay: deja pasar los clics salvo cuando el puntero está sobre Moki
if (cfg.mode === 'overlay') {
  let over = false;
  addEventListener('mousemove', (e) => {
    const now = e.target === pet.canvas || e.target === pet.bubble;
    if (now !== over) { over = now; window.mokiDesktop.hover(now); }
  });
}

window.mokiDesktop.onEvent((ev) => {
  if (ev.type === 'juice') pet.setJuice(ev.level);
  else if (ev.type === 'sound') pet.opts.sound = ev.on;
  else if (ev.type === 'resize') { wa = ev.workArea; }
  else if (ev.type === 'act' || ev.type === 'hook') {
    pet.lastInput = performance.now();
    if (ev.walk !== undefined) pet.walkTo(Number(ev.walk));
    if (ev.clip) pet.act(ev.clip);
    if (ev.say) pet.say(ev.say, 2400);
    if (ev.emote) pet.emote(ev.emote, 1600);
    pet._next = performance.now() + 5000; // que la acción del agente se vea antes de volver a pasear
  }
});
