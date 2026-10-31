# Guía de personaje · Moki

Fuentes: BrandKit JorgeSuarez.com.mx 0.6 (sección Moki), Moki Biblia de Personaje y Mundo 0.1, Moki Production Brief 0.1 y decisiones posteriores del 12 de octubre de 2026. Copias en [`assets/reference/`](../assets/reference).

## Quién es

«Moki soy yo.» Moki es el alter ego explorador de Jorge Suárez: un viajero cósmico, gamer, creador de videojuegos y emprendedor que usa IA. Descubre, se equivoca y construye mundos mientras aprende.

- **Rasgos:** curioso, capaz, cercano, aprende de los intentos.
- **Evitar:** torpeza permanente, agresividad permanente, infalibilidad, resultados de negocio inventados.
- **Relación con Jorge:** Jorge sigue siendo el protagonista de su marca. Moki puede protagonizar una lección o un juego sin reemplazar el rostro ni la firma de Jorge.
- **Temas, en este orden:** videojuegos → negocios → IA.
- **Públicos, en este orden:** gamers → gamedevs → emprendedores y empresarios.

## Canon visual

| Id | Regla | Estado |
|---|---|---|
| C01 | Papel y cartón en capas mates con fibra, cortes, pliegues y sombra de contacto | Dirección aprobada |
| C02 | Casco crema con franja naranja central; visor oscuro opaco; traje naranja; guantes y botas oscuros; arnés petróleo; suelas y rodilleras claras | Dirección aprobada |
| C03 | MOKI solo sobre la oreja derecha anatómica. Nada en frente del casco, pecho, mochila o lateral izquierdo. Nunca espejar | **Aprobado** |
| C04 | Emblema de mando genérico fijo en el pecho, independiente del control que sostiene | **Aprobado** |
| C05 | Motas naranjas visibles sobre visor y botas | Dirección aprobada |
| C06 | Visor sin ojos, cejas, boca o emoticonos; expresar con postura, gesto y ritmo | Dirección aprobada |
| C07 | Acción y texto nítidos; borde de estudio naranja según contexto | Dirección aprobada |

El diseño de Moki (incluida la hoja de cinco vistas y la espalda) quedó aprobado por Jorge el 12 de octubre de 2026.

### Cómo lo traduce el pixel art

- **C01 papel:** contorno selectivo, borde kraft de 1 px alrededor del visor y del parche, suelo de cartón en escenas. A 32 y 64 px la fibra no cabe; se sugiere con el color, no con ruido.
- **C03 lateralidad:** el modelo usa ejes reales del personaje. Mirando a la derecha vemos su lado derecho con orejera y parche; mirando a la izquierda vemos la orejera sin parche. Las vistas izquierdas se generan, nunca se espejan.
- **C05 motas:** 3 % del visor a 128 px; a 64 px solo en la mitad baja del visor, porque dos motas alineadas arriba leerían como ojos y romperían C06.
- **C06 sin rostro:** el brillo del visor es un recorte de papel en su lado izquierdo arriba. Nunca se anima como ojo ni parpadea.

## Cómo expresa Moki

Canales de expresión (brief, acting): inclinación del casco, dirección del torso, gesto de manos, apoyo de pies y timing.

| Emoción | Cuerpo | Clip | Emote opcional |
|---|---|---|---|
| Curiosidad | casco ladeado 8-12°, se acerca, mano exploradora | `curious` | `question` |
| Decisión | peso adelante, dirección clara | `decision`, `nod` | `check` |
| Duda | pausa, retrocede un poco, manos abiertas | `doubt` | `question` |
| Logro | torso abierto, brazos arriba, el peso regresa al centro | `celebrate`, `idea` | `star`, `idea` |
| Frustración | ritmo lento, eje bajo, sin lágrimas | `frustrated` | `scribble` |
| Reto de juego | guardia contextual, nunca agresión permanente | `ready`, `attack` | `bang` |
| Descanso | sentado, respiración lenta | `sit`, `sleep` | `zz` |
| «¡Ay!» | brinca, se voltea, mueve las pompis | `ay` | `ay` |

Las burbujas van **sobre** el casco (ancla `head_top`), nunca dentro del visor.

## Cómo habla (burbujas)

- Español mexicano, corto y cercano: «¡Hola!», «¿Jugamos?», «Ando probando cosas», «¡Listo!», «Otra vez, pero mejor».
- Una idea por burbuja. Máximo unas 5 palabras.
- Sin superlativos ni promesas: Moki no vende, invita a jugar y a intentar.
- Kaizen & Play: equivocarse está bien si se aprende algo.

## Sí y no

| Sí | No |
|---|---|
| Usar el atlas de la vista correcta | `flipX`, `scaleX(-1)` o espejar en el editor |
| Escalar ×2, ×3, ×4 con vecino más cercano | Escalar ×1.5 o con suavizado |
| Emotes en burbuja sobre el casco | Dibujar ojos, boca o caritas en el visor |
| Control en las manos como prop aparte | Mover el emblema del pecho o quitarlo |
| Dar crédito: «Moki por JorgeSuarez.com.mx» | Usar a Moki para respaldar productos o personas |
| Moki que intenta, falla y vuelve a intentar | Moki infalible, burlón o agresivo |
