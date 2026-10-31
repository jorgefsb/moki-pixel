// Moki · mascota de escritorio (macOS, Windows, Linux incl. Omarchy/Hyprland)
// Hecho con amor por JorgeSuarez.com.mx para explorar y jugar con IA y videojuegos.
const { app, BrowserWindow, Tray, Menu, ipcMain, screen, nativeImage, shell, clipboard } = require('electron');
const path = require('node:path');
const fs = require('node:fs');
const os = require('node:os');
const { execFile } = require('node:child_process');
const { startHookServer, PORT, CLAUDE_HOOKS_SNIPPET } = require('./hooks');

if (!app.requestSingleInstanceLock()) app.quit();

const isMac = process.platform === 'darwin';
const isWin = process.platform === 'win32';
const isLinux = process.platform === 'linux';
const isHyprland = isLinux && !!process.env.HYPRLAND_INSTANCE_SIGNATURE;
// Modo «overlay»: una capa transparente del tamaño del escritorio que deja pasar los clics (macOS/Windows).
// Modo «window»: una ventanita que se mueve (Linux: X11 y Wayland/Hyprland no garantizan clic a través).
const MODE = process.env.MOKI_MODE || (isLinux ? 'window' : 'overlay');
const WIN_W = 220, WIN_H = 230;

const settingsFile = () => path.join(app.getPath('userData'), 'settings.json');
let settings = { juice: 'mucho', sound: true, autostart: false, visible: true, size: 64, scale: 2 };
try { settings = { ...settings, ...JSON.parse(fs.readFileSync(settingsFile(), 'utf8')) }; } catch {}
const save = () => { try { fs.mkdirSync(path.dirname(settingsFile()), { recursive: true }); fs.writeFileSync(settingsFile(), JSON.stringify(settings, null, 2)); } catch {} };

let win, tray;

function createWindow() {
  const d = screen.getPrimaryDisplay();
  const wa = d.workArea;
  const common = {
    transparent: true, frame: false, resizable: false, movable: false, hasShadow: false,
    alwaysOnTop: true, skipTaskbar: true, focusable: true, fullscreenable: false, show: false,
    backgroundColor: '#00000000', title: 'Moki Pet',
    webPreferences: { preload: path.join(__dirname, 'preload.js'), contextIsolation: true, nodeIntegration: false, sandbox: true },
  };
  win = MODE === 'overlay'
    ? new BrowserWindow({ ...common, x: wa.x, y: wa.y, width: wa.width, height: wa.height })
    : new BrowserWindow({ ...common, x: wa.x + Math.round(wa.width * 0.7), y: wa.y + wa.height - WIN_H, width: WIN_W, height: WIN_H });
  win.setAlwaysOnTop(true, isMac ? 'screen-saver' : 'floating');
  if (isMac) win.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
  if (MODE === 'overlay') win.setIgnoreMouseEvents(true, { forward: true });
  win.loadFile(path.join(__dirname, 'renderer', 'index.html'), { query: { mode: MODE } });
  win.once('ready-to-show', () => { if (settings.visible) win.showInactive(); });
  win.webContents.setWindowOpenHandler(({ url }) => { shell.openExternal(url); return { action: 'deny' }; });
}

// ---- IPC ----
ipcMain.handle('moki:config', () => {
  const wa = screen.getPrimaryDisplay().workArea;
  return { mode: MODE, workArea: wa, settings, platform: process.platform, hyprland: isHyprland, port: PORT };
});
ipcMain.on('moki:hover', (_e, over) => { if (MODE === 'overlay' && win) win.setIgnoreMouseEvents(!over, { forward: true }); });
let lastMove = 0;
ipcMain.on('moki:move', (_e, { x, y }) => {
  if (MODE !== 'window' || !win) return;
  x = Math.round(x); y = Math.round(y);
  if (isHyprland) {
    // En Wayland las apps no se posicionan solas: se lo pedimos a Hyprland (máx. ~30/s)
    const now = Date.now();
    if (now - lastMove < 33) return;
    lastMove = now;
    execFile('hyprctl', ['dispatch', 'movewindowpixel', `exact ${x} ${y},title:^(Moki Pet)$`], () => {});
  } else {
    win.setPosition(x, y, false);
  }
});

// ---- Bandeja ----
function trayIcon() {
  const p = path.join(__dirname, 'build', isMac ? 'trayTemplate.png' : 'tray.png');
  const img = nativeImage.createFromPath(p);
  return img.isEmpty() ? nativeImage.createFromPath(path.join(__dirname, 'build', 'icon.png')).resize({ width: 18, height: 18 }) : img;
}
function send(type, extra = {}) { win?.webContents.send('moki:event', { type, ...extra }); }
function buildMenu() {
  const lvl = (id, label) => ({ label, type: 'radio', checked: settings.juice === id, click: () => { settings.juice = id; save(); send('juice', { level: id }); } });
  return Menu.buildFromTemplate([
    { label: settings.visible ? 'Esconder a Moki' : 'Mostrar a Moki', click: () => { settings.visible = !settings.visible; save(); settings.visible ? win.showInactive() : win.hide(); tray.setContextMenu(buildMenu()); } },
    { type: 'separator' },
    { label: 'Saludar', click: () => send('act', { clip: 'wave', say: '¡Hola!' }) },
    { label: 'Celebrar', click: () => send('act', { clip: 'celebrate' }) },
    { label: 'Bailar', click: () => send('act', { clip: 'dance' }) },
    { label: 'Malabares', click: () => send('act', { clip: 'juggling' }) },
    { label: 'Dormir', click: () => send('act', { clip: 'sleep' }) },
    { type: 'separator' },
    { label: 'Nivel de juego', submenu: [lvl('nada', 'Nada (quieto)'), lvl('poquito', 'Poquito'), lvl('mucho', 'Mucho'), lvl('hardcore', 'Hardcore')] },
    { label: 'Sonido', type: 'checkbox', checked: settings.sound, click: (m) => { settings.sound = m.checked; save(); send('sound', { on: m.checked }); } },
    { label: 'Iniciar con el sistema', type: 'checkbox', checked: settings.autostart, click: (m) => { settings.autostart = m.checked; save(); setAutostart(m.checked); } },
    { type: 'separator' },
    { label: 'Copiar hooks de Claude Code', click: () => clipboard.writeText(CLAUDE_HOOKS_SNIPPET) },
    { label: 'Abrir moki.jorgesuarez.com.mx/pixel', click: () => shell.openExternal('https://moki.jorgesuarez.com.mx/pixel/') },
    { type: 'separator' },
    { label: 'Salir', role: 'quit' },
  ]);
}

// ---- Autoarranque ----
function setAutostart(on) {
  if (isLinux) {
    const dir = path.join(os.homedir(), '.config', 'autostart');
    const file = path.join(dir, 'moki-pet.desktop');
    if (on) {
      fs.mkdirSync(dir, { recursive: true });
      const exec = process.env.APPIMAGE || process.execPath;
      fs.writeFileSync(file, `[Desktop Entry]\nType=Application\nName=Moki\nExec="${exec}"\nX-GNOME-Autostart-enabled=true\nComment=Moki, mascota pixel art\n`);
    } else { try { fs.unlinkSync(file); } catch {} }
  } else {
    app.setLoginItemSettings({ openAtLogin: on, openAsHidden: true });
  }
}

app.whenReady().then(() => {
  if (isMac) app.dock?.hide();
  createWindow();
  tray = new Tray(trayIcon());
  tray.setToolTip('Moki');
  tray.setContextMenu(buildMenu());
  startHookServer((ev) => send('hook', ev));
  screen.on('display-metrics-changed', () => {
    if (MODE === 'overlay' && win) win.setBounds(screen.getPrimaryDisplay().workArea);
    send('resize', { workArea: screen.getPrimaryDisplay().workArea });
  });
});
app.on('second-instance', () => { settings.visible = true; win?.showInactive(); send('act', { clip: 'wave', say: '¡Aquí ando!' }); });
app.on('window-all-closed', (e) => e.preventDefault());
