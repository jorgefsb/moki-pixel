/* Moki HD: galería que se arma sola desde dist/catalog.json (lo escribe tools/site.mjs). */
(function () {
  'use strict';
  var KEY = 'moki-language';
  var T = {
    es: {
      skip: 'Saltar al contenido', kicker: 'Pack de animación · alta resolución · versión 0.1 (propuesta)',
      h1: 'Moki, de cartón y en movimiento.',
      lead: 'Las 43 animaciones de Moki en alta resolución, con acabado de papel mate. Sale del mismo esqueleto que Moki Pixel, así que el canon viene incluido: el parche MOKI siempre en su oreja derecha, el visor sin cara y nunca en espejo.',
      'cta.ver': 'Ver las animaciones', 'cta.pixel': 'Ir a Moki Pixel', 'cta.code': 'Código en GitHub',
      'f.clips': 'animaciones', 'f.vistas': 'vistas', 'f.size': 'por cuadro', 'f.fps': 'cuadros por segundo',
      'g.h': 'Todas las animaciones', 'v.right': 'Derecha', 'v.front': 'Frente', 'v.left': 'Izquierda', 'v.back': 'Espalda',
      'g.note': 'Cada tarjeta trae video con transparencia (WebM), MP4 sobre crema para redes, GIF y hoja de cuadros con su JSON para juegos. Espalda solo existe en caminar, correr y respirar.',
      'h.how': 'Cómo se hizo',
      'p.how1': 'Moki Pixel arma a Moki con piezas geométricas y un esqueleto de 16 huesos. Moki HD dibuja ese mismo modelo en alta resolución: luz suave sobre papel mate, fibra de cartón, sombra donde una pieza toca a otra y un borde de recorte.',
      'p.how2': 'Como cada vista sale de girar el modelo y no de voltear una imagen, el parche MOKI nunca cambia de oreja. Las letras del parche y el control del pecho se redibujan en vector para que se lean limpios a cualquier tamaño.',
      'h.use': 'Úsalo',
      u1: 'Páginas y apps: el WebM tiene transparencia; el MP4 va sobre crema para redes.',
      u2: 'Juegos: la hoja de cuadros (WebP) trae columnas y medidas en su JSON, más el salto de cada cuadro para aplicarlo en tu motor.',
      u3: 'Videos: combínalo con las escenas programáticas de Moki Pixel.',
      u4: 'Licencia: el código es MIT; el arte de Moki es CC BY-NC 4.0, igual que Moki Pixel. Da crédito a JorgeSuarez.com.mx.',
      status: 'Estado: propuesta 0.1. El canon de Moki manda; si ves algo raro, avísanos.',
      foot: 'Hecho con amor ❤️🎮 por JorgeSuarez.com.mx para explorar y jugar con IA y videojuegos.',
      empty: 'Esta animación no tiene esa vista.', sheet: 'Hoja', btn: 'EN'
    },
    en: {
      skip: 'Skip to content', kicker: 'Animation pack · high resolution · version 0.1 (proposal)',
      h1: 'Moki, made of cardboard and on the move.',
      lead: 'All 43 Moki animations in high resolution, with a matte paper finish. Built from the same skeleton as Moki Pixel, so the canon comes included: the MOKI patch always on his right ear, a faceless visor and never mirrored.',
      'cta.ver': 'See the animations', 'cta.pixel': 'Go to Moki Pixel', 'cta.code': 'Code on GitHub',
      'f.clips': 'animations', 'f.vistas': 'views', 'f.size': 'per frame', 'f.fps': 'frames per second',
      'g.h': 'Every animation', 'v.right': 'Right', 'v.front': 'Front', 'v.left': 'Left', 'v.back': 'Back',
      'g.note': 'Each card has a video with transparency (WebM), an MP4 on cream for social, a GIF and a frame sheet with its JSON for games. Back view only exists for walk, run and idle.',
      'h.how': 'How it was made',
      'p.how1': 'Moki Pixel builds Moki from geometric pieces and a 16-bone skeleton. Moki HD draws that same model in high resolution: soft light on matte paper, cardboard fiber, shadow where one piece touches another and a cut-out edge.',
      'p.how2': 'Since every view comes from rotating the model, not flipping an image, the MOKI patch never switches ears. The patch letters and the chest gamepad are redrawn as vectors so they read clean at any size.',
      'h.use': 'Use it',
      u1: 'Pages and apps: the WebM has transparency; the MP4 sits on cream for social.',
      u2: 'Games: the frame sheet (WebP) lists columns and sizes in its JSON, plus each frame’s jump height to apply in your engine.',
      u3: 'Videos: combine it with Moki Pixel’s programmatic scenes.',
      u4: 'License: code is MIT; Moki’s art is CC BY-NC 4.0, same as Moki Pixel. Credit JorgeSuarez.com.mx.',
      status: 'Status: proposal 0.1. Moki’s canon rules; if something looks off, let us know.',
      foot: 'Made with love ❤️🎮 by JorgeSuarez.com.mx to explore and play with AI and video games.',
      empty: 'This animation has no such view.', sheet: 'Sheet', btn: 'ES'
    }
  };
  var lang = 'es';
  try { lang = localStorage.getItem(KEY) || localStorage.getItem('moki-lang') || 'es'; } catch (e) {}
  if (lang !== 'en') lang = 'es';
  var facing = 'right';
  var cat = null;
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

  function applyLang() {
    document.documentElement.lang = lang;
    document.querySelectorAll('[data-i18n]').forEach(function (el) { var v = T[lang][el.getAttribute('data-i18n')]; if (v) el.textContent = v; });
    document.getElementById('lang').textContent = T[lang].btn;
    if (cat) render();
  }
  document.getElementById('lang').addEventListener('click', function () {
    lang = lang === 'es' ? 'en' : 'es';
    try { localStorage.setItem(KEY, lang); } catch (e) {}
    applyLang();
  });

  var io = 'IntersectionObserver' in window ? new IntersectionObserver(function (es) {
    es.forEach(function (e) {
      var v = e.target;
      if (e.isIntersecting) { if (!v.src && v.dataset.src) v.src = v.dataset.src; if (!reduce) v.play().catch(function () {}); }
      else v.pause();
    });
  }, { rootMargin: '200px' }) : null;

  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

  function render() {
    var grid = document.getElementById('grid');
    var html = '';
    cat.clips.forEach(function (c) {
      var f = c.files[facing];
      var name = lang === 'en' ? c.en : c.es;
      var grp = lang === 'en' ? c.groupEn : c.groupEs;
      var desc = lang === 'en' ? (c.noteEn || '') : c.note;
      if (!f) return;
      var base = 'dist/' + c.id + '/' + c.id + '-' + facing;
      html += '<article class="card"><div class="media">' +
        '<video muted loop playsinline preload="none" poster="' + base + '-poster.png" data-src="' + base + '.mp4" aria-label="' + esc(name) + '"></video></div>' +
        '<div class="body"><p class="grp">' + esc(grp) + '</p><h3>' + esc(name) + '</h3><p class="desc">' + esc(desc) + '</p>' +
        '<div class="dl"><a href="' + base + '.webm" download>WebM α</a><a href="' + base + '.mp4" download>MP4</a><a href="' + base + '.gif" download>GIF</a><a href="' + base + '-sheet.webp" download>' + T[lang].sheet + '</a><a href="' + base + '.json" download>JSON</a></div></div></article>';
    });
    grid.innerHTML = html || '<p class="empty">' + T[lang].empty + '</p>';
    if (io) grid.querySelectorAll('video').forEach(function (v) { io.observe(v); });
    else grid.querySelectorAll('video').forEach(function (v) { v.src = v.dataset.src; });
  }

  document.querySelectorAll('[data-facing]').forEach(function (b) {
    b.addEventListener('click', function () {
      facing = b.getAttribute('data-facing');
      document.querySelectorAll('[data-facing]').forEach(function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); });
      render();
    });
  });

  var hero = document.getElementById('heroVid');
  if (hero && !reduce) hero.play().catch(function () {});

  fetch('dist/catalog.json', { cache: 'no-cache' }).then(function (r) { return r.json(); }).then(function (d) { cat = d; render(); }).catch(function () {});
  applyLang();
})();
