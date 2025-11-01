const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('desktopAPI', {
  ping: () => ipcRenderer.invoke('ping')
});
