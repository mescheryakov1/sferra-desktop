const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');

const createWindow = () => {
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, '../preload/preload.js'),
      contextIsolation: true
    }
  });

  mainWindow.setMenuBarVisibility(false);
  mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));

  const sendDebugLog = (message) => {
    if (!message || mainWindow.isDestroyed()) {
      return;
    }

    const { webContents } = mainWindow;
    if (!webContents || webContents.isDestroyed()) {
      return;
    }

    try {
      webContents.send('debug-log', `[main] ${message}`);
    } catch (error) {
      console.error('Unable to forward debug log to renderer', error);
    }
  };

  const { webContents } = mainWindow;

  webContents.on('did-start-loading', () => {
    sendDebugLog('did-start-loading');
  });

  webContents.on('did-stop-loading', () => {
    sendDebugLog('did-stop-loading');
  });

  webContents.on('did-start-navigation', (_event, url, isInPlace, isMainFrame) => {
    sendDebugLog(`did-start-navigation -> ${url} (mainFrame=${isMainFrame}, inPlace=${isInPlace})`);
  });

  webContents.on('will-navigate', (_event, url) => {
    sendDebugLog(`will-navigate -> ${url}`);
  });

  webContents.on('did-redirect-navigation', (_event, url, isInPlace, isMainFrame) => {
    sendDebugLog(`did-redirect-navigation -> ${url} (mainFrame=${isMainFrame}, inPlace=${isInPlace})`);
  });

  webContents.on(
    'did-get-redirect-request',
    (_event, oldURL, newURL, isMainFrame, httpResponseCode, requestMethod, referrer, headers, resourceType) => {
      if (resourceType !== 'mainFrame' && resourceType !== 'subFrame') {
        return;
      }
      sendDebugLog(
        `did-get-redirect-request -> ${requestMethod} ${oldURL} => ${newURL} (status=${httpResponseCode}, mainFrame=${isMainFrame}, resourceType=${resourceType}, referrer=${referrer || 'n/a'})`
      );
      if (headers && Object.keys(headers).length > 0) {
        sendDebugLog(`redirect-response-headers: ${JSON.stringify(headers)}`);
      }
    }
  );

  webContents.on(
    'did-get-response-details',
    (_event, status, newURL, originalURL, httpResponseCode, requestMethod, referrer, responseHeaders, resourceType) => {
      if (resourceType !== 'mainFrame' && resourceType !== 'subFrame') {
        return;
      }
      sendDebugLog(
        `did-get-response-details -> ${requestMethod} ${originalURL} => ${newURL} (status=${httpResponseCode}, success=${status}, resourceType=${resourceType}, referrer=${referrer || 'n/a'})`
      );
      if (responseHeaders && Object.keys(responseHeaders).length > 0) {
        sendDebugLog(`response-headers: ${JSON.stringify(responseHeaders)}`);
      }
    }
  );

  webContents.on('did-navigate', (_event, url, httpResponseCode, httpStatusText) => {
    const statusText = httpStatusText ? ` ${httpStatusText}` : '';
    sendDebugLog(`did-navigate -> ${url} (status=${httpResponseCode || 'n/a'}${statusText})`);
  });

  webContents.on('did-navigate-in-page', (_event, url, isMainFrame) => {
    sendDebugLog(`did-navigate-in-page -> ${url} (mainFrame=${isMainFrame})`);
  });

  webContents.on('did-frame-finish-load', (_event, isMainFrame, frameProcessId, frameRoutingId) => {
    sendDebugLog(
      `did-frame-finish-load -> mainFrame=${isMainFrame}, frameProcessId=${frameProcessId}, frameRoutingId=${frameRoutingId}`
    );
  });

  webContents.on(
    'did-frame-navigate',
    (_event, url, httpResponseCode, httpStatusText, isMainFrame, frameProcessId, frameRoutingId) => {
      const statusText = httpStatusText ? ` ${httpStatusText}` : '';
      sendDebugLog(
        `did-frame-navigate -> ${url} (status=${httpResponseCode || 'n/a'}${statusText}, mainFrame=${isMainFrame}, frameProcessId=${frameProcessId}, frameRoutingId=${frameRoutingId})`
      );
    }
  );

  webContents.on('did-finish-load', () => {
    sendDebugLog(`did-finish-load -> ${webContents.getURL()}`);
  });

  webContents.on('dom-ready', () => {
    sendDebugLog('dom-ready event received');
  });

  webContents.on('did-fail-load', (_event, errorCode, errorDescription, validatedURL, isMainFrame) => {
    sendDebugLog(
      `did-fail-load -> ${validatedURL} (errorCode=${errorCode}, description=${errorDescription}, mainFrame=${isMainFrame})`
    );
  });

  webContents.on(
    'did-fail-provisional-load',
    (_event, errorCode, errorDescription, validatedURL, isMainFrame, frameProcessId, frameRoutingId) => {
      sendDebugLog(
        `did-fail-provisional-load -> ${validatedURL} (errorCode=${errorCode}, description=${errorDescription}, mainFrame=${isMainFrame}, frameProcessId=${frameProcessId}, frameRoutingId=${frameRoutingId})`
      );
    }
  );

  webContents.on('render-process-gone', (_event, details) => {
    const { reason, exitCode } = details || {};
    sendDebugLog(`render-process-gone -> reason=${reason || 'unknown'}, exitCode=${exitCode ?? 'n/a'}`);
  });

  webContents.on('unresponsive', () => {
    sendDebugLog('webContents became unresponsive');
  });

  webContents.on('responsive', () => {
    sendDebugLog('webContents is responsive again');
  });

  webContents.on('will-prevent-unload', () => {
    sendDebugLog('will-prevent-unload was triggered');
  });

  sendDebugLog('Main process debug instrumentation initialized');

  return mainWindow;
};

app.whenReady().then(() => {
  createWindow();
});

app.on('window-all-closed', () => {
  app.quit();
});

ipcMain.handle('ping', () => 'pong');
