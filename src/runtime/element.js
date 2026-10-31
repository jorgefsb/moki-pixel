// <moki-sprite clip="wave" facing="right" size="64" scale="3"></moki-sprite>
// Web component: úsalo en cualquier sitio o framework (React, Vue, Svelte, Astro, HTML plano).
import { MokiPlayer } from './player.js';

export class MokiSpriteElement extends HTMLElement {
  static get observedAttributes() { return ['clip', 'facing', 'emote', 'paused']; }
  connectedCallback() {
    if (this._p) return;
    const root = this.attachShadow({ mode: 'open' });
    const cv = document.createElement('canvas');
    cv.setAttribute('role', 'img');
    cv.setAttribute('aria-label', this.getAttribute('label') || `Moki: ${this.getAttribute('clip') || 'idle'}`);
    cv.style.cssText = 'display:block;image-rendering:pixelated';
    root.appendChild(cv);
    const size = +(this.getAttribute('size') || 64);
    this._p = new MokiPlayer(cv, {
      base: this.getAttribute('base') || undefined, size, scale: +(this.getAttribute('scale') || 2),
      facing: this.getAttribute('facing') || 'right', clip: this.getAttribute('clip') || 'idle',
      padTop: this.hasAttribute('pad') ? +this.getAttribute('pad') : undefined,
    });
    const rm = matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (rm || this.hasAttribute('paused')) this._p.paused = true;
    let last = performance.now();
    this._visible = true;
    if ('IntersectionObserver' in window) new IntersectionObserver(([e]) => { this._visible = e.isIntersecting; }).observe(this);
    const loop = (t) => { if (!this.isConnected) return; if (this._visible) this._p.tick(t - last); last = t; requestAnimationFrame(loop); };
    this._p.ready.then(() => { requestAnimationFrame(loop); if (this.getAttribute('emote')) this._p.showEmote(this.getAttribute('emote'), 1e9); });
  }
  attributeChangedCallback(n, _o, v) {
    if (!this._p || !this._p.atlas) return;
    if (n === 'clip') this._p.play(v, { restart: true });
    if (n === 'facing') this._p.face(v);
    if (n === 'emote') v ? this._p.showEmote(v, 1e9) : (this._p.emote = null);
    if (n === 'paused') this._p.paused = v !== null;
  }
  get player() { return this._p; }
}
if (!customElements.get('moki-sprite')) customElements.define('moki-sprite', MokiSpriteElement);
