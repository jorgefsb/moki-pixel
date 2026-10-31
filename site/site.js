import { MokiPet } from './dist/runtime/moki.mjs';

const $ = (s, r = document) => r.querySelector(s);
const manifest = await fetch('dist/manifest.json').then((r) => r.json());
$('#ver').textContent = `v${manifest.version}`;

const PRINCIPLES = {
  squash: ['Aplastar y estirar', 'Squash & stretch', 'Cuerpo ≤ 3 % (canon); el casco nunca se deforma.'],
  anticipacion: ['Anticipación', 'Anticipation', 'Se agacha antes de saltar, echa el brazo atrás antes de saludar.'],
  staging: ['Puesta en escena', 'Staging', 'Una acción clara por pose; silueta legible a 64 px.'],
  'pose-a-pose': ['Directo y pose a pose', 'Straight ahead & pose to pose', 'Llaves para gestos; ciclos y física de forma procedural.'],
  'follow-through': ['Acción continuada', 'Follow-through', 'La mochila llega 2-3 cuadros tarde y se asienta.'],
  'slow-in-out': ['Entradas y salidas lentas', 'Slow in & slow out', 'Curvas de aceleración por llave.'],
  arcos: ['Arcos', 'Arcs', 'Manos, saltos y malabares viajan en arcos.'],
  secundaria: ['Acción secundaria', 'Secondary action', 'Respiración, mochila, cabeza que acompaña.'],
  timing: ['Timing', 'Timing', 'Exporta a 12 fps con holds automáticos.'],
  exageracion: ['Exageración', 'Exaggeration', 'Rebases (outBack) dentro del canon.'],
  'dibujo-solido': ['Dibujo sólido', 'Solid drawing', 'Un solo modelo 3D proxy para todas las vistas.'],
  appeal: ['Atractivo', 'Appeal', 'Casco grande, cuerpo corto, silueta clara.'],
};
const GROUP_EN = { locomocion: 'Locomotion', salto: 'Jump', gestos: 'Gestures', emociones: 'Emotions', actividades: 'Activities', descanso: 'Rest', mascota: 'Pet' };

// ---------- Galería ----------
function renderGrid() {
  const facing = $('#facing').value, size = +$('#size').value;
  const scale = size === 32 ? 3 : size === 64 ? 2 : 1;
  const grid = $('#grid');
  grid.innerHTML = '';
  const en = document.documentElement.lang === 'en';
  for (const [name, c] of Object.entries(manifest.clips)) {
    if (!c.facings.includes(facing)) continue;
    const card = document.createElement('article');
    card.className = 'clip';
    card.innerHTML = `<moki-sprite clip="${name}" facing="${facing}" size="${size}" scale="${scale}" label="Moki: ${name}"></moki-sprite>
      <h3>${name}</h3><p class="grp">${en ? GROUP_EN[c.group] : manifest.groups[c.group]} · ${c.duration}s${c.loop ? ' · loop' : ''}</p>
      <p class="note">${c.note}</p>
      <p class="chips">${(c.principles || []).map((p) => `<span>${(PRINCIPLES[p] || [p])[en ? 1 : 0]}</span>`).join('')}</p>`;
    card.addEventListener('click', () => { const el = card.querySelector('moki-sprite'); el.player?.play(name, { restart: true }); });
    grid.appendChild(card);
  }
}
$('#facing').addEventListener('change', renderGrid);
$('#size').addEventListener('change', renderGrid);
renderGrid();

// ---------- Emotes ----------
{
  const g = $('#emoteGrid');
  for (const [k, label] of Object.entries(manifest.emotes)) {
    const d = document.createElement('div');
    d.className = 'emote';
    d.innerHTML = `<moki-sprite clip="idle" facing="front" size="64" scale="2" emote="${k}"></moki-sprite><p><b>${k}</b><br>${label}</p>`;
    g.appendChild(d);
  }
}

// ---------- Principios ----------
{
  const g = $('#prGrid');
  const count = {};
  for (const c of Object.values(manifest.clips)) for (const p of c.principles || []) count[p] = (count[p] || 0) + 1;
  for (const [k, [es, en, how]] of Object.entries(PRINCIPLES)) {
    const d = document.createElement('div');
    d.className = 'pr';
    d.innerHTML = `<b>${es}</b><i>${en}</i><p>${how}</p><small>${count[k] || 0} clips</small>`;
    g.appendChild(d);
  }
}

// ---------- Wallpapers ----------
{
  const scenes = ['cosmos', 'taller', 'juega', 'hola'];
  const targets = [['escritorio-1080p', '1920x1080'], ['escritorio-1440p', '2560x1440'], ['escritorio-4k', '3840x2160'], ['ultrawide-3440', '3440x1440'], ['celular-iphone', '1170x2532'], ['celular-android', '1080x2400']];
  const g = $('#wpGrid');
  for (const s of scenes) {
    const d = document.createElement('div');
    d.className = 'wp';
    d.innerHTML = `<img loading="lazy" src="dist/wallpapers/moki-${s}-escritorio-1080p-1920x1080.png" alt="Wallpaper ${s}">
      <p><b>${s}</b> ${targets.map(([t, r]) => `<a href="dist/wallpapers/moki-${s}-${t}-${r}.png" download>${r}</a>`).join(' ')}</p>`;
    g.appendChild(d);
  }
}

// ---------- Tabs ----------
document.querySelectorAll('[role=tab]').forEach((b) => b.addEventListener('click', () => {
  document.querySelectorAll('[role=tab]').forEach((x) => x.setAttribute('aria-selected', x === b));
  document.querySelectorAll('[data-panel]').forEach((p) => { p.hidden = p.dataset.panel !== b.dataset.tab; });
}));

// ---------- Héroe: Moki cambia de acción ----------
{
  const hero = $('#heroMoki');
  const seq = [['wave', 'front'], ['idle_look', 'right'], ['juggling', 'right'], ['think', 'front'], ['idea', 'front'], ['play', 'right'], ['dance', 'front'], ['celebrate', 'front']];
  let i = 0;
  setInterval(() => {
    if (document.documentElement.dataset.juice === 'nada') return;
    i = (i + 1) % seq.length;
    hero.setAttribute('facing', seq[i][1]);
    hero.setAttribute('clip', seq[i][0]);
  }, 3200);
}

// ---------- Mascota en la página + nivel de juego ----------
const pet = new MokiPet({ juice: localStorage.getItem('moki-juice') || 'poquito', scale: innerWidth < 700 ? 1 : 2 });
window.MokiPixel = { pet };
const sel = $('#juice');
sel.value = pet.level;
sel.addEventListener('change', () => { document.documentElement.dataset.juice = sel.value; localStorage.setItem('moki-juice', sel.value); pet.setJuice(sel.value); });

// ---------- Idioma ES/EN ----------
const EN = {
  skip: 'Skip to content', 'nav.gallery': 'Animations', 'nav.use': 'Use it', 'nav.dl': 'Downloads', juice: 'Play',
  'j.nada': 'None', 'j.poco': 'A little', 'j.mucho': 'A lot', kicker: 'Animation kit · pixel art · open source',
  h1: 'Moki, in pixel art, ready to play.',
  lead: '43 animations built on the 12 principles of animation, 4 views, 3 sizes, emotes, wallpapers, programmatic videos with Claude and a pet that lives on your desktop or your website.',
  'cta.dl': 'Download the kit', 'cta.gh': 'See the repo', 'cta.use': 'Put it on your site', 'cta.anim': 'See animations',
  'why.h': 'Why it exists',
  'why.p1': 'Moki is Jorge Suárez’s explorer alter ego: he discovers, makes mistakes and builds worlds while learning. This kit turns him into a character anyone can use to explore and play with AI and video games: in a game, a website, an app, a wallpaper or a video.',
  'why.p2': 'We made it open because that is how you learn best: test small, share, try again. Code is MIT; Moki’s art is CC BY-NC 4.0 (give credit, no commercial use).',
  sig: 'Made with love ❤️🎮 by JorgeSuarez.com.mx', 'gal.h': 'Animations', 'gal.view': 'View', 'gal.size': 'Size',
  'f.r': 'Right', 'f.l': 'Left', 'f.f': 'Front', 'f.b': 'Back',
  'gal.hint': 'Every view comes from Moki’s geometry: never mirrored, so the MOKI patch always stays on his right ear.',
  'em.h': 'Faceless expressions', 'em.p': 'Moki’s visor has no eyes or mouth. He expresses with posture, gesture and timing, plus paper bubbles above the helmet.',
  'pr.h': 'The 12 principles of animation, applied', 'use.h': 'Use it', 'dl.h': 'Downloads', 'dl.kit': 'Full kit (ZIP)',
  'dl.kit.s': 'Atlases, strips, Godot, FX, GIFs, guides', 'dl.sheet': 'Character sheet', 'dl.wp.s': 'Desktop, 4K, ultrawide and phone', 'dl.desk': 'Desktop pet',
  'foot.studio': '← Moki Studio', 'foot.lic': 'Code MIT · Art CC BY-NC 4.0',
  'foot.status': 'Status: pixel art proposal based on Moki’s design approved on Oct 12, 2026. Pending approval.',
};
const ES = {};
document.querySelectorAll('[data-i18n]').forEach((el) => { ES[el.dataset.i18n] = el.innerHTML; });
function setLang(l) {
  document.documentElement.lang = l;
  document.querySelectorAll('[data-i18n]').forEach((el) => {
    const k = el.dataset.i18n;
    if (l === 'en' && EN[k] && k !== 'foot.sig') el.innerHTML = EN[k];
    else if (k === 'foot.sig') el.innerHTML = l === 'en' ? 'Made with love ❤️🎮 by <a href="https://jorgesuarez.com.mx">JorgeSuarez.com.mx</a> to explore and play with AI and video games.' : ES[k];
    else el.innerHTML = ES[k];
  });
  $('#lang').textContent = l === 'en' ? 'ES' : 'EN';
  try { localStorage.setItem('moki-language', l); } catch {}
  renderGrid();
}
$('#lang').addEventListener('click', () => setLang(document.documentElement.lang === 'en' ? 'es' : 'en'));
{ let saved = null; try { saved = localStorage.getItem('moki-language') || localStorage.getItem('moki-lang'); } catch {} if (saved === 'en') setLang('en'); }
