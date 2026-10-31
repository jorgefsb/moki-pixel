# Escenas y videos programáticos

Un guion JSON describe qué hace Moki y cuándo. El render es determinista: el mismo JSON da el mismo video.

```bash
node tools/scene.mjs scenes/hola-moki.json --out hola.mp4     # H.264
node tools/scene.mjs scenes/hola-moki.json --out hola.webm    # VP9
node tools/scene.mjs scenes/hola-moki.json --out hola.gif     # GIF ×2
node tools/scene.mjs scenes/hola-moki.json --still 3 --out cuadro.png
```

Requiere Node 20+ y `ffmpeg` para MP4/WebM.

## Formato

```json
{
  "format": "9:16",
  "background": "noche",
  "duration": 8,
  "size": 64,
  "start": { "x": 40, "facing": "right", "clip": "idle" },
  "timeline": [
    { "at": 0,   "walk_to": 90 },
    { "at": 2.5, "facing": "front", "play": "wave" },
    { "at": 2.6, "say": "¡Hola!", "for": 1.6 },
    { "at": 4,   "play": "think", "emote": "dots", "for": 1.4 },
    { "at": 5.5, "play": "celebrate", "fx": "confetti" },
    { "at": 5.6, "caption": "Prueba pequeño. Aprende rápido.", "pos": "bottom" }
  ]
}
```

| Campo | Qué hace |
|---|---|
| `format` | `16:9` (1920×1080), `9:16` (1080×1920), `1:1` (1080×1080), `4:5` (1080×1350). O `width`, `height`, `scale` en pixeles nativos |
| `background` | `noche`, `papel`, `taller`, `transparente` o un color `#hex` |
| `size` | 64 o 128 (sprites) |
| `fps` | cuadros del video (default 24); los sprites conservan su timing |
| `ground` | altura del piso en pixeles nativos |
| `signature` | `false` quita la firma `moki.jorgesuarez.com.mx` |

Eventos del `timeline` (se pueden combinar en uno):

| Evento | Ejemplo |
|---|---|
| `play` | `{ "at": 1, "play": "wave" }` (los clips sin loop regresan solos a `idle`) |
| `walk_to` / `run_to` | `{ "at": 0, "walk_to": 120 }` camina hasta x y se voltea solo |
| `facing` | `right`, `left`, `front`, `back` |
| `x` | teletransporta |
| `say` + `for` | burbuja de texto con Outfit 700 |
| `emote` + `for` | burbuja de ícono (`bang`, `question`, `dots`, `idea`, `star`, `heart`, `zz`, `scribble`, `music`, `check`, `gear`, `ay`) |
| `fx` | `confetti`, `dust`, `spark` |
| `caption` + `pos` | texto grande arriba o abajo, con reservas de zona segura (8 % lados; vertical 12 % arriba y 18 % abajo) |

El polvo de pasos y aterrizajes y las chispas de golpes salen solos de los eventos de cada clip.

## Para Claude

La skill [`claude/skills/moki-pixel`](../claude/skills/moki-pixel/SKILL.md) le enseña a Claude a escribir guiones, renderizar y revisar el resultado contra el canon.
