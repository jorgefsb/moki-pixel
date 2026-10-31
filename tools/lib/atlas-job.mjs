// Trabajo de exportación para un tamaño + vista. Corre en worker_threads.
import { parentPort, workerData } from 'node:worker_threads';
import { mkdirSync, writeFileSync } from 'node:fs';
import { createCanvas, ImageData } from '@napi-rs/canvas';
import gifenc from 'gifenc';
const { GIFEncoder } = gifenc;
import { clipFrames, clipsForFacing, EXPORT_FPS } from './frames.mjs';
import { CLIPS } from '../../src/anim/clips.js';
import { flatPalette, hexToRgb } from '../../src/core/palette.js';
import { emoteFrame } from '../../src/core/fx.js';

const { size, facing, out, version } = workerData;
const names = clipsForFacing(facing);
const all = [];
const tags = [];
for (const name of names) {
  const fr = clipFrames(name, facing, size);
  const from = all.length;
  fr.forEach((f) => all.push({ ...f, clip: name }));
  const c = CLIPS[name];
  tags.push({
    name, from, to: all.length - 1, direction: 'forward',
    loop: !!c.loop, group: c.group, speed: c.speed ? Math.round(c.speed * (size / 1280) * 10) / 10 : 0,
    emote: c.emote || null, principles: c.principles || [], note: c.note || '',
  });
}

// Atlas en rejilla (máx 4096 px de ancho)
const cols = Math.min(all.length, Math.floor(4096 / size));
const rows = Math.ceil(all.length / cols);
const atlas = createCanvas(cols * size, rows * size);
const g = atlas.getContext('2d');
const json = { frames: {}, meta: {} };
all.forEach((f, i) => {
  const x = (i % cols) * size, y = Math.floor(i / cols) * size;
  g.putImageData(new ImageData(f.data, f.w, f.h), x, y);
  json.frames[String(i)] = {
    frame: { x, y, w: size, h: size }, rotated: false, trimmed: false,
    spriteSourceSize: { x: 0, y: 0, w: size, h: size }, sourceSize: { w: size, h: size },
    duration: f.duration,
    // Extensiones de Moki (los motores las ignoran sin romperse)
    clip: f.clip, air: f.air, anchors: f.anchors, events: f.events,
  };
});
const base = `moki-${size}-${facing}`;
const dir = `${out}/sprites/${size}`;
mkdirSync(dir, { recursive: true });
json.meta = {
  app: 'https://github.com/jorgefsb/moki-pixel', version, image: `${base}.png`, format: 'RGBA8888',
  size: { w: cols * size, h: rows * size }, scale: '1', frameTags: tags, layers: [], slices: [],
  moki: {
    facing, frameSize: size, fps: EXPORT_FPS, pivot: { x: size / 2, y: size === 32 ? 30 : size === 64 ? 61 : 122 },
    note: 'Pivote = punto entre suelas. «air» = altura (px) que el motor suma hacia arriba. Anclas en px del cuadro.',
    canon: 'MOKI solo en oreja derecha anatómica; vistas generadas por geometría, nunca espejadas.',
  },
};
writeFileSync(`${dir}/${base}.png`, atlas.toBuffer('image/png'));
writeFileSync(`${dir}/${base}.json`, JSON.stringify(json));

// Tiras por clip (convención GameMaker: nombre_stripN.png)
const sdir = `${out}/strips/${size}/${facing}`;
mkdirSync(sdir, { recursive: true });
for (const t of tags) {
  const n = t.to - t.from + 1;
  const c = createCanvas(n * size, size);
  const cg = c.getContext('2d');
  for (let k = 0; k < n; k++) cg.putImageData(new ImageData(all[t.from + k].data, size, size), k * size, 0);
  writeFileSync(`${sdir}/moki_${t.name}_${facing}_strip${n}.png`, c.toBuffer('image/png'));
}

// Godot 4 SpriteFrames (.tres)
{
  const lines = [];
  lines.push(`[gd_resource type="SpriteFrames" load_steps=${all.length + 2} format=3]`, '');
  lines.push(`[ext_resource type="Texture2D" path="res://moki/${base}.png" id="1_atlas"]`, '');
  all.forEach((f, i) => {
    const fr = json.frames[String(i)].frame;
    lines.push(`[sub_resource type="AtlasTexture" id="AtlasTexture_${i}"]`, 'atlas = ExtResource("1_atlas")', `region = Rect2(${fr.x}, ${fr.y}, ${size}, ${size})`, '');
  });
  lines.push('[resource]');
  const anims = tags.map((t) => {
    const fr = [];
    for (let i = t.from; i <= t.to; i++) {
      const rel = Math.round((all[i].duration / (1000 / EXPORT_FPS)) * 100) / 100;
      fr.push(`{\n"duration": ${rel},\n"texture": SubResource("AtlasTexture_${i}")\n}`);
    }
    return `{\n"frames": [${fr.join(', ')}],\n"loop": ${t.loop},\n"name": &"${t.name}",\n"speed": ${EXPORT_FPS}.0\n}`;
  });
  lines.push(`animations = [${anims.join(', ')}]`, '');
  const gdir = `${out}/engines/godot`;
  mkdirSync(gdir, { recursive: true });
  writeFileSync(`${gdir}/${base}.tres`, lines.join('\n'));
}

// GIF de vista previa (64 px × 4, fondo transparente, emote compuesto)
if (size === 64 && facing !== 'back') {
  const pal = flatPalette().map(hexToRgb);
  const palette = [[0, 0, 0], ...pal];
  const lut = new Map(pal.map((c, i) => [c.join(','), i + 1]));
  const SC = 4, PAD = 26; // espacio arriba para emotes y saltos
  const gdir = `${out}/gif`;
  mkdirSync(gdir, { recursive: true });
  for (const t of tags) {
    const enc = GIFEncoder();
    const W = size * SC, H = (size + PAD) * SC;
    const frames = all.slice(t.from, t.to + 1);
    const emote = t.emote;
    let tAcc = 0;
    for (const f of frames) {
      const idx = new Uint8Array(W * H);
      const put = (x, y, r, gg, b, a) => {
        if (a < 128 || x < 0 || y < 0 || x >= size || y >= size + PAD) return;
        const k = lut.get(`${r},${gg},${b}`) ?? nearest(pal, r, gg, b);
        for (let yy = 0; yy < SC; yy++) for (let xx = 0; xx < SC; xx++) idx[(y * SC + yy) * W + x * SC + xx] = k;
      };
      for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
        const i = (y * size + x) * 4;
        put(x, y + PAD - f.air, f.data[i], f.data[i + 1], f.data[i + 2], f.data[i + 3]);
      }
      if (emote && tAcc >= (emote.t || 0) * 1000) {
        const stage = tAcc - emote.t * 1000 < 90 ? 1 : 2;
        const e = emoteFrame(emote.name, stage, 1);
        const [hx, hy] = f.anchors.head_top;
        const ox = hx + 3, oy = hy + PAD - f.air - e.h + 2;
        for (let y = 0; y < e.h; y++) for (let x = 0; x < e.w; x++) {
          const i = (y * e.w + x) * 4;
          put(ox + x, oy + y, e.data[i], e.data[i + 1], e.data[i + 2], e.data[i + 3]);
        }
      }
      tAcc += f.duration;
      enc.writeFrame(idx, W, H, { palette, delay: f.duration, transparent: true, transparentIndex: 0, repeat: 0 });
    }
    enc.finish();
    writeFileSync(`${gdir}/moki_${t.name}_${facing}.gif`, enc.bytes());
  }
}

function nearest(pal, r, g, b) {
  let best = 1, bd = 1e9;
  pal.forEach((c, i) => { const d = (c[0] - r) ** 2 + (c[1] - g) ** 2 + (c[2] - b) ** 2; if (d < bd) { bd = d; best = i + 1; } });
  return best;
}

parentPort.postMessage({ size, facing, frames: all.length, clips: tags.length, atlas: [cols * size, rows * size] });
