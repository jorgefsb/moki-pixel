---
name: moki-pixel
description: Crea escenas, GIFs, videos, sprites y wallpapers de Moki (el alter ego pixel art de JorgeSuarez.com.mx) con el kit moki-pixel, respetando su canon. Úsala cuando pidan animar a Moki, un video o short con Moki, un GIF, un sticker, un wallpaper o integrar a Moki en un juego, página o app.
---

# Moki Pixel

Kit: https://github.com/jorgefsb/moki-pixel · vivo en https://moki.jorgesuarez.com.mx/pixel/

## Antes de crear

1. Clona o ubica el repo y corre `npm install` (Node 20+). Para video necesitas `ffmpeg`.
2. Si `dist/` no existe o cambiaste clips: `npm run build`.
3. Lee `docs/guia-de-personaje.md` si la pieza tiene texto o emociones.

## Canon que no se negocia

- El parche MOKI vive en la oreja derecha anatómica. **Nunca espejes** (`flipX`, `scaleX(-1)`, flop): usa la vista `left`.
- El visor no lleva ojos, cejas, boca ni emoticonos. Las emociones van en burbujas sobre el casco (`emote`) o en el cuerpo (clip).
- Moki es curioso y cercano. Nada de agresión permanente, burla ni resultados de negocio inventados.
- Escala solo en enteros con vecino más cercano.
- Texto en español mexicano, corto. Firma: «Hecho con amor ❤️🎮 por JorgeSuarez.com.mx».

## Qué clip usar

| Intención | Clip |
|---|---|
| presentarse, saludar | `wave` |
| explicar, hablar | `talk` (+ `say`) |
| pensar | `think` (+ emote `dots`) |
| se le ocurre algo | `idea` |
| curiosidad | `curious` |
| decidir, aprobar | `decision`, `nod` |
| dudar | `doubt` |
| logro | `celebrate` (+ `fx: confetti`) |
| error, frustración | `frustrated`, `shake_no` |
| programar | `typing` |
| construir | `building` |
| jugar | `play` |
| moverse | `walk_to`, `run_to` |
| descanso | `sit`, `sleep` |
| reto de juego | `ready`, `attack` |

Lista completa con duraciones: `dist/manifest.json` o `docs/animacion.md`.

## Hacer un video o GIF

1. Escribe un guion en `scenes/<nombre>.json` (formato en `docs/escenas.md`). Una idea por pieza; usa `9:16` para shorts y `16:9` para YouTube.
2. Revisa un cuadro clave antes del render completo:
   `node tools/scene.mjs scenes/<nombre>.json --still 2.5 --out /tmp/check.png` y ábrelo.
3. Renderiza: `node tools/scene.mjs scenes/<nombre>.json --out salida.mp4` (o `.gif`, `.webm`).
4. Verifica el archivo final: duración (`ffprobe`), 3 cuadros extraídos, texto dentro de zona segura, parche del lado correcto cuando Moki mira a la derecha.

## Otras salidas

- Sticker o PNG suelto: `--still` con `"background": "transparente"`.
- Wallpaper: `node tools/wallpapers.mjs` (edita `SCENES` y `TARGETS`).
- Sprites para un juego: `dist/sprites/{32,64,128}/` y `docs/integraciones.md`.
- Moki en una página: `<script src="https://moki.jorgesuarez.com.mx/pixel/dist/runtime/moki-pet.js" data-juice="poquito"></script>`.

## Al entregar

Di qué clips y escena usaste, la ruta del archivo, qué verificaste y lo que quedó pendiente. No declares «listo para publicar» sin haber visto el archivo final.
