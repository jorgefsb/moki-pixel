# Guía de arte pixel · Moki

Estado: **propuesto**. Adaptación pixel art del diseño aprobado. Las bases de color vienen del brief; las rampas de luz y sombra son de este kit.

## Tamaños y unidades

El modelo mide H = 1000 u de la suela a la corona (brief P01).

| Tamaño | Cuadro | px por u | Suelo (pivote) | Detalle | Uso |
|---|---|---|---|---|---|
| 32 | 32×32 | 0.025 | y = 30 | 0: sin texto ni motas | íconos, HUD, mapas |
| 64 | 64×64 | 0.05 | y = 61 | 1: emblema y parche sugeridos | juegos, mascota, GIFs |
| 128 | 128×128 | 0.1 | y = 122 | 2: parche MOKI legible, emblema de mando | héroe, video, wallpapers |

- **Pivote:** el punto entre las suelas, centrado en x. Todas las animaciones comparten pivote: los pies no brincan entre clips.
- **Aire:** cuando Moki salta, el cuadro se dibuja en su lugar y el JSON trae `air` (px hacia arriba). El motor o el runtime lo suma. Así tu física controla la altura.
- **Escala:** solo múltiplos enteros con vecino más cercano. En CSS: `image-rendering: pixelated`.

## Paleta

| Material | Luz | Base | Sombra | Profunda | Rol |
|---|---|---|---|---|---|
| orange | `#FF9A66` | `#FF6B35` | `#DE4F27` | `#A8381E` | traje y franja |
| cream | `#FFF7EA` | `#F4E8D5` | `#DCC6A6` | `#B99168` | casco, puños, suelas, rodilleras |
| charcoal | `#4D4945` | `#34322F` | `#22211F` | `#171614` | guantes y botas |
| visor | `#3E3B38` | `#2B2927` | `#1E1D1B` | `#141312` | visor |
| petrol | `#71898A` | `#4C6260` | `#3B4D4B` | `#2A3735` | arnés y cinturón |
| kraft | `#D2AE86` | `#B99168` | `#97744F` | `#73573A` | bordes, suelo |
| contorno | | `#191613` | | | silueta exterior |

Bases: naranja `#FF6B35` heredado; crema `#F4E8D5`, tinta `#22211F`, kraft `#B99168` propuestos en el BrandKit 0.6; petróleo `#4C6260` propuesto en el brief.

## Luz y sombreado

- Luz única desde arriba, izquierda y frente. Nunca se mueve con el personaje.
- Cuatro bandas por material (sin degradados, sin dithering en el personaje).
- El brillo del visor es un recorte de papel fijo en el lado izquierdo anatómico arriba.
- Sin glow, neón ni brillo plástico.

## Líneas

- **Contorno exterior selectivo (sel-out):** abajo y a la derecha, tinta `#191613`; arriba y a la izquierda, la rampa profunda del material. Así la silueta se lee en fondo claro y oscuro sin verse caricatura gruesa.
- **Líneas de traslape:** cuando un brazo o pierna pasa frente al cuerpo, el pixel de atrás se oscurece a su rampa profunda.
- **Borde de papel:** 1 px kraft alrededor del visor y del parche.

## Calcomanías (decals)

Se leen sobre la superficie del modelo, por eso nunca se invierten:

- **Parche MOKI:** 184×72 u sobre la orejera derecha. A 128 px se lee el texto en una fuente de 15×5; a 64 px son dos trazos; a 32 px es una placa clara.
- **Emblema de mando:** 140×80 u en el pecho. A 128 px es un dibujo de 14×8 con cruceta y botones; a 64 px es asimétrico a propósito para que no lea como cara.
- **Motas naranjas:** visor y botas, 3-5 % de cobertura, estables por pieza (no «hierven» entre cuadros).

## Proporciones clave (u)

corona 1000 · base del casco 535 · cintura 335 · entrepierna 265 · rodilla 175 · bota 95 · suelo 0 · ancho de casco 525 (635 con orejeras) · visor 445×250.

## Exportación

- 12 fps («en dos»). La animación se escribe en segundos y se muestrea; cuadros idénticos seguidos se funden en uno con más duración (holds automáticos).
- Atlas en rejilla por tamaño y vista (`dist/sprites/{size}/moki-{size}-{facing}.png/.json`), máximo 4096 px de ancho.
- Nombres de tiras: `moki_{clip}_{vista}_strip{N}.png`.
- Nombres de producción del brief para piezas nuevas: `moki_{scope}_{subject}_{view_or_action}_v{NNN}_{state}.{ext}`.

## Revisión antes de usar (adaptado del QA del brief)

1. **Identidad:** frente y ambos lados a tamaño de miniatura. Falla si el parche está del lado equivocado.
2. **Silueta:** el casco se lee primero, luego manos y pies.
3. **Material:** sin brillo plástico ni luz fija pegada al color.
4. **Movimiento:** loops sin saltos; los pies no patinan a la velocidad del motor.
5. **Legibilidad:** a tamaño final, la acción se entiende sin texto.
