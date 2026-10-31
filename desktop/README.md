# Moki · mascota de escritorio

Moki vive en tu escritorio: camina por la orilla de abajo de la pantalla, se sienta, duerme si no haces nada, reacciona cuando le picas, lo puedes cargar y aventar, y se mueve con lo que hace Claude Code.

Plataformas: **macOS**, **Windows** y **Linux** (X11 y Wayland, con soporte para **Omarchy / Hyprland**).

## Instalar

Descarga de [Releases](https://github.com/jorgefsb/moki-pixel/releases):

| Sistema | Archivo |
|---|---|
| macOS (Apple Silicon e Intel) | `Moki-x.y.z-arm64.dmg` / `Moki-x.y.z.dmg` |
| Windows | `Moki Setup x.y.z.exe` o la versión portable |
| Linux | `Moki-x.y.z.AppImage`, `.deb` o `.pacman` (Arch / Omarchy) |

Los instaladores no están firmados todavía. En macOS: clic derecho → Abrir la primera vez. En Windows: «Más información → Ejecutar de todas formas».

Desde el código (Node 20+):

```bash
git clone https://github.com/jorgefsb/moki-pixel
cd moki-pixel/desktop
npm install
npm start
```

## Controles

- **Clic:** «¡Ay!» (brinca, se voltea y mueve las pompis). Tres clics rápidos: celebra.
- **Arrastrar:** lo cargas de la mochila; al soltarlo cae con física.
- **Bandeja / barra de menú:** mostrar u ocultar, saludar, celebrar, bailar, malabares, dormir, nivel de juego, sonido, iniciar con el sistema.
- Si no mueves el mouse en 60 s se sienta y se duerme. Al moverlo despierta.

## Claude Code

La app abre un servidor local en `http://127.0.0.1:47820` (solo tu compu; rechaza peticiones de navegadores). Desde la bandeja elige **Copiar hooks de Claude Code** y pégalo en `~/.claude/settings.json` (o en `.claude/settings.json` de tu proyecto). Queda así:

```json
{
  "hooks": {
    "UserPromptSubmit": [{ "hooks": [{ "type": "command", "command": "curl -s -m 1 --data-binary @- http://127.0.0.1:47820/claude >/dev/null 2>&1 || true" }] }],
    "PreToolUse": [{ "matcher": "*", "hooks": [{ "type": "command", "command": "curl -s -m 1 --data-binary @- http://127.0.0.1:47820/claude >/dev/null 2>&1 || true" }] }],
    "Notification": [{ "hooks": [{ "type": "command", "command": "curl -s -m 1 --data-binary @- http://127.0.0.1:47820/claude >/dev/null 2>&1 || true" }] }],
    "Stop": [{ "hooks": [{ "type": "command", "command": "curl -s -m 1 --data-binary @- http://127.0.0.1:47820/claude >/dev/null 2>&1 || true" }] }]
  }
}
```

| Evento de Claude Code | Moki |
|---|---|
| SessionStart | saluda |
| UserPromptSubmit | piensa (…) |
| PreToolUse Edit / Write | teclea en su laptop |
| PreToolUse Bash | construye con martillo |
| PreToolUse Read / Grep / Glob | curioso |
| PreToolUse WebSearch / WebFetch | mira alrededor |
| PreToolUse Task / Agent | malabares |
| Notification | te llama (!) con el mensaje |
| Stop | celebra «¡Listo!» |
| SessionEnd | se duerme |

También puedes mandarle cualquier cosa:

```bash
curl -s "http://127.0.0.1:47820/event?clip=dance&say=¡Deploy%20listo!"
```

## Linux y Omarchy (Hyprland)

En Linux, Moki usa una ventanita transparente que se mueve (Wayland no deja que las apps pongan su ventana donde quieran ni pasen clics a través). En Hyprland la app mueve la ventana con `hyprctl`. Agrega estas reglas a `~/.config/hypr/hyprland.conf` (en Omarchy: `~/.config/hypr/windows.conf` o el archivo de reglas que uses):

```ini
windowrulev2 = float, title:^(Moki Pet)$
windowrulev2 = pin, title:^(Moki Pet)$
windowrulev2 = noborder, title:^(Moki Pet)$
windowrulev2 = noshadow, title:^(Moki Pet)$
windowrulev2 = noblur, title:^(Moki Pet)$
windowrulev2 = noanim, title:^(Moki Pet)$
windowrulev2 = size 220 230, title:^(Moki Pet)$
```

Para iniciar con la sesión en Omarchy también puedes poner `exec-once = /ruta/a/Moki.AppImage` en tu configuración de Hyprland.

Variables útiles: `MOKI_MODE=overlay` (forzar capa completa en X11 con compositor), `MOKI_PORT=47821` (otro puerto).

## Estado

Versión 0.1.0, sin probar todavía en hardware físico de las tres plataformas. Ver [docs/estado.md](../docs/estado.md).
