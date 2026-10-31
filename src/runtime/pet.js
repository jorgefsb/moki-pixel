// MokiPet: Moki vive en cualquier página web. Camina, se sienta, duerme, juega,
// reacciona a tus clics, lo puedes cargar y aventar. Niveles de juice de la marca:
// nada · poquito · mucho · hardcore. «prefers-reduced-motion» fuerza «nada».
import { MokiPlayer } from './player.js';

const ACTIVITIES = ['idle_look', 'think', 'play', 'typing', 'juggling', 'talk', 'curious'];
const LEVELS = {
  nada: { every: [1e9, 1e9], walk: 0, run: 0, fun: 0 },
  poquito: { every: [6000, 11000], walk: 0.45, run: 0.05, fun: 0.25 },
  mucho: { every: [3500, 7000], walk: 0.5, run: 0.15, fun: 0.4 },
  hardcore: { every: [1500, 3500], walk: 0.45, run: 0.35, fun: 0.6 },
};

export class MokiPet {
  constructor(opts = {}) {
    this.opts = { size: 64, scale: 2, juice: 'mucho', sound: true, greet: true, sleepAfter: 60000, zIndex: 2147483000, ...opts };
    const rm = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.level = rm ? 'nada' : (document.documentElement.dataset.juice || this.opts.juice);
    this.x = this.opts.x ?? Math.round(this._W() * 0.75);
    this.y = 0; // altura sobre el piso (px CSS)
    this.vx = 0; this.vy = 0;
    this.mode = 'brain';
    this.target = null;
    this.lastInput = performance.now();
    this._mount();
  }

  // Mundo: ventana del navegador o, en escritorio, el área de trabajo de la pantalla
  _W() { return this.opts.bounds ? this.opts.bounds().w : innerWidth; }
  _H() { return this.opts.bounds ? this.opts.bounds().h : innerHeight; }
  _pt(e) { const o = this.opts.origin ? this.opts.origin() : null; return o ? [e.screenX - o.x, e.screenY - o.y] : [e.clientX, e.clientY]; }

  _mount() {
    const o = this.opts;
    const root = (this.root = document.createElement('div'));
    root.className = 'moki-pet';
    root.style.cssText = `position:fixed;left:0;bottom:0;width:0;height:0;z-index:${o.zIndex};pointer-events:none;`;
    const cv = (this.canvas = document.createElement('canvas'));
    cv.tabIndex = 0;
    cv.setAttribute('role', 'button');
    cv.setAttribute('aria-label', 'Moki, mascota animada. Enter para picarle, Escape para esconderlo.');
    cv.style.cssText = 'position:absolute;bottom:0;pointer-events:auto;cursor:grab;image-rendering:pixelated;touch-action:none;outline-offset:2px;';
    root.appendChild(cv);
    const bub = (this.bubble = document.createElement('div'));
    bub.style.cssText = 'position:absolute;bottom:0;white-space:nowrap;padding:6px 11px 7px;border-radius:12px;background:#F4E8D5;color:#22211F;font:700 15px/1.1 Outfit,system-ui,sans-serif;box-shadow:0 6px 16px #0006;opacity:0;transform:translateY(6px) scale(.8);transition:opacity .16s,transform .22s cubic-bezier(.2,.9,.25,1.4);pointer-events:none';
    root.appendChild(bub);
    document.body.appendChild(root);
    this.player = new MokiPlayer(cv, { base: o.base, size: o.size, scale: o.scale, facing: 'front', clip: 'idle' });
    this.player.on('event', (e) => { if (e.name === 'land' || e.name === 'takeoff') this._blip(e.name === 'land' ? 140 : 420, 0.05); });
    this.player.on('end', (e) => {
      if (this.mode !== 'brain') return;
      if (this._then && this._then.clip === e.clip) { const n = this._then.next; this._then = null; this.player.play(n); }
      else if (e.clip !== 'land' || true) setTimeout(() => { if (this.player._done && this.mode === 'brain' && this.target === null) this.player.play('idle', { facing: 'front' }); }, 250);
    });
    this.player.ready.then(() => {
      this._place();
      if (this.level !== 'nada' && o.greet) { this.player.play('wave'); this.say(o.hello || '¡Hola!', 1800); }
      this._next = performance.now() + 2500;
      this._raf = requestAnimationFrame((t) => this._loop(t, t));
    });
    this._bindInput();
  }

  _bindInput() {
    const cv = this.canvas;
    let down = null, drag = false, lastMove = null, clicks = [];
    cv.addEventListener('pointerdown', (e) => {
      cv.setPointerCapture(e.pointerId);
      const [px, py] = this._pt(e);
      down = { x: px, y: py, t: performance.now() };
      lastMove = { x: px, y: py, t: performance.now() };
      this._unlockAudio();
    });
    cv.addEventListener('pointermove', (e) => {
      if (!down) return;
      const [px, py] = this._pt(e);
      if (!drag && Math.hypot(px - down.x, py - down.y) > 5 && this.level !== 'nada') {
        drag = true; this.mode = 'drag'; cv.style.cursor = 'grabbing'; this.player.play('dragged', { facing: 'front' });
      }
      if (drag) {
        const now = performance.now(), dt = Math.max(1, now - lastMove.t);
        this.vx = ((px - lastMove.x) / dt) * 1000;
        this.vy = (-(py - lastMove.y) / dt) * 1000;
        lastMove = { x: px, y: py, t: now };
        this.x = px;
        this.y = Math.max(0, this._H() - py - this.canvas.height * 0.55);
        this._place();
      }
    });
    cv.addEventListener('pointerup', () => {
      if (drag) { this.mode = 'fall'; this.player.play('falling', { facing: 'front' }); cv.style.cursor = 'grab'; }
      else if (down) {
        const now = performance.now();
        clicks = clicks.filter((t) => now - t < 900); clicks.push(now);
        if (clicks.length >= 3) { clicks = []; this.act('celebrate'); this.say('¡Eso!', 1200); }
        else this.poke();
      }
      down = null; drag = false;
    });
    cv.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); this.poke(); }
      if (e.key === 'Escape') this.hide();
    });
    const wake = () => {
      this.lastInput = performance.now();
      if (this.player.clip === 'sleep') { this.act('wake'); }
    };
    addEventListener('pointermove', wake, { passive: true });
    addEventListener('keydown', wake);
    addEventListener('resize', () => { this.x = Math.min(this.x, this._W() - 20); this._place(); });
    new MutationObserver(() => {
      const j = document.documentElement.dataset.juice;
      if (j && LEVELS[j]) this.setJuice(j);
    }).observe(document.documentElement, { attributes: true, attributeFilter: ['data-juice'] });
  }

  _loop(t, prev) {
    const dt = Math.min(64, t - prev);
    this.player.tick(dt);
    const s = dt / 1000;
    if (this.mode === 'fall') {
      this.vy -= 2600 * s; this.y += this.vy * s; this.x += this.vx * s; this.vx *= 0.995;
      const half = this.canvas.width / 2;
      if (this.x < half) { this.x = half; this.vx = Math.abs(this.vx) * 0.5; }
      if (this.x > this._W() - half) { this.x = this._W() - half; this.vx = -Math.abs(this.vx) * 0.5; }
      if (this.y <= 0) {
        this.y = 0; this.vy = 0; this.vx = 0; this.mode = 'brain';
        this.player.play('land', { facing: 'front' });
        this._blip(120, 0.06);
        this._next = t + 1200;
      }
      this._place();
    } else if (this.mode === 'brain') {
      if (this.target !== null) {
        const tag = this.player.tag;
        const v = (tag?.speed || 19) * this.opts.scale;
        const dir = Math.sign(this.target - this.x);
        this.x += dir * v * s;
        if ((dir > 0 && this.x >= this.target) || (dir < 0 && this.x <= this.target) || !dir) {
          this.x = this.target; this.target = null; this.player.play('idle', { facing: 'front' });
          this._next = t + 800;
        }
        this._place();
      } else if (t > this._next && (this.player.tag?.loop || this.player._done)) {
        this._decide(t);
      }
    }
    this._raf = requestAnimationFrame((n) => this._loop(n, t));
  }

  _decide(t) {
    const L = LEVELS[this.level];
    if (this.level === 'nada') { this.player.play('idle', { facing: 'front' }); this.player.paused = true; this._next = Infinity; return; }
    this.player.paused = false;
    const idleFor = t - this.lastInput;
    const cur = this.player.clip;
    if (idleFor > this.opts.sleepAfter && cur !== 'sleep') {
      if (cur === 'sit' || cur === 'sit_down') this.act('sleep');
      else this.act('sit_down', 'sit');
      this._next = t + 4000; return;
    }
    if (cur === 'sleep') { this._next = t + 3000; return; }
    const r = Math.random();
    const [a, b] = L.every;
    this._next = t + a + Math.random() * (b - a);
    if (r < L.walk + L.run) {
      const margin = this.canvas.width;
      const to = Math.round(margin + Math.random() * (this._W() - margin * 2));
      this.walkTo(to, r < L.run);
    } else if (r < L.walk + L.run + L.fun) {
      const pick = ACTIVITIES[Math.floor(Math.random() * ACTIVITIES.length)];
      this.act(pick);
      if (pick === 'talk') this.say(['¿Jugamos?', 'Ando probando cosas', 'Kaizen & Play', '¿Qué construimos hoy?'][Math.floor(Math.random() * 4)], 2200);
    } else {
      this.player.play(Math.random() < 0.5 ? 'idle' : 'idle_look', { facing: Math.random() < 0.6 ? 'front' : this.player.facing });
    }
  }

  // ---------- API pública ----------
  walkTo(x, run = false) {
    this.target = x;
    this.player.play(run ? 'run' : 'walk', { facing: x >= this.x ? 'right' : 'left' });
  }
  async act(clip, then) {
    this.target = null; this.mode = 'brain';
    const facing = ['wave', 'celebrate', 'dance', 'ay', 'sleep', 'sit', 'sit_down', 'wake', 'talk', 'nod'].includes(clip) ? 'front' : (this.player.facing === 'back' ? 'right' : this.player.facing);
    this._then = then ? { clip, next: then } : null;
    await this.player.play(clip, { facing, restart: true });
  }
  poke() {
    this.act('ay');
    this._blip(660, 0.05); setTimeout(() => this._blip(440, 0.05), 90);
    this.lastInput = performance.now();
  }
  say(text, ms = 2000) {
    const b = this.bubble;
    b.textContent = text;
    b.style.opacity = '1'; b.style.transform = 'translateY(0) scale(1)';
    clearTimeout(this._sayT);
    this._sayT = setTimeout(() => { b.style.opacity = '0'; b.style.transform = 'translateY(6px) scale(.8)'; }, ms);
    this._place();
  }
  emote(name, ms) { this.player.showEmote(name, ms); }
  setJuice(level) { if (LEVELS[level]) { this.level = level; this.player.paused = false; this._next = performance.now() + 300; } }
  hide() { this.root.style.display = 'none'; }
  show() { this.root.style.display = ''; }
  destroy() { cancelAnimationFrame(this._raf); this.root.remove(); }

  _place() {
    const cv = this.canvas;
    const w = cv.width, h = cv.height;
    cv.style.width = w + 'px'; cv.style.height = h + 'px';
    if (this.opts.place) { this.opts.place(this, { x: this.x, y: this.y, w, h }); return; }
    cv.style.left = Math.round(this.x - w / 2) + 'px';
    cv.style.bottom = Math.round(this.y - this.opts.scale * 3) + 'px';
    const [hx, hy] = this.player.anchor('head_top');
    this.bubble.style.left = Math.round(this.x - w / 2 + hx + 6) + 'px';
    this.bubble.style.bottom = Math.round(this.y + (h - hy) + 6) + 'px';
  }

  // Sonido corto (solo después del primer gesto; opción sound:false lo apaga)
  _unlockAudio() {
    if (!this.opts.sound || this.ac) return;
    try { this.ac = new (window.AudioContext || window.webkitAudioContext)(); } catch { this.ac = null; }
  }
  _blip(freq, dur) {
    if (!this.ac || this.level === 'nada') return;
    const o = this.ac.createOscillator(), g = this.ac.createGain();
    o.type = 'square'; o.frequency.value = freq;
    g.gain.setValueAtTime(0.04, this.ac.currentTime);
    g.gain.exponentialRampToValueAtTime(0.0001, this.ac.currentTime + dur);
    o.connect(g).connect(this.ac.destination); o.start(); o.stop(this.ac.currentTime + dur);
  }
}
