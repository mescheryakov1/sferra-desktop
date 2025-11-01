const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('desktopAPI', {
  ping: () => ipcRenderer.invoke('ping'),
  onDebugLog: (callback) => {
    if (typeof callback !== 'function') {
      return () => {};
    }

    const listener = (_event, message) => {
      try {
        callback(message);
      } catch (error) {
        console.error('Error while handling debug log message in renderer context', error);
      }
    };

    ipcRenderer.on('debug-log', listener);

    return () => {
      ipcRenderer.removeListener('debug-log', listener);
    };
  }
});
