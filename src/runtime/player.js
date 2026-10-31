// Reproductor de sprites de Moki para navegador. Sin dependencias.
// Lee los atlas exportados (Aseprite JSON + PNG), respeta duraciones por cuadro,
// cambia de vista cargando el atlas de esa vista (nunca espejando: canon C03).

const DEFAULT_BASE = (() => {
  try {
    const s = document.currentScript?.src || import.meta.url;
    return new URL('../', s).href; // .../dist/
  } catch { return 'https://moki.jorgesuarez.com.mx/pixel/dist/'; }
})();

const atlasCache = new Map();
export async function loadAtlas(base, size, facing) {
  const key = `${base}|${size}|${facing}`;
  if (!atlasCache.has(key)) {
    atlasCache.set(key, (async () => {
      const url = `${base}sprites/${size}/moki-${size}-${facing}`;
      const [json, img] = await Promise.all([
        fetch(`${url}.json`).then((r) => { if (!r.ok) throw new Error(`No pude cargar ${url}.json`); return r.json(); }),
        new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = `${url}.png`; }),
      ]);
      const tags = {};
      for (const t of json.meta.frameTags) tags[t.name] = t;
      return { json, img, tags, size, facing };
    })());
  }
  return atlasCache.get(key);
}

let emoteImg = null;
let emoteMeta = null;
async function loadEmotes(base, size) {
  if (emoteImg && emoteMeta?._size === size) return;
  const tag = size >= 128 ? 128 : 64;
  emoteMeta = await fetch(`${base}fx/emotes-${tag}.json`).then((r) => r.json());
  emoteMeta._size = size;
  emoteImg = await new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = `${base}fx/emotes-${tag}.png`; });
}

export class MokiPlayer {
  // canvas: HTMLCanvasElement; opts: { base, size, scale, facing, clip }
  constructor(canvas, opts = {}) {
    this.canvas = canvas;
    this.g = canvas.getContext('2d');
    this.base = opts.base || DEFAULT_BASE;
    this.size = opts.size || 64;
    this.scale = Math.max(1, Math.round(opts.scale || 2)); // siempre entero
    this.facing = opts.facing || 'right';
    this.clipName = opts.clip || 'idle';
    this.padTop = opts.padTop ?? Math.round(this.size * 0.45); // aire para saltos y emotes
    this.speed = 1;
    this.listeners = {};
    this.emote = null;
    this.paused = false;
    this._t = 0; this._frame = 0; this._acc = 0;
    canvas.width = this.size * this.scale;
    canvas.height = (this.size + this.padTop) * this.scale;
    canvas.style.imageRendering = 'pixelated';
    this.ready = this._load();
  }
  on(ev, fn) { (this.listeners[ev] ||= []).push(fn); return this; }
  emit(ev, data) { (this.listeners[ev] || []).forEach((f) => f(data)); }

  async _load() {
    this.atlas = await loadAtlas(this.base, this.size, this.facing);
    await loadEmotes(this.base, this.size).catch(() => {});
    this._resetClip();
    this.draw();
  }
  _resetClip() {
    const tag = this.atlas.tags[this.clipName] || this.atlas.tags.idle;
    this.tag = tag; this._frame = tag.from; this._acc = 0; this._done = false;
    this.emit('clip', { clip: tag.name });
  }
  has(clip) { return !!this.atlas?.tags[clip]; }
  get clip() { return this.clipName; }
  get frame() { return this.atlas?.json.frames[String(this._frame)]; }

  async play(clip, { facing, restart = false } = {}) {
    if (facing && facing !== this.facing) await this.face(facing);
    if (!this.atlas.tags[clip]) {
      // Clip sin esa vista (p. ej. «ready» de frente): usa la vista derecha
      if (this.facing !== 'right') { await this.face('right'); }
      if (!this.atlas.tags[clip]) return false;
    }
    if (clip === this.clipName && !restart && !this._done) return true;
    this.clipName = clip;
    this._resetClip();
    return true;
  }
  async face(facing) {
    if (facing === this.facing && this.atlas) return;
    this.facing = facing;
    this.atlas = await loadAtlas(this.base, this.size, facing);
    if (!this.atlas.tags[this.clipName]) this.clipName = 'idle';
    this._resetClip();
  }
  showEmote(name, ms = 1500) { this.emote = { name, t0: performance.now(), ms }; }

  // Avanza dt (ms) y dibuja
  tick(dt) {
    if (!this.atlas || this.paused) return;
    this._acc += dt * this.speed;
    const tag = this.tag;
    let f = this.atlas.json.frames[String(this._frame)];
    while (this._acc >= f.duration) {
      this._acc -= f.duration;
      if (this._frame < tag.to) this._frame++;
      else if (tag.loop) { this._frame = tag.from; this.emit('loop', { clip: tag.name }); }
      else { if (!this._done) { this._done = true; this.emit('end', { clip: tag.name }); } this._acc = 0; break; }
      f = this.atlas.json.frames[String(this._frame)];
      for (const e of f.events || []) this.emit('event', { name: e, clip: tag.name, frame: f });
    }
    // emote automático del clip
    if (tag.emote && !this.emote && this._frame === tag.from && this._acc < dt + 1) {
      setTimeout(() => this.showEmote(tag.emote.name, 1400), (tag.emote.t || 0) * 1000);
    }
    this.draw();
  }
  draw() {
    const { g, size, scale, padTop } = this;
    const f = this.frame;
    if (!f) return;
    g.imageSmoothingEnabled = false;
    g.clearRect(0, 0, this.canvas.width, this.canvas.height);
    const y = padTop - Math.min(f.air || 0, padTop);
    g.drawImage(this.atlas.img, f.frame.x, f.frame.y, size, size, 0, y * scale, size * scale, size * scale);
    if (this.emote && emoteImg) {
      const el = performance.now() - this.emote.t0;
      if (el > this.emote.ms) this.emote = null;
      else {
        const m = emoteMeta.emotes[this.emote.name];
        if (m) {
          const stage = el < 60 ? 0 : el < 120 ? 1 : el < 120 + 900 ? 2 : 3;
          const { w, h } = emoteMeta.frameSize;
          const [hx, hy] = f.anchors.head_top;
          const ex = Math.min(this.size - w, hx + 3), ey = y + hy - h + 2;
          g.drawImage(emoteImg, stage * w, m.row * h, w, h, ex * scale, Math.max(0, ey) * scale, w * scale, h * scale);
        }
      }
    }
  }
  // Ancla en pixeles CSS relativos al canvas
  anchor(name) {
    const f = this.frame; if (!f) return [0, 0];
    const [x, y] = f.anchors[name] || [0, 0];
    return [x * this.scale, (y + this.padTop - (f.air || 0)) * this.scale];
  }
}
