# Integraciones

Todo lo que necesitas está en `dist/`. Usa la vista correcta en lugar de espejar: `right`, `left`, `front`, `back`.

## Web

### Mascota pega-y-listo

```html
<script src="https://moki.jorgesuarez.com.mx/pixel/dist/runtime/moki-pet.js"
        data-juice="poquito" data-hello="¡Hola!" data-scale="2"></script>
```

| Atributo | Valores | Default |
|---|---|---|
| `data-juice` | `nada`, `poquito`, `mucho`, `hardcore` | `mucho` |
| `data-scale` | 1, 2, 3 | 2 |
| `data-size` | 64, 128 | 64 |
| `data-sound` | `false` para apagar | encendido tras el primer clic |
| `data-greet` | `false` para no saludar | saluda |
| `data-pet` | `false` para no crear la mascota | crea |

API en `window.MokiPixel.pet`: `say(texto, ms)`, `act(clip)`, `walkTo(x, correr)`, `emote(nombre, ms)`, `setJuice(nivel)`, `hide()`, `show()`, `destroy()`.

Si la página pone `<html data-juice="nada">` (como el botón «Juega» de la marca), Moki obedece en vivo. Con `prefers-reduced-motion` se queda quieto.

### Componente

```html
<script type="module" src="https://moki.jorgesuarez.com.mx/pixel/dist/runtime/moki.mjs"></script>
<moki-sprite clip="wave" facing="front" size="64" scale="3" emote="heart"></moki-sprite>
```

Atributos vivos: `clip`, `facing`, `emote`, `paused`. Funciona dentro de React, Vue, Svelte o Astro como cualquier elemento HTML.

### Módulo

```js
import { MokiPlayer } from 'https://moki.jorgesuarez.com.mx/pixel/dist/runtime/moki.mjs';
const p = new MokiPlayer(canvas, { size: 64, scale: 3, facing: 'right', clip: 'run' });
p.on('event', (e) => e.name === 'land' && puff());
requestAnimationFrame(function loop(t) { p.tick(16.7); requestAnimationFrame(loop); });
```

## Phaser 3

El JSON de cada atlas es formato Aseprite (hash), así que Phaser lo lee directo:

```js
preload() {
  this.load.aseprite('moki-r', 'moki-64-right.png', 'moki-64-right.json');
  this.load.aseprite('moki-l', 'moki-64-left.png', 'moki-64-left.json');
}
create() {
  this.anims.createFromAseprite('moki-r');
  this.moki = this.add.sprite(160, 120, 'moki-r').setOrigin(0.5, 61 / 64);
  this.moki.play({ key: 'run', repeat: -1 });
}
```

Para voltear, cambia de textura (`moki-l`), no uses `setFlipX`. Si cargas ambas vistas con `createFromAseprite`, las animaciones se llaman igual: crea las de la izquierda con un prefijo o en otra escena.

## Godot 4

1. Copia `dist/sprites/64/*.png` a `res://moki/`.
2. Copia `dist/engines/godot/moki-64-right.tres` (y las demás vistas) a tu proyecto.
3. En un `AnimatedSprite2D`: `sprite_frames = preload("res://moki/moki-64-right.tres")` y `play("walk")`.
4. Project Settings → Rendering → Textures → Default Texture Filter: **Nearest**.

Offset sugerido: `offset = Vector2(0, -29)` para que el pivote quede entre las suelas.

## Unity

1. Importa `moki-64-right.png`: Texture Type **Sprite (2D and UI)**, Sprite Mode **Multiple**, Filter **Point**, Compression **None**, Pixels Per Unit 64.
2. Sprite Editor → Slice → **Grid By Cell Size** 64×64, pivote personalizado (0.5, 3/64).
3. Opcional: copia `dist/engines/unity/MokiAtlasImporter.cs` a `Assets/Editor/` y usa el menú **Moki → Crear clips desde atlas** para generar los AnimationClip con las duraciones del JSON. Ese script no se ha probado en Unity todavía.

## GameMaker

Arrastra cualquier `dist/strips/64/right/moki_walk_right_strip12.png`: GameMaker lo corta solo por el sufijo `_strip12`. Origen: x 32, y 61. Velocidad: 12 fps.

## Construct, RPG Maker, Defold, LÖVE y otros

Usa las tiras (`dist/strips/`) o la rejilla del atlas. Cuadros de tamaño fijo, sin recorte, sin rotación.

## Apps móviles

- **Web view, PWA, Capacitor:** el componente `<moki-sprite>`.
- **Nativo (Swift, Kotlin, Flutter):** dibuja el atlas con filtro nearest y lee duraciones del JSON. Para algo rápido usa los GIF de `dist/gif/`.

## Wallpapers

`dist/wallpapers/`: 4 escenas (cosmos, taller, juega, hola) × 6 tamaños. Para otros tamaños: `node tools/wallpapers.mjs` editando `TARGETS`.

## Videos

Ver [escenas.md](escenas.md).

## Escritorio

Ver [desktop/README.md](../desktop/README.md).
