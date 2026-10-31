const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('mokiDesktop', {
  config: () => ipcRenderer.invoke('moki:config'),
  hover: (over) => ipcRenderer.send('moki:hover', !!over),
  move: (x, y) => ipcRenderer.send('moki:move', { x, y }),
  onEvent: (fn) => ipcRenderer.on('moki:event', (_e, ev) => fn(ev)),
});
